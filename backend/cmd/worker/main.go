package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/worker"
)

func main() {
	_ = godotenv.Load() // fine if .env doesn't exist

	// Setup JSON structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("configuration error", "error", err)
		os.Exit(1)
	}

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer func() { _ = database.Close() }()

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(25)
	database.SetConnMaxLifetime(5 * time.Minute)

	// Run any pending database migrations.
	// The worker also runs migrations on startup so the correct schema is
	// guaranteed regardless of which process starts first.
	if err := db.RunMigrations(database, "migrations"); err != nil {
		logger.Error("database migration failed", "error", err)
		os.Exit(1)
	}

	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		logger.Error("invalid REDIS_URL", "error", err)
		os.Exit(1)
	}

	// S3 Client
	s3Client, err := storage.NewS3Client(context.Background(), cfg)
	if err != nil {
		logger.Error("failed to create S3 client", "error", err)
		os.Exit(1)
	}

	aiClient := ai.NewClient(cfg.AnthropicAPIKey)

	// Scraper Scheduler
	scraperOpts := scraper.DefaultSchedulerOptions()
	scraperOpts.Sources = []scraper.BestsellerSource{
		scraper.NewAmazonSource(30*time.Second, cfg.ScraperAPIKey),
	}
	scraperScheduler := scraper.NewScheduler(database, aiClient, scraperOpts)
	scraperScheduler.Start()

	// Asynq Worker Server
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: opt.Addr},
		asynq.Config{
			Concurrency: 5,
			Queues: map[string]int{
				"default": 1,
			},
			// ErrorHandler runs whenever a task fails an attempt.
			// If it has exhausted all retries (or panicked, which counts as a failure),
			// we update the database status so the frontend isn't polling forever.
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				retried, _ := asynq.GetRetryCount(ctx)
				maxRetry, _ := asynq.GetMaxRetry(ctx)
				if retried >= maxRetry {
					// Task has failed for the final time and will be archived.
					// Extract the cover_id from the payload to mark it failed.
					var payload worker.ProcessCoverPayload
					if unmarshalErr := json.Unmarshal(task.Payload(), &payload); unmarshalErr == nil {
						_, _ = database.Exec(`UPDATE covers SET status = 'failed' WHERE id = $1`, payload.CoverID)
						logger.Error("task exhausted all retries, marked cover as failed", "cover_id", payload.CoverID, "error", err)
					}
				}
			}),
		},
	)

	processor := worker.NewProcessor(database, s3Client, aiClient)

	mux := asynq.NewServeMux()
	mux.HandleFunc(worker.TypeProcessCover, processor.ProcessTaskProcessCover)

	// Graceful shutdown setup
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("Starting worker server")
		if err := srv.Run(mux); err != nil {
			logger.Error("worker server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-quit
	logger.Info("Shutting down worker...")
	scraperScheduler.Stop()
	srv.Stop() // asynq server stop is graceful
	logger.Info("Worker exiting")
}

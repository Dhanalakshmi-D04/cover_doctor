package main

import (
	"context"
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
	defer database.Close()

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

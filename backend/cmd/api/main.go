package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/api"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/email"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
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
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("error closing database: %v", err)
		}
	}()

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(25)
	database.SetConnMaxLifetime(5 * time.Minute)

	// Run any pending database migrations before the server starts.
	// This ensures the schema is always up to date on every deploy.
	// Fail fast if migrations fail — starting with a broken schema causes
	// confusing errors deep inside request handlers.
	if err := db.RunMigrations(database, "migrations"); err != nil {
		logger.Error("database migration failed", "error", err)
		os.Exit(1)
	}

	// Redis client for rate limiting
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		logger.Error("invalid REDIS_URL", "error", err)
		os.Exit(1)
	}
	rdb := redis.NewClient(opt)
	defer func() {
		if err := rdb.Close(); err != nil {
			log.Printf("error closing redis: %v", err)
		}
	}()

	// Asynq client for enqueuing jobs
	taskQueue := asynq.NewClient(asynq.RedisClientOpt{Addr: opt.Addr})
	defer func() {
		if err := taskQueue.Close(); err != nil {
			log.Printf("error closing task queue: %v", err)
		}
	}()

	// S3 Client
	s3Client, err := storage.NewS3Client(context.Background(), cfg)
	if err != nil {
		logger.Error("failed to create S3 client", "error", err)
		os.Exit(1)
	}

	aiClient := ai.NewClient(cfg.AnthropicAPIKey)
	if !aiClient.Enabled() {
		logger.Warn("ANTHROPIC_API_KEY not set — style tagging/explanations will use deterministic fallbacks")
	}

	billingClient := billing.NewClient(cfg.PolarAccessToken)
	if !billingClient.Enabled() {
		logger.Warn("POLAR_ACCESS_TOKEN not set — billing endpoints will return an error until configured")
	}

	scraperOpts := scraper.DefaultSchedulerOptions()
	scraperOpts.Enabled = false // Background ticker runs in worker, API just triggers it manually
	scraperOpts.Sources = []scraper.BestsellerSource{
		scraper.NewAmazonSource(30*time.Second, cfg.ScraperAPIKey),
	}
	scraperScheduler := scraper.NewScheduler(database, aiClient, scraperOpts)

	emailClient := email.NewResendSender(cfg)

	router := api.NewRouter(database, rdb, cfg, aiClient, billingClient, s3Client, taskQueue, emailClient, scraperScheduler)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Graceful shutdown setup
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("Starting API server", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-quit
	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
	}

	logger.Info("Server exiting")
}

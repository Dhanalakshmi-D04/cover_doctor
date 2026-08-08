package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/api"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

func main() {
	_ = godotenv.Load() // fine if .env doesn't exist (e.g. in production)

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("configuration error: %v", err)
	}

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatalf("failed to create upload directory: %v", err)
	}

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()

	aiClient := ai.NewClient(cfg.AnthropicAPIKey)
	if !aiClient.Enabled() {
		log.Println("warning: ANTHROPIC_API_KEY not set — style tagging/explanations will use deterministic fallbacks")
	}

	billingClient := billing.NewClient(cfg.StripeSecretKey)
	if !billingClient.Enabled() {
		log.Println("warning: STRIPE_SECRET_KEY not set — billing endpoints will return an error until configured")
	}

	router := api.NewRouter(database, cfg, aiClient, billingClient, uploadDir)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

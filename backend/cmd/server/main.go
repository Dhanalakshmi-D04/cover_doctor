package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/api"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

func main() {
	_ = godotenv.Load() // fine if .env doesn't exist (e.g. in production)

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required (see backend/.env)")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatalf("failed to create upload directory: %v", err)
	}

	database, err := db.Connect(databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()

	router := api.NewRouter(database, uploadDir)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

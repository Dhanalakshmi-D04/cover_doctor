package api

import (
	"github.com/hibiken/asynq"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
)

// Handler holds shared dependencies for all API handlers.
type Handler struct {
	DB               *sqlx.DB
	Storage          *storage.S3Client
	TaskQueue        *asynq.Client
	Config           *config.Config
	AI               *ai.Client
	Billing          *billing.Client
	ScraperScheduler *scraper.Scheduler
}

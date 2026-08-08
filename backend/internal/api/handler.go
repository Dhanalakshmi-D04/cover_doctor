package api

import (
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
)

// Handler holds shared dependencies for all API handlers.
type Handler struct {
	DB               *sqlx.DB
	UploadDir        string
	Config           *config.Config
	AI               *ai.Client
	Billing          *billing.Client
	ScraperScheduler *scraper.Scheduler
}

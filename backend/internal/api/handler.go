package api

import "github.com/jmoiron/sqlx"

// Handler holds shared dependencies for all API handlers.
type Handler struct {
	DB        *sqlx.DB
	UploadDir string
}

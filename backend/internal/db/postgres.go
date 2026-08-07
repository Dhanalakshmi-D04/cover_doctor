package db

import (
	"fmt"

	"github.com/jmoiron/sqlx"

	_ "github.com/jackc/pgx/v5/stdlib" // registers the "pgx" database/sql driver
)

// Connect opens a connection pool to Postgres using the given DSN
// (typically the DATABASE_URL environment variable).
func Connect(databaseURL string) (*sqlx.DB, error) {
	database, err := sqlx.Connect("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connecting to postgres: %w", err)
	}
	return database, nil
}

package db

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file" // registers the "file://" source driver
	"github.com/jmoiron/sqlx"
)

// RunMigrations applies any pending SQL migration files from migrationsPath
// to the database. It runs automatically at startup before the server accepts
// any requests, so you never deploy code against a stale schema.
//
// migrationsPath should be the path to the folder containing your *.up.sql and
// *.down.sql files — e.g. "migrations" when the binary runs from the project root.
//
// If all migrations are already applied, it logs a message and returns nil.
// If any migration fails, it returns an error and the caller should os.Exit(1).
func RunMigrations(database *sqlx.DB, migrationsPath string) error {
	// Create a postgres driver instance that golang-migrate will use to
	// track which migrations have run (via the schema_migrations table).
	driver, err := postgres.WithInstance(database.DB, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("creating postgres migration driver: %w", err)
	}

	// "file://" tells golang-migrate to read migration files from disk.
	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("initialising migrator from %q: %w", migrationsPath, err)
	}

	err = m.Up()
	if errors.Is(err, migrate.ErrNoChange) {
		// This is not an error — it just means the DB is already up to date.
		slog.Info("Database migrations: schema is up to date, no migrations applied")
		return nil
	}
	if err != nil {
		return fmt.Errorf("applying migrations: %w", err)
	}

	// Report the new schema version so it shows up in startup logs.
	version, _, _ := m.Version()
	slog.Info("Database migrations applied successfully", "schema_version", version)
	return nil
}

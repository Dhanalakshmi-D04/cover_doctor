package db

import (
	"fmt"

	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// InsertBenchmark inserts a single benchmark measurement into the database.
func InsertBenchmark(database *sqlx.DB, b *models.Benchmark) error {
	query := `
		INSERT INTO benchmarks (
			id, style, title_height_percent, contrast_ratio, whitespace_percent, created_at
		) VALUES (
			:id, :style, :title_height_percent, :contrast_ratio, :whitespace_percent, :created_at
		)`
	_, err := database.NamedExec(query, b)
	return err
}

// InsertBenchmarksBatch inserts multiple benchmark records in a single database transaction.
func InsertBenchmarksBatch(database *sqlx.DB, benchmarks []*models.Benchmark) error {
	if len(benchmarks) == 0 {
		return nil
	}
	tx, err := database.Beginx()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO benchmarks (
			id, style, title_height_percent, contrast_ratio, whitespace_percent, created_at
		) VALUES (
			:id, :style, :title_height_percent, :contrast_ratio, :whitespace_percent, :created_at
		)`

	for _, b := range benchmarks {
		if _, err := tx.NamedExec(query, b); err != nil {
			return fmt.Errorf("insert benchmark %s: %w", b.ID, err)
		}
	}

	return tx.Commit()
}

// GetBenchmarksByStyle fetches all reference cover measurements for a given visual style.
func GetBenchmarksByStyle(database *sqlx.DB, style string) ([]models.Benchmark, error) {
	var results []models.Benchmark
	err := database.Select(&results, `SELECT * FROM benchmarks WHERE style = $1 ORDER BY created_at DESC`, style)
	if err != nil {
		return nil, err
	}
	return results, nil
}

// GetAllBenchmarks fetches all benchmark measurements stored in the database.
func GetAllBenchmarks(database *sqlx.DB) ([]models.Benchmark, error) {
	var results []models.Benchmark
	err := database.Select(&results, `SELECT * FROM benchmarks ORDER BY style, created_at DESC`)
	if err != nil {
		return nil, err
	}
	return results, nil
}

// CountBenchmarks returns the total number of benchmark entries in the database.
func CountBenchmarks(database *sqlx.DB) (int, error) {
	var count int
	err := database.Get(&count, `SELECT COUNT(*) FROM benchmarks`)
	return count, err
}

// ClearBenchmarks removes all existing benchmark records (e.g. before replacing with a new quarterly snapshot).
func ClearBenchmarks(database *sqlx.DB) error {
	_, err := database.Exec(`DELETE FROM benchmarks`)
	return err
}

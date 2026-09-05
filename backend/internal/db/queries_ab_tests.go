package db

import (
	"log"

	"github.com/jmoiron/sqlx"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

func CreateABTest(database *sqlx.DB, test *models.ABTest) error {
	query := `INSERT INTO ab_tests (user_id, cover_a_id, cover_b_id, slug)
	          VALUES (:user_id, :cover_a_id, :cover_b_id, :slug)
	          RETURNING id, votes_a, votes_b, created_at`

	stmt, err := database.PrepareNamed(query)
	if err != nil {
		return err
	}
	defer func() {
		if err := stmt.Close(); err != nil {
			log.Printf("warn: failed to close prepared statement: %v", err)
		}
	}()

	return stmt.Get(test, test)
}

func GetABTestBySlug(database *sqlx.DB, slug string) (*models.ABTest, error) {
	var test models.ABTest
	if err := database.Get(&test, `SELECT * FROM ab_tests WHERE slug = $1`, slug); err != nil {
		return nil, err
	}
	return &test, nil
}

func GetABTestsByUserID(database *sqlx.DB, userID string) ([]models.ABTest, error) {
	var tests []models.ABTest
	if err := database.Select(&tests, `SELECT * FROM ab_tests WHERE user_id = $1 ORDER BY created_at DESC`, userID); err != nil {
		return nil, err
	}
	return tests, nil
}

func VoteABTest(database *sqlx.DB, slug string, vote string) error {
	var query string
	switch vote {
	case "A":
		query = `UPDATE ab_tests SET votes_a = votes_a + 1 WHERE slug = $1`
	case "B":
		query = `UPDATE ab_tests SET votes_b = votes_b + 1 WHERE slug = $1`
	default:
		return nil // invalid vote — silently ignore
	}

	_, err := database.Exec(query, slug)
	return err
}

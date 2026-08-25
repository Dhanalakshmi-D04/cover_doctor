package db

import (
	"database/sql"

	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// InsertCoverWithVersionTx stores a cover record. On the initial upload the record is
// "pending" with no scores. It calculates the correct VersionNumber inside a transaction
// with row locking on the parent book project, preventing race conditions from concurrent uploads.
func InsertCoverWithVersionTx(database *sqlx.DB, cover *models.Cover) error {
	tx, err := database.Beginx()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if cover.BookProjectID != nil {
		// Lock the parent book project to serialize inserts for this project
		var dummy string
		err := tx.Get(&dummy, `SELECT id FROM book_projects WHERE id = $1 FOR UPDATE`, *cover.BookProjectID)
		if err != nil {
			return err
		}

		var maxVersion sql.NullInt64
		err = tx.Get(&maxVersion, `SELECT MAX(version_number) FROM covers WHERE book_project_id = $1`, *cover.BookProjectID)
		if err != nil {
			return err
		}
		if !maxVersion.Valid {
			cover.VersionNumber = 1
		} else {
			cover.VersionNumber = int(maxVersion.Int64) + 1
		}
	} else {
		cover.VersionNumber = 1
	}

	query := `
		INSERT INTO covers (
			id, filename, user_id, book_project_id, version_number, status, job_id,
			image_width, image_height, style,
			title_text, title_height_percent, title_height_percentile, title_explanation,
			contrast_ratio, contrast_percentile, contrast_explanation,
			whitespace_percent, whitespace_percentile, whitespace_explanation,
			overall_score
		) VALUES (
			:id, :filename, :user_id, :book_project_id, :version_number, :status, :job_id,
			:image_width, :image_height, :style,
			:title_text, :title_height_percent, :title_height_percentile, :title_explanation,
			:contrast_ratio, :contrast_percentile, :contrast_explanation,
			:whitespace_percent, :whitespace_percentile, :whitespace_explanation,
			:overall_score
		) ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			style = EXCLUDED.style,
			title_text = EXCLUDED.title_text,
			title_height_percent = EXCLUDED.title_height_percent,
			title_height_percentile = EXCLUDED.title_height_percentile,
			title_explanation = EXCLUDED.title_explanation,
			contrast_ratio = EXCLUDED.contrast_ratio,
			contrast_percentile = EXCLUDED.contrast_percentile,
			contrast_explanation = EXCLUDED.contrast_explanation,
			whitespace_percent = EXCLUDED.whitespace_percent,
			whitespace_percentile = EXCLUDED.whitespace_percentile,
			whitespace_explanation = EXCLUDED.whitespace_explanation,
			overall_score = EXCLUDED.overall_score`

	_, err = tx.NamedExec(query, cover)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// UpdateCoverupserts the full results when the worker finishes.
func UpdateCover(database *sqlx.DB, cover *models.Cover) error {
	// Reusing the same query structure, but without the version logic.
	return InsertCoverWithVersionTx(database, cover)
}

// GetCoverByID fetches one cover's full report by its ID.
func GetCoverByID(database *sqlx.DB, id string) (*models.Cover, error) {
	var cover models.Cover
	if err := database.Get(&cover, `SELECT * FROM covers WHERE id = $1`, id); err != nil {
		return nil, err
	}
	return &cover, nil
}

// GetCoverByJobID looks up a cover by the Asynq job ID stored on it.
// Used by GET /jobs/:job_id so the frontend can poll processing status
// without knowing the cover_id ahead of time.
func GetCoverByJobID(database *sqlx.DB, jobID string) (*models.Cover, error) {
	var cover models.Cover
	if err := database.Get(&cover, `SELECT * FROM covers WHERE job_id = $1`, jobID); err != nil {
		return nil, err
	}
	return &cover, nil
}

// ListCoversByUserID retrieves all covers for a specific user.
func ListCoversByUserID(database *sqlx.DB, userID string) ([]models.Cover, error) {
	var covers []models.Cover
	err := database.Select(&covers, `SELECT * FROM covers WHERE user_id = $1`, userID)
	return covers, err
}

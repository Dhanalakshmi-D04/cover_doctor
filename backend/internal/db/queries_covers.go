package db

import (
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// InsertCover stores a fully-scored cover record.
func InsertCover(database *sqlx.DB, cover *models.Cover) error {
	query := `
		INSERT INTO covers (
			id, filename, user_id, book_project_id, version_number,
			image_width, image_height, style,
			title_text, title_height_percent, title_height_percentile, title_explanation,
			contrast_ratio, contrast_percentile, contrast_explanation,
			whitespace_percent, whitespace_percentile, whitespace_explanation,
			overall_score
		) VALUES (
			:id, :filename, :user_id, :book_project_id, :version_number,
			:image_width, :image_height, :style,
			:title_text, :title_height_percent, :title_height_percentile, :title_explanation,
			:contrast_ratio, :contrast_percentile, :contrast_explanation,
			:whitespace_percent, :whitespace_percentile, :whitespace_explanation,
			:overall_score
		)`

	_, err := database.NamedExec(query, cover)
	return err
}

// GetCoverByID fetches one cover's full report by its ID.
func GetCoverByID(database *sqlx.DB, id string) (*models.Cover, error) {
	var cover models.Cover
	if err := database.Get(&cover, `SELECT * FROM covers WHERE id = $1`, id); err != nil {
		return nil, err
	}
	return &cover, nil
}

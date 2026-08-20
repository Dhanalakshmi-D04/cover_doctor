package db

import (
	"database/sql"
	"log"

	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// CreateBookProject stores a new named project that cover versions can be
// grouped under.
func CreateBookProject(database *sqlx.DB, project *models.BookProject) error {
	query := `
		INSERT INTO book_projects (id, user_id, title)
		VALUES (:id, :user_id, :title)
		RETURNING created_at`

	rows, err := database.NamedQuery(query, project)
	if err != nil {
		return err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Printf("error closing rows: %v", err)
		}
	}()

	if rows.Next() {
		if err := rows.Scan(&project.CreatedAt); err != nil {
			return err
		}
	}
	return rows.Err()
}

// GetBookProjectByID fetches one book project by ID.
func GetBookProjectByID(database *sqlx.DB, id string) (*models.BookProject, error) {
	var project models.BookProject
	if err := database.Get(&project, `SELECT * FROM book_projects WHERE id = $1`, id); err != nil {
		return nil, err
	}
	return &project, nil
}

// ListCoverVersions returns every cover uploaded under a book project,
// oldest version first.
func ListCoverVersions(database *sqlx.DB, bookProjectID string) ([]models.Cover, error) {
	var covers []models.Cover
	err := database.Select(&covers, `
		SELECT * FROM covers
		WHERE book_project_id = $1
		ORDER BY version_number ASC`, bookProjectID)
	return covers, err
}

// ListBookProjectsByUserID returns all book projects created by a specific user.
func ListBookProjectsByUserID(database *sqlx.DB, userID string) ([]models.BookProject, error) {
	var projects []models.BookProject
	err := database.Select(&projects, `
		SELECT * FROM book_projects
		WHERE user_id = $1
		ORDER BY created_at DESC`, userID)
	return projects, err
}

// NextVersionNumber returns the next version number to assign for a new
// upload under an existing book project.
func NextVersionNumber(database *sqlx.DB, bookProjectID string) (int, error) {
	var maxVersion sql.NullInt64
	err := database.Get(&maxVersion, `SELECT MAX(version_number) FROM covers WHERE book_project_id = $1`, bookProjectID)
	if err != nil {
		return 0, err
	}
	if !maxVersion.Valid {
		return 1, nil
	}
	return int(maxVersion.Int64) + 1, nil
}

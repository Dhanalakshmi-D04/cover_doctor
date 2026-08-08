package db

import (
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// CreateUser stores a new account.
func CreateUser(database *sqlx.DB, user *models.User) error {
	query := `INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :password_hash)`
	_, err := database.NamedExec(query, user)
	return err
}

// GetUserByEmail looks up an account by email (used at login and signup).
func GetUserByEmail(database *sqlx.DB, email string) (*models.User, error) {
	var user models.User
	if err := database.Get(&user, `SELECT * FROM users WHERE email = $1`, email); err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID looks up an account by ID (used from the JWT claim).
func GetUserByID(database *sqlx.DB, id string) (*models.User, error) {
	var user models.User
	if err := database.Get(&user, `SELECT * FROM users WHERE id = $1`, id); err != nil {
		return nil, err
	}
	return &user, nil
}

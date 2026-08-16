package db

import (
	"fmt"

	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// CreateUserWithSubscription inserts a new user AND their default free
// subscription in a single database transaction.
//
// Why a transaction? Without one, if the server crashes or the subscription
// insert fails after the user row is already written, you end up with a user
// account that has no subscription row — the app would silently treat them
// as free-tier but queries expecting a row could behave unexpectedly.
// Rolling back on any failure keeps the DB consistent.
func CreateUserWithSubscription(database *sqlx.DB, user *models.User, subscriptionID string) error {
	tx, err := database.Beginx()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	// Rollback is a no-op if Commit already succeeded.
	defer tx.Rollback() //nolint:errcheck

	if _, err := tx.NamedExec(
		`INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :password_hash)`,
		user,
	); err != nil {
		return fmt.Errorf("insert user: %w", err)
	}

	if _, err := tx.Exec(
		`INSERT INTO subscriptions (id, user_id, plan, status) VALUES ($1, $2, 'free', 'active')`,
		subscriptionID, user.ID,
	); err != nil {
		return fmt.Errorf("insert subscription: %w", err)
	}

	return tx.Commit()
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

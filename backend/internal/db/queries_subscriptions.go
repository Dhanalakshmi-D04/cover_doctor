package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// EnsureFreeSubscription creates a default "free" subscription row for a
// brand new user.
func EnsureFreeSubscription(database *sqlx.DB, subscriptionID, userID string) error {
	query := `
		INSERT INTO subscriptions (id, user_id, plan, status)
		VALUES ($1, $2, 'free', 'active')`
	_, err := database.Exec(query, subscriptionID, userID)
	return err
}

// GetSubscriptionByUserID returns nil (not an error) if the user has no
// subscription row yet, so callers can treat "no row" the same as "free".
func GetSubscriptionByUserID(database *sqlx.DB, userID string) (*models.Subscription, error) {
	var sub models.Subscription
	err := database.Get(&sub, `SELECT * FROM subscriptions WHERE user_id = $1`, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &sub, nil
}

// UpdateSubscriptionByPolarID mirrors a Polar subscription's plan/status
// and billing period into the local table. Called from the webhook handler.
// Polar is always the source of truth; this only syncs, never originates changes.
// currentPeriodEnd may be nil if Polar didn't include it in the event (rare).
func UpdateSubscriptionByPolarID(database *sqlx.DB, polarSubscriptionID, plan, status string, currentPeriodEnd *time.Time) error {
	query := `
		UPDATE subscriptions
		SET plan = $1, status = $2, current_period_end = $3
		WHERE polar_subscription_id = $4`
	res, err := database.Exec(query, plan, status, currentPeriodEnd, polarSubscriptionID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// AttachPolarCustomer links a user's subscription row to a Polar
// customer/subscription pair, called after a successful checkout.
// plan should be the specific tier string (e.g. "starter", "creator", "publisher").
func AttachPolarCustomer(database *sqlx.DB, userID, polarCustomerID, polarSubscriptionID, plan string) error {
	query := `
		UPDATE subscriptions
		SET polar_customer_id = $1, polar_subscription_id = $2, plan = $4, status = 'active'
		WHERE user_id = $3`
	res, err := database.Exec(query, polarCustomerID, polarSubscriptionID, userID, plan)
	if err != nil {
		return err
	}
	
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		// Fallback for data corruption: user has no subscription row yet.
		// CreateUserWithSubscription normally pre-creates this, but we handle
		// it robustly here to guarantee payment activation.
		subID := uuid.New().String()
		insertQuery := `
			INSERT INTO subscriptions (id, user_id, polar_customer_id, polar_subscription_id, plan, status)
			VALUES ($1, $2, $3, $4, $5, 'active')`
		_, err = database.Exec(insertQuery, subID, userID, polarCustomerID, polarSubscriptionID, plan)
		return err
	}

	return nil
}

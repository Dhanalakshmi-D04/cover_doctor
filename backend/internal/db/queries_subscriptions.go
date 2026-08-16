package db

import (
	"database/sql"
	"errors"
	"time"

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

// UpdateSubscriptionByStripeID mirrors a Stripe subscription's plan/status
// and billing period into the local table. Called from the webhook handler.
// Stripe is always the source of truth; this only syncs, never originates changes.
// currentPeriodEnd may be nil if Stripe didn't include it in the event (rare).
func UpdateSubscriptionByStripeID(database *sqlx.DB, stripeSubscriptionID, plan, status string, currentPeriodEnd *time.Time) error {
	query := `
		UPDATE subscriptions
		SET plan = $1, status = $2, current_period_end = $3
		WHERE stripe_subscription_id = $4`
	_, err := database.Exec(query, plan, status, currentPeriodEnd, stripeSubscriptionID)
	return err
}

// AttachStripeCustomer links a user's subscription row to a Stripe
// customer/subscription pair, called after a successful checkout.
func AttachStripeCustomer(database *sqlx.DB, userID, stripeCustomerID, stripeSubscriptionID string) error {
	query := `
		UPDATE subscriptions
		SET stripe_customer_id = $1, stripe_subscription_id = $2, plan = 'paid', status = 'active'
		WHERE user_id = $3`
	_, err := database.Exec(query, stripeCustomerID, stripeSubscriptionID, userID)
	return err
}

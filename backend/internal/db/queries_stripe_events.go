package db

import (
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
)

// HasProcessedStripeEvent checks whether a given Stripe event ID has already
// been handled. Stripe retries webhook deliveries on failure, so before
// processing any event we check this table to avoid side effects (like
// upgrading a user twice) from duplicate deliveries.
func HasProcessedStripeEvent(database *sqlx.DB, eventID string) (bool, error) {
	var count int
	err := database.Get(&count, `SELECT COUNT(*) FROM processed_stripe_events WHERE event_id = $1`, eventID)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// MarkStripeEventProcessed records that we've handled this Stripe event.
// Call this only after all database changes for the event have succeeded.
func MarkStripeEventProcessed(database *sqlx.DB, eventID string) error {
	_, err := database.Exec(
		`INSERT INTO processed_stripe_events (event_id, processed_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		eventID, time.Now(),
	)
	return err
}

// ErrAlreadyProcessed is returned when a Stripe event has already been handled.
var ErrAlreadyProcessed = errors.New("stripe event already processed")

package db

import (
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
)

// HasProcessedPolarEvent checks whether a given Polar event ID has already
// been handled. Polar retries webhook deliveries on failure, so before
// processing any event we check this table to avoid side effects (like
// upgrading a user twice) from duplicate deliveries.
func HasProcessedPolarEvent(database *sqlx.DB, eventID string) (bool, error) {
	var count int
	err := database.Get(&count, `SELECT COUNT(*) FROM processed_polar_events WHERE event_id = $1`, eventID)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// MarkPolarEventProcessed records that we've handled this Polar event.
// Call this only after all database changes for the event have succeeded.
func MarkPolarEventProcessed(database *sqlx.DB, eventID string) error {
	_, err := database.Exec(
		`INSERT INTO processed_polar_events (event_id, processed_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		eventID, time.Now(),
	)
	return err
}

// ErrAlreadyProcessed is returned when a Polar event has already been handled.
var ErrAlreadyProcessed = errors.New("polar event already processed")

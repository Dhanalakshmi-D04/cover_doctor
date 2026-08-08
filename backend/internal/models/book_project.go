package models

import "time"

// BookProject groups multiple cover versions together for Evolution
// Tracking (a paid feature — see docs/05-pricing-and-plans.md). Grouping
// is always explicit: the user creates a project and attaches uploads to
// it, rather than the system guessing which uploads belong together.
type BookProject struct {
	ID        string    `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	Title     string    `db:"title" json:"title"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

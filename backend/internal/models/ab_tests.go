package models

import "time"

type ABTest struct {
	ID        string    `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	CoverAID  string    `db:"cover_a_id" json:"cover_a_id"`
	CoverBID  string    `db:"cover_b_id" json:"cover_b_id"`
	Slug      string    `db:"slug" json:"slug"`
	VotesA    int       `db:"votes_a" json:"votes_a"`
	VotesB    int       `db:"votes_b" json:"votes_b"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

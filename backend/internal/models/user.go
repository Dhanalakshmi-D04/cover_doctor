package models

import "time"

// User is an account holder. Every user, free or paid, needs one — see
// docs/05-pricing-and-plans.md for why accounts are mandatory for both tiers.
type User struct {
	ID           string    `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

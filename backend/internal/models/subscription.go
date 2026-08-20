package models

import "time"

// Subscription tracks a user's plan. Polar is the source of truth for
// `status`, kept in sync via webhooks — see internal/billing.
type Subscription struct {
	ID                  string     `db:"id" json:"id"`
	UserID              string     `db:"user_id" json:"user_id"`
	PolarCustomerID     *string    `db:"polar_customer_id" json:"polar_customer_id,omitempty"`
	PolarSubscriptionID *string    `db:"polar_subscription_id" json:"polar_subscription_id,omitempty"`
	Plan                string     `db:"plan" json:"plan"` // "free" | "paid"
	Status              string     `db:"status" json:"status"`
	CurrentPeriodEnd    *time.Time `db:"current_period_end" json:"current_period_end,omitempty"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
}

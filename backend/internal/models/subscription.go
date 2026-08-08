package models

import "time"

// Subscription tracks a user's plan. Stripe is the source of truth for
// `status`, kept in sync via webhooks — see internal/billing.
type Subscription struct {
	ID                   string     `db:"id" json:"id"`
	UserID               string     `db:"user_id" json:"user_id"`
	StripeCustomerID     *string    `db:"stripe_customer_id" json:"stripe_customer_id,omitempty"`
	StripeSubscriptionID *string    `db:"stripe_subscription_id" json:"stripe_subscription_id,omitempty"`
	Plan                 string     `db:"plan" json:"plan"` // "free" | "paid"
	Status               string     `db:"status" json:"status"`
	CurrentPeriodEnd     *time.Time `db:"current_period_end" json:"current_period_end,omitempty"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
}

// Package billing is the ONLY place in this codebase that knows about
// plans, Stripe, or payment status — mirroring the isolation already used
// for the ai package. See docs/03-project-architecture.md and
// docs/05-pricing-and-plans.md.
package billing

import (
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// Plan is a user's subscription tier.
type Plan string

const (
	PlanFree Plan = "free"
	PlanPaid Plan = "paid"
)

// Check is the ONLY function in this codebase that decides what a user is
// allowed to see. Every api handler that needs to gate a response calls
// this rather than checking subscription status itself.
func Check(database *sqlx.DB, userID string) (Plan, error) {
	sub, err := db.GetSubscriptionByUserID(database, userID)
	if err != nil {
		return PlanFree, err
	}
	if sub == nil {
		return PlanFree, nil
	}
	if sub.Plan == string(PlanPaid) && (sub.Status == "active" || sub.Status == "trialing") {
		return PlanPaid, nil
	}
	return PlanFree, nil
}

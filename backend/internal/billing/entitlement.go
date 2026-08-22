// Package billing is the ONLY place in this codebase that knows about
// plans, Polar, or payment status — mirroring the isolation already used
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
	PlanFree      Plan = "free"
	PlanStarter   Plan = "starter"
	PlanCreator   Plan = "creator"
	PlanPublisher Plan = "publisher"
)

// MaxBookProjects returns the maximum number of book projects a user on this
// plan may own. PlanFree = 0 (pure paywall — no unpaid AI spend).
func MaxBookProjects(plan Plan) int {
	switch plan {
	case PlanStarter:
		return 1
	case PlanCreator:
		return 5
	case PlanPublisher:
		return 20
	default: // PlanFree and any unrecognised plan
		return 0
	}
}

// IsPaid reports whether the plan grants access to paid features.
func IsPaid(plan Plan) bool {
	return plan == PlanStarter || plan == PlanCreator || plan == PlanPublisher
}

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
	if sub.Status == "active" || sub.Status == "trialing" {
		switch Plan(sub.Plan) {
		case PlanStarter, PlanCreator, PlanPublisher:
			return Plan(sub.Plan), nil
		}
	}
	return PlanFree, nil
}

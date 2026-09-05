// Package billing is the ONLY place in this codebase that knows about
// plans, Polar, or payment status — mirroring the isolation already used
// for the ai package. See docs/03-project-architecture.md and
// docs/05-pricing-and-plans.md.
package billing

import (
	"strings"

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

// MaxCoversPerMonth returns the maximum number of cover re-checks a user on this
// plan may perform per project per month.
func MaxCoversPerMonth(plan Plan) int {
	switch plan {
	case PlanStarter:
		return 50
	case PlanCreator:
		return 150
	case PlanPublisher:
		return 500
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
//
// adminEmails is the list from config.Config.AdminEmails. Any user whose
// account email appears in that list is granted PlanPublisher automatically,
// bypassing the Polar subscription check entirely. Pass nil/empty slice in
// production when no admin bypass is configured.
func Check(database *sqlx.DB, userID string, adminEmails []string) (Plan, error) {
	// Admin bypass: look up the user's email and check the allowlist first.
	// This runs before any Polar/subscription query so it works even when
	// billing is not configured.
	if len(adminEmails) > 0 {
		user, err := db.GetUserByID(database, userID)
		if err == nil && isAdminEmail(user.Email, adminEmails) {
			return PlanPublisher, nil
		}
	}

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

// isAdminEmail reports whether email (case-insensitive) is in the allowlist.
func isAdminEmail(email string, adminEmails []string) bool {
	lower := strings.ToLower(strings.TrimSpace(email))
	for _, a := range adminEmails {
		if a == lower {
			return true
		}
	}
	return false
}

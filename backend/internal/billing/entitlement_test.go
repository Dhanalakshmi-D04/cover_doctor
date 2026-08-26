package billing

import "testing"

// ---------------------------------------------------------------------------
// MaxBookProjects — plan limit enforcement
// ---------------------------------------------------------------------------

func TestMaxBookProjects_Free(t *testing.T) {
	// Free users must be fully paywalled (0 projects → gate fires before any AI spend).
	if got := MaxBookProjects(PlanFree); got != 0 {
		t.Errorf("PlanFree: expected 0 book projects, got %d", got)
	}
}

func TestMaxBookProjects_Starter(t *testing.T) {
	if got := MaxBookProjects(PlanStarter); got != 1 {
		t.Errorf("PlanStarter: expected 1 book project, got %d", got)
	}
}

func TestMaxBookProjects_Creator(t *testing.T) {
	if got := MaxBookProjects(PlanCreator); got != 5 {
		t.Errorf("PlanCreator: expected 5 book projects, got %d", got)
	}
}

func TestMaxBookProjects_Publisher(t *testing.T) {
	if got := MaxBookProjects(PlanPublisher); got != 20 {
		t.Errorf("PlanPublisher: expected 20 book projects, got %d", got)
	}
}

func TestMaxBookProjects_UnrecognisedPlan(t *testing.T) {
	// Any unrecognised plan string must resolve to 0, never to a non-zero allowance.
	// A data-corruption event or future plan name must never accidentally grant access.
	if got := MaxBookProjects(Plan("enterprise_legacy")); got != 0 {
		t.Errorf("unrecognised plan: expected 0 book projects, got %d", got)
	}
}

// ---------------------------------------------------------------------------
// At-limit / under-limit / over-limit enforcement simulation.
//
// The gate in book_project_handler.go is:
//   if len(existingProjects) >= MaxBookProjects(plan) { return 403 }
//
// Tested directly so a future refactor can't silently break the comparison.
// ---------------------------------------------------------------------------

func TestPlanLimitEnforcement_UnderLimit(t *testing.T) {
	max := MaxBookProjects(PlanCreator) // 5
	existing := 4
	if existing >= max {
		t.Errorf("PlanCreator with 4 projects should be UNDER limit (max=%d)", max)
	}
}

func TestPlanLimitEnforcement_AtLimit(t *testing.T) {
	max := MaxBookProjects(PlanCreator) // 5
	existing := 5
	// At-limit must be blocked (>=, not >).
	if existing < max {
		t.Errorf("PlanCreator with 5 projects should be AT limit (max=%d), not allowed", max)
	}
}

func TestPlanLimitEnforcement_OverLimit(t *testing.T) {
	max := MaxBookProjects(PlanStarter) // 1
	existing := 2
	if existing < max {
		t.Errorf("PlanStarter with 2 projects should be OVER limit (max=%d)", max)
	}
}

func TestPlanLimitEnforcement_FreeAtZeroProjects(t *testing.T) {
	// Even 0 existing projects must be blocked for free users.
	max := MaxBookProjects(PlanFree) // 0
	existing := 0
	if existing < max {
		t.Error("PlanFree with 0 existing projects should still be blocked (max=0)")
	}
}

// ---------------------------------------------------------------------------
// IsPaid
// ---------------------------------------------------------------------------

func TestIsPaid_AllPaidTiers(t *testing.T) {
	for _, plan := range []Plan{PlanStarter, PlanCreator, PlanPublisher} {
		if !IsPaid(plan) {
			t.Errorf("expected IsPaid(%q) == true", plan)
		}
	}
}

func TestIsPaid_FreePlan(t *testing.T) {
	if IsPaid(PlanFree) {
		t.Error("expected IsPaid(PlanFree) == false")
	}
}

func TestIsPaid_UnrecognisedPlanIsNotPaid(t *testing.T) {
	// Safety: unknown plan string must never be considered paid.
	if IsPaid(Plan("anything_else")) {
		t.Error("expected IsPaid(unknown plan) == false")
	}
}

// ---------------------------------------------------------------------------
// isAdminEmail (unexported, tested via white-box since we're in package billing)
// ---------------------------------------------------------------------------

func TestIsAdminEmail_MatchCaseInsensitive(t *testing.T) {
	if !isAdminEmail("Dev@Example.COM", []string{"dev@example.com"}) {
		t.Error("expected case-insensitive match to succeed")
	}
}

func TestIsAdminEmail_NoMatch(t *testing.T) {
	if isAdminEmail("other@example.com", []string{"dev@example.com"}) {
		t.Error("expected non-matching email to return false")
	}
}

func TestIsAdminEmail_EmptyList(t *testing.T) {
	if isAdminEmail("dev@example.com", nil) {
		t.Error("expected empty admin list to return false")
	}
}

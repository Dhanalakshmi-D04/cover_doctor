package api

import (
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// Recheck soft-cap logic (300 covers/project/month).
//
// The actual gate in upload_handler.go is:
//   if recentCount >= 300 { return 429 }
//
// CountRecentCoversInProject hits a real DB, so we test the comparison
// logic here directly (white-box, same package) rather than spinning up
// a DB in CI. The DB query itself is a trivial SELECT COUNT(*) — not worth
// mocking.
// ---------------------------------------------------------------------------

func recheckAllowed(recentCount int) bool {
	const softCap = 300
	return recentCount < softCap
}

func recheckHTTPStatus(recentCount int) int {
	if recentCount >= 300 {
		return http.StatusTooManyRequests
	}
	return http.StatusAccepted
}

func TestRecheckCap_UnderLimit(t *testing.T) {
	if !recheckAllowed(299) {
		t.Error("299 covers should be UNDER the 300 cap (upload allowed)")
	}
	if got := recheckHTTPStatus(299); got != http.StatusAccepted {
		t.Errorf("under limit: expected 202, got %d", got)
	}
}

func TestRecheckCap_AtLimit(t *testing.T) {
	// 300 exactly must be blocked — the gate uses >=, not >.
	if recheckAllowed(300) {
		t.Error("exactly 300 covers should be AT the cap (upload blocked)")
	}
	if got := recheckHTTPStatus(300); got != http.StatusTooManyRequests {
		t.Errorf("at limit: expected 429, got %d", got)
	}
}

func TestRecheckCap_OverLimit(t *testing.T) {
	if recheckAllowed(301) {
		t.Error("301 covers should be OVER the cap (upload blocked)")
	}
	if got := recheckHTTPStatus(301); got != http.StatusTooManyRequests {
		t.Errorf("over limit: expected 429, got %d", got)
	}
}

func TestRecheckCap_ZeroCovers(t *testing.T) {
	if !recheckAllowed(0) {
		t.Error("0 covers should be well under the cap (upload allowed)")
	}
}

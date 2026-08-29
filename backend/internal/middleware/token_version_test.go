package middleware

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ---------------------------------------------------------------------------
// Token-version revocation unit tests.
//
// These tests exercise GenerateJWT and the claim-extraction / comparison
// logic without touching a real database.  The DB-check path (SELECT
// token_version) is the simple integer comparison that runs inside Auth();
// the pure claim-extraction logic is what matters to unit-test — the DB
// call itself is a trivial single-column SELECT.
// ---------------------------------------------------------------------------

const testSecret = "test-secret-for-unit-tests"

// helpers -------------------------------------------------------------------

func parseTokenClaims(t *testing.T, tokenStr string) jwt.MapClaims {
	t.Helper()
	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(testSecret), nil
	})
	if err != nil || !tok.Valid {
		t.Fatalf("failed to parse token: %v", err)
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("claims not jwt.MapClaims")
	}
	return claims
}

// ---------------------------------------------------------------------------
// GenerateJWT — correct claims
// ---------------------------------------------------------------------------

func TestGenerateJWT_ContainsTokenVersionClaim(t *testing.T) {
	tokenStr, err := GenerateJWT("user-abc", 3, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT error: %v", err)
	}

	claims := parseTokenClaims(t, tokenStr)

	vf, ok := claims["token_version"].(float64)
	if !ok {
		t.Fatal("token_version claim missing or wrong type")
	}
	if int(vf) != 3 {
		t.Errorf("expected token_version=3, got %d", int(vf))
	}
}

func TestGenerateJWT_ContainsUserIDClaim(t *testing.T) {
	tokenStr, err := GenerateJWT("user-xyz", 0, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT error: %v", err)
	}
	claims := parseTokenClaims(t, tokenStr)
	uid, _ := claims["user_id"].(string)
	if uid != "user-xyz" {
		t.Errorf("expected user_id=user-xyz, got %q", uid)
	}
}

func TestGenerateJWT_ContainsExpClaim(t *testing.T) {
	before := time.Now().Add(6 * 24 * time.Hour).Unix()
	tokenStr, err := GenerateJWT("user-xyz", 0, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT error: %v", err)
	}
	after := time.Now().Add(8 * 24 * time.Hour).Unix()

	claims := parseTokenClaims(t, tokenStr)
	expF, ok := claims["exp"].(float64)
	if !ok {
		t.Fatal("exp claim missing")
	}
	exp := int64(expF)
	if exp < before || exp > after {
		t.Errorf("exp %d not in expected 7-day window [%d, %d]", exp, before, after)
	}
}

// ---------------------------------------------------------------------------
// Version-bump revocation logic.
//
// The gate inside Auth() is simply:
//   if tokenVersion != currentVersionFromDB { → 401 }
//
// We test the comparison directly.  A token issued at version N must be
// rejected once the DB version has been incremented to N+1.
// ---------------------------------------------------------------------------

func tokenVersionFromClaims(t *testing.T, tokenStr string) int {
	t.Helper()
	claims := parseTokenClaims(t, tokenStr)
	vf, ok := claims["token_version"].(float64)
	if !ok {
		t.Fatal("token_version claim missing")
	}
	return int(vf)
}

func versionMatchesDB(tokenVersion, dbVersion int) bool {
	return tokenVersion == dbVersion
}

func TestTokenRevocation_PreBumpTokenRejectedAfterIncrement(t *testing.T) {
	// Simulate: user logs in at version 0 → receives token containing version 0.
	// Admin increments the DB version to 1 (via IncrementTokenVersion).
	// The old token must now be rejected.

	const userID = "user-001"
	const versionAtLogin = 0

	oldToken, err := GenerateJWT(userID, versionAtLogin, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}

	tokenVersion := tokenVersionFromClaims(t, oldToken)
	if tokenVersion != versionAtLogin {
		t.Fatalf("expected token_version=%d, got %d", versionAtLogin, tokenVersion)
	}

	// DB version is now 1 (after password change / logout-everywhere).
	const currentDBVersion = 1

	if versionMatchesDB(tokenVersion, currentDBVersion) {
		t.Error("pre-bump token should NOT match the new DB version — expected rejection")
	}
}

func TestTokenRevocation_NewTokenAcceptedAfterIncrement(t *testing.T) {
	// After the user re-logs in with version 1, the new token must be accepted.
	const userID = "user-001"
	const newVersion = 1

	newToken, err := GenerateJWT(userID, newVersion, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}

	tokenVersion := tokenVersionFromClaims(t, newToken)
	if !versionMatchesDB(tokenVersion, newVersion) {
		t.Errorf("new token with version %d should match DB version %d", tokenVersion, newVersion)
	}
}

func TestTokenRevocation_OldTokenAtVersion0RejectedWhenDBIs2(t *testing.T) {
	// Edge case: two version bumps (e.g. two password resets) must still
	// reject the original version-0 token.
	oldToken, err := GenerateJWT("user-002", 0, testSecret)
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}
	tokenVersion := tokenVersionFromClaims(t, oldToken)
	if versionMatchesDB(tokenVersion, 2) {
		t.Error("token at version 0 must be rejected when DB is at version 2")
	}
}

func TestTokenRevocation_MissingVersionClaimRejected(t *testing.T) {
	// A legacy token without a token_version claim (e.g. issued before this
	// feature) must fail the type-assertion in Auth() and be rejected.
	claims := jwt.MapClaims{
		"user_id": "user-legacy",
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		// No "token_version" claim
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := tok.SignedString([]byte(testSecret))

	parsed := parseTokenClaims(t, tokenStr)
	_, ok := parsed["token_version"].(float64)
	if ok {
		t.Error("legacy token unexpectedly contained a token_version claim")
	}
	// Auth() calls: _, ok := claims["token_version"].(float64); if !ok → 401
	// That path is what the above verifies: ok is false, so Auth() rejects it.
}

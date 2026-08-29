package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// googleUserInfo is the subset of Google's /userinfo response we care about.
type googleUserInfo struct {
	Sub           string `json:"sub"` // stable Google user ID
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
}

// googleOAuthConfig builds an oauth2.Config from the current Config.
// Returns nil if Google OAuth is not configured.
func (h *Handler) googleOAuthConfig() *oauth2.Config {
	if h.Config.GoogleClientID == "" || h.Config.GoogleClientSecret == "" || h.Config.GoogleRedirectURL == "" {
		return nil
	}
	return &oauth2.Config{
		ClientID:     h.Config.GoogleClientID,
		ClientSecret: h.Config.GoogleClientSecret,
		RedirectURL:  h.Config.GoogleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

// GoogleLogin handles GET /auth/google.
// Generates a cryptographically random CSRF state token, stores it in a
// short-lived HttpOnly cookie, then redirects the browser to Google's
// consent screen.
func (h *Handler) GoogleLogin(c *gin.Context) {
	conf := h.googleOAuthConfig()
	if conf == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google sign-in is not configured on this server"})
		return
	}

	// 16-byte random hex state — enough entropy to make CSRF infeasible.
	stateBytes := make([]byte, 16)
	if _, err := rand.Read(stateBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate CSRF state"})
		return
	}
	state := hex.EncodeToString(stateBytes)

	// Store state in a short-lived (10 min), HttpOnly, SameSite=Lax cookie.
	// SameSite=Lax is intentional: we need the cookie sent on the top-level
	// redirect back from Google, which Strict would block.
	cookieVal := fmt.Sprintf("oauth_state=%s; Max-Age=600; Path=/; HttpOnly; SameSite=Lax", state)
	if h.Config.IsProduction() {
		cookieVal += "; Secure"
	}
	c.Writer.Header().Set("Set-Cookie", cookieVal)

	authURL := conf.AuthCodeURL(state, oauth2.AccessTypeOnline)
	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

// GoogleCallback handles GET /auth/google/callback.
// Verifies the CSRF state, exchanges the code for a token, fetches user info,
// upserts the user record, then issues the same JWT+cookie as a normal login.
func (h *Handler) GoogleCallback(c *gin.Context) {
	conf := h.googleOAuthConfig()
	if conf == nil {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_not_configured")
		return
	}

	// ── CSRF state check ───────────────────────────────────────────────────
	cookieState, err := c.Cookie("oauth_state")
	if err != nil || cookieState == "" {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=missing_state")
		return
	}
	if c.Query("state") != cookieState {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=state_mismatch")
		return
	}

	// Clear the state cookie immediately — it's single-use.
	c.Writer.Header().Set("Set-Cookie", "oauth_state=; Max-Age=-1; Path=/; HttpOnly; SameSite=Lax")

	// ── Handle user-cancelled / Google-side errors ─────────────────────────
	if errParam := c.Query("error"); errParam != "" {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_cancelled")
		return
	}

	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_cancelled")
		return
	}

	// ── Exchange code for token ────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	oauthToken, err := conf.Exchange(ctx, code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_exchange_failed")
		return
	}

	// ── Fetch user info from Google ────────────────────────────────────────
	client := conf.Client(ctx, oauthToken)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil || resp.StatusCode != http.StatusOK {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_userinfo_failed")
		return
	}
	defer func() { _ = resp.Body.Close() }()

	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=google_userinfo_failed")
		return
	}

	// ── Reject unverified emails ───────────────────────────────────────────
	if !info.EmailVerified {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=email_not_verified")
		return
	}

	// ── Upsert user — create or link Google account ────────────────────────
	user, _, err := db.UpsertGoogleUser(h.DB, info.Email, info.Sub, uuid.New().String())
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=account_error")
		return
	}

	// ── Issue JWT cookie — identical to normal login ───────────────────────
	token, err := middleware.GenerateJWT(user.ID, user.TokenVersion, h.Config.JWTSecret)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"?error=token_error")
		return
	}
	setAuthCookie(c, token, h.Config.CookieDomain, h.Config.IsProduction())

	// Redirect to the root. The cookie is already set; the SPA will
	// detect authentication on the next getMe() call.
	c.Redirect(http.StatusTemporaryRedirect, h.Config.FrontendURL+"/")
}

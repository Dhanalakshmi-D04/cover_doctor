package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// GetAccount handles GET /account (also aliased as GET /user/plan).
// Returns the user's plan, project usage, and limit so the frontend can
// render "3 / 5 projects used" and decide whether to show the upgrade CTA.
// Also used for post-checkout polling — the frontend polls this endpoint
// until plan reflects the new subscription (webhook landing confirmation).
func (h *Handler) GetAccount(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	plan, err := billing.Check(h.DB, userID, h.Config.AdminEmails)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	projectCount, err := db.CountBookProjectsByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plan":          string(plan),
		"project_count": projectCount,
		"project_limit": billing.MaxBookProjects(plan),
		// credits kept for backwards compat with the frontend auth store
		"credits": nil,
	})
}

// GetMe handles GET /user/me — a lightweight endpoint the frontend calls on
// app load to determine whether the auth cookie is still valid and get
// the user's basic profile. Returns 401 if the cookie is missing or expired.
func (h *Handler) GetMe(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
		return
	}

	plan, err := billing.Check(h.DB, userID, h.Config.AdminEmails)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	projectCount, err := db.CountBookProjectsByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":       userID,
		"email":         user.Email,
		"plan":          string(plan),
		"project_count": projectCount,
		"project_limit": billing.MaxBookProjects(plan),
	})
}

// DeleteAccount handles DELETE /user/me.
// 1. Cancels the user's Polar subscription (if any).
// 2. Deletes all their S3 images.
// 3. Deletes their DB row (which cascades to book projects, covers, etc).
// 4. Clears their auth cookie.
func (h *Handler) DeleteAccount(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	// 1. Cancel Polar Subscription
	sub, err := db.GetSubscriptionByUserID(h.DB, userID)
	if err == nil && sub != nil && sub.PolarSubscriptionID != nil {
		if err := h.Billing.CancelSubscription(*sub.PolarSubscriptionID); err != nil {
			// Log but don't fail, we still want to delete their data
			_ = c.Error(fmt.Errorf("failed to cancel polar subscription for user %s: %w", userID, err))
		}
	}

	// 2. Delete S3 Images
	covers, err := db.ListCoversByUserID(h.DB, userID)
	if err == nil {
		for _, cover := range covers {
			if err := h.Storage.DeleteFile(c.Request.Context(), cover.ID); err != nil {
				_ = c.Error(fmt.Errorf("failed to delete S3 object %s: %w", cover.ID, err))
			}
		}
	}

	// 3. Invalidate any active tokens immediately before deleting the row,
	// so in-flight requests get a clean 401 instead of a DB cascade error.
	_ = db.IncrementTokenVersion(h.DB, userID)

	// 4. Delete DB Row (cascades)
	if err := db.DeleteUser(h.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete account data"})
		return
	}

	// 4. Clear Auth Cookie
	setAuthCookie(c, "", h.Config.CookieDomain, h.Config.IsProduction())
	c.JSON(http.StatusOK, gin.H{"message": "account deleted successfully"})
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// ChangePassword handles POST /user/change-password.
func (h *Handler) ChangePassword(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user account"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect current password"})
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to secure new password"})
		return
	}

	if err := db.UpdatePassword(h.DB, userID, string(newHash)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	if err := db.IncrementTokenVersion(h.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to invalidate old sessions"})
		return
	}

	// Re-issue token with the new version so the current session remains active
	user.TokenVersion++
	newToken, err := middleware.GenerateJWT(user.ID, user.TokenVersion, h.Config.JWTSecret)
	if err == nil {
		maxAge := 7 * 24 * 3600
		sameSite := "Lax"
		secureStr := ""
		if h.Config.IsProduction() {
			secureStr = "; Secure"
		}
		domainStr := ""
		if h.Config.CookieDomain != "" {
			domainStr = "; Domain=" + h.Config.CookieDomain
		}
		cookieValue := "auth_token=" + newToken +
			"; Max-Age=" + fmt.Sprintf("%d", maxAge) +
			"; Path=/" + domainStr + secureStr +
			"; HttpOnly; SameSite=" + sameSite
		c.Writer.Header().Set("Set-Cookie", cookieValue)
	}

	c.JSON(http.StatusOK, gin.H{"message": "password changed successfully"})
}

// LogoutEverywhere handles POST /user/logout-everywhere.
// Increments the user's token version and clears their local cookie.
func (h *Handler) LogoutEverywhere(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	if err := db.IncrementTokenVersion(h.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke sessions"})
		return
	}

	// Clear local cookie
	maxAge := -1
	sameSite := "Lax"
	secureStr := ""
	if h.Config.IsProduction() {
		secureStr = "; Secure"
	}
	domainStr := ""
	if h.Config.CookieDomain != "" {
		domainStr = "; Domain=" + h.Config.CookieDomain
	}
	cookieValue := "auth_token=; Max-Age=" + fmt.Sprintf("%d", maxAge) +
		"; Path=/" + domainStr + secureStr +
		"; HttpOnly; SameSite=" + sameSite
	c.Writer.Header().Set("Set-Cookie", cookieValue)

	c.JSON(http.StatusOK, gin.H{"message": "logged out of all devices successfully"})
}

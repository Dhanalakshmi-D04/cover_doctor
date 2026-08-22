package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

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

	plan, err := billing.Check(h.DB, userID)
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

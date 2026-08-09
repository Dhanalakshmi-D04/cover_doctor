package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// GetAccount handles GET /account and returns the user's plan and credit balance
// (credits currently not tracked; returns null). Protected route.
func (h *Handler) GetAccount(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	plan, err := billing.Check(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	res := gin.H{"plan": "free", "credits": nil}
	if plan == billing.PlanPaid {
		res["plan"] = "paid"
	}
	c.JSON(http.StatusOK, res)
}

package api

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// GetReport handles GET /report/:cover_id: returns the cover's report,
// redacted based on the requesting user's plan.
//
// Scoring itself is always computed in full, once, at upload time — this
// handler only decides how much of that already-finished result to send
// back. See docs/05-pricing-and-plans.md: "the paywall never decides the
// score either."
func (h *Handler) GetReport(c *gin.Context) {
	coverID := c.Param("cover_id")
	userID := c.GetString(middleware.UserIDContextKey)

	cover, err := db.GetCoverByID(h.DB, coverID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "cover not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch report"})
		return
	}

	if cover.UserID == nil || *cover.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	plan, err := billing.Check(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	if plan == billing.PlanPaid {
		c.JSON(http.StatusOK, gin.H{"plan": "paid", "report": cover})
		return
	}

	// Free tier: basic score + plain top-3 improvements only. No
	// percentiles, no competitive pattern summary, no explanations, no
	// visual breakdown, no evolution tracking, no full evidence — see the
	// tier comparison table in docs/05-pricing-and-plans.md.
	c.JSON(http.StatusOK, gin.H{
		"plan": "free",
		"report": gin.H{
			"id":            cover.ID,
			"filename":      cover.Filename,
			"title_text":    cover.TitleText,
			"overall_score": cover.OverallScore,
			"improvements":  topImprovements(cover),
		},
		"locked_sections": []string{
			"percentiles",
			"competitive_pattern_summary",
			"visual_breakdown",
			"evolution_tracking",
			"full_evidence",
		},
	})
}

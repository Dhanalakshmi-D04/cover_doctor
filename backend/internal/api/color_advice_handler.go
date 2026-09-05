package api

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

type colorAdviceRequest struct {
	Genre string `json:"genre" binding:"required"`
}

// GetColorAdvice handles POST /covers/:cover_id/color-advice
// It reads the already-stored palette from the DB, sends it to Claude,
// and returns specific hex-swap suggestions for the user's chosen genre.
func (h *Handler) GetColorAdvice(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)
	coverID := c.Param("cover_id")

	var req colorAdviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "genre is required"})
		return
	}

	cover, err := db.GetCoverByID(h.DB, coverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cover not found"})
		return
	}

	// Ensure the cover belongs to this user
	if cover.UserID == nil || *cover.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your cover"})
		return
	}

	// Parse the comma-separated hex codes stored in the DB
	var palette []string
	if cover.PaletteColors != nil && *cover.PaletteColors != "" {
		for _, hex := range strings.Split(*cover.PaletteColors, ",") {
			if trimmed := strings.TrimSpace(hex); trimmed != "" {
				palette = append(palette, trimmed)
			}
		}
	}

	style := "Unknown"
	if cover.Style != nil {
		style = *cover.Style
	}

	advice := h.AI.SuggestColors(palette, style, req.Genre)

	c.JSON(http.StatusOK, advice)
}

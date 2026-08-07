package api

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// GetReport handles GET /report/:cover_id: returns the full, already-scored
// report for a previously uploaded cover.
func (h *Handler) GetReport(c *gin.Context) {
	coverID := c.Param("cover_id")

	cover, err := db.GetCoverByID(h.DB, coverID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "cover not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch report"})
		return
	}

	c.JSON(http.StatusOK, cover)
}

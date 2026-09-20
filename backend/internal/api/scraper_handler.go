package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// TriggerScraper handles POST /admin/scraper/run: triggers an immediate background scrape run.
func (h *Handler) TriggerScraper(c *gin.Context) {
	if h.ScraperScheduler == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "scraper scheduler not initialized"})
		return
	}

	status := h.ScraperScheduler.Status(c.Request.Context())
	if status.IsRunning {
		c.JSON(http.StatusConflict, gin.H{"error": "scraper job is already running", "status": status})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	if _, err := h.ScraperScheduler.TriggerNow(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to trigger scraper: " + err.Error()})
		return
	}

	// Return updated count after completion
	totalCount, _ := db.CountBenchmarks(h.DB)
	finalStatus := h.ScraperScheduler.Status(c.Request.Context())
	statusStr := "idle"
	if finalStatus.IsRunning {
		statusStr = "running"
	}
	c.JSON(http.StatusOK, gin.H{
		"message":       "automated benchmark scraper job completed",
		"status":        statusStr,
		"total_scraped": totalCount,
	})
}

// GetScraperStatus handles GET /admin/scraper/status: returns the scraper state
// and the real benchmark count from the database so the admin UI shows live numbers.
func (h *Handler) GetScraperStatus(c *gin.Context) {
	totalCount, _ := db.CountBenchmarks(h.DB)

	// Style breakdown
	type styleRow struct {
		Style string `db:"style"`
		Count int    `db:"count"`
	}
	var breakdown []styleRow
	_ = h.DB.Select(&breakdown, `SELECT style, COUNT(*) AS count FROM benchmarks GROUP BY style ORDER BY count DESC`)

	if h.ScraperScheduler == nil {
		c.JSON(http.StatusOK, gin.H{
			"status":        "idle",
			"is_running":    false,
			"total_scraped": totalCount,
			"by_style":      breakdown,
		})
		return
	}

	status := h.ScraperScheduler.Status(c.Request.Context())

	statusStr := "idle"
	if status.IsRunning {
		statusStr = "running"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":        statusStr,
		"is_running":    status.IsRunning,
		"total_scraped": totalCount,
		"by_style":      breakdown,
	})
}

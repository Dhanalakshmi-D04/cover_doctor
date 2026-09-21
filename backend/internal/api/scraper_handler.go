package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// TriggerScraper handles POST /admin/scraper/run.
// It launches the scrape job in a background goroutine and responds immediately
// so the browser doesn't time out waiting for a 5-minute pipeline to finish.
func (h *Handler) TriggerScraper(c *gin.Context) {
	if h.ScraperScheduler == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "scraper scheduler not initialized"})
		return
	}

	status := h.ScraperScheduler.Status(c.Request.Context())
	if status.IsRunning {
		c.JSON(http.StatusConflict, gin.H{"error": "scraper job is already running"})
		return
	}

	// Fire-and-forget: launch in a goroutine so we can respond to the browser right away.
	// The frontend will poll /admin/scraper/status to watch live progress.
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		if _, err := h.ScraperScheduler.TriggerNow(ctx); err != nil {
			// Error is logged inside TriggerNow; nothing else to do here.
			_ = err
		}
	}()

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Scraper job launched in background. Poll /admin/scraper/status for live progress.",
		"status":  "running",
	})
}

// GetScraperStatus handles GET /admin/scraper/status.
// Returns the real benchmark count from the database, plus live progress when running.
func (h *Handler) GetScraperStatus(c *gin.Context) {
	totalCount, _ := db.CountBenchmarks(h.DB)

	// Style breakdown
	type styleRow struct {
		Style string `db:"style" json:"style"`
		Count int    `db:"count" json:"count"`
	}
	var breakdown []styleRow
	_ = h.DB.Select(&breakdown, `SELECT style, COUNT(*) AS count FROM benchmarks GROUP BY style ORDER BY count DESC`)

	if h.ScraperScheduler == nil {
		c.JSON(http.StatusOK, gin.H{
			"status":        "idle",
			"is_running":    false,
			"total_scraped": totalCount,
			"by_style":      breakdown,
			"progress":      nil,
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
		"progress":      status.Progress, // nil when idle, populated when running
	})
}


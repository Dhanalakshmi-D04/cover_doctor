package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
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

	c.JSON(http.StatusOK, gin.H{
		"message": "automated benchmark scraper job completed",
		"status":  h.ScraperScheduler.Status(c.Request.Context()),
	})
}

// GetScraperStatus handles GET /admin/scraper/status: returns status of the quarterly scraper.
func (h *Handler) GetScraperStatus(c *gin.Context) {
	if h.ScraperScheduler == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "scraper scheduler not initialized"})
		return
	}

	status := h.ScraperScheduler.Status(c.Request.Context())
	c.JSON(http.StatusOK, status)
}

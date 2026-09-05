package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

func (h *Handler) ListBenchmarks(c *gin.Context) {
	var benchmarks []models.Benchmark
	err := h.DB.Select(&benchmarks, `SELECT * FROM benchmarks ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list benchmarks"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"benchmarks": benchmarks})
}

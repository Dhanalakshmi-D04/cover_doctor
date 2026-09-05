package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

func (h *Handler) ListCovers(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	covers, err := db.ListCoversByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list covers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"covers": covers})
}

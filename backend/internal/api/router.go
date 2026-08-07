package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// NewRouter wires up all HTTP routes for the API.
func NewRouter(database *sqlx.DB, uploadDir string) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.CORS())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	handler := &Handler{DB: database, UploadDir: uploadDir}

	router.POST("/upload", handler.Upload)
	router.GET("/report/:cover_id", handler.GetReport)

	return router
}

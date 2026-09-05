package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

func generateSlug() string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return "test"
	}
	return hex.EncodeToString(bytes)
}

type createABTestRequest struct {
	CoverAID string `json:"cover_a_id" binding:"required"`
	CoverBID string `json:"cover_b_id" binding:"required"`
}

func (h *Handler) CreateABTest(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	var req createABTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	test := &models.ABTest{
		UserID:   userID,
		CoverAID: req.CoverAID,
		CoverBID: req.CoverBID,
		Slug:     generateSlug(),
	}

	if err := db.CreateABTest(h.DB, test); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ab test"})
		return
	}

	c.JSON(http.StatusCreated, test)
}

func (h *Handler) GetABTest(c *gin.Context) {
	slug := c.Param("slug")

	test, err := db.GetABTestBySlug(h.DB, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ab test not found"})
		return
	}

	// Fetch the actual covers to display
	coverA, err := db.GetCoverByID(h.DB, test.CoverAID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load cover A"})
		return
	}
	
	coverB, err := db.GetCoverByID(h.DB, test.CoverBID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load cover B"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"test": test,
		"cover_a": coverA,
		"cover_b": coverB,
	})
}

type voteRequest struct {
	Vote string `json:"vote" binding:"required"` // "A" or "B"
}

func (h *Handler) VoteABTest(c *gin.Context) {
	slug := c.Param("slug")

	var req voteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vote"})
		return
	}

	if req.Vote != "A" && req.Vote != "B" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "vote must be A or B"})
		return
	}

	if err := db.VoteABTest(h.DB, slug, req.Vote); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record vote"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vote recorded"})
}

func (h *Handler) ListABTests(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	tests, err := db.GetABTestsByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list tests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tests": tests})
}

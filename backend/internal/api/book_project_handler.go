package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

type createBookProjectRequest struct {
	Title string `json:"title" binding:"required"`
}

// CreateBookProject handles POST /book-projects.
// Book project creation is gated by plan tier:
//
//   - PlanFree:      0 projects — pure paywall, no unpaid AI spend
//   - PlanStarter:   1 project
//   - PlanCreator:   5 projects
//   - PlanPublisher: 20 projects
//
// Returns a structured 403 with error code "plan_limit_reached" so the
// frontend can open the pricing modal without parsing message text.
func (h *Handler) CreateBookProject(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	var req createBookProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := billing.Check(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	limit := billing.MaxBookProjects(plan)

	count, err := db.CountBookProjectsByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count book projects"})
		return
	}

	if count >= limit {
		var message string
		switch plan {
		case billing.PlanFree:
			message = "Upgrade to a paid plan to create your first book project"
		case billing.PlanStarter:
			message = "Plan limit reached: Starter allows 1 book project. Upgrade to Creator for 5."
		case billing.PlanCreator:
			message = "Plan limit reached: Creator allows 5 book projects. Upgrade to Publisher for 20."
		case billing.PlanPublisher:
			message = "Plan limit reached: Publisher allows 20 book projects."
		default:
			message = "Plan limit reached"
		}
		c.JSON(http.StatusForbidden, gin.H{
			"error":        "plan_limit_reached",
			"message":      message,
			"current_plan": string(plan),
			"limit":        limit,
			"count":        count,
		})
		return
	}

	project := &models.BookProject{
		ID:     uuid.New().String(),
		UserID: userID,
		Title:  req.Title,
	}

	if err := db.CreateBookProject(h.DB, project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create book project"})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// ListVersions handles GET /book-projects/:id/versions: returns every
// cover version tracked under a book project — full history for paid
// users, a locked placeholder for free users (Evolution Tracking is a
// paid-only feature).
func (h *Handler) ListVersions(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)
	projectID := c.Param("id")

	project, err := db.GetBookProjectByID(h.DB, projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "book project not found"})
		return
	}
	if project.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your book project"})
		return
	}

	plan, err := billing.Check(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check subscription"})
		return
	}

	if !billing.IsPaid(plan) {
		c.JSON(http.StatusOK, gin.H{
			"locked":  true,
			"message": "Evolution Tracking is a paid feature. Upgrade to see full version history.",
		})
		return
	}

	versions, err := db.ListCoverVersions(h.DB, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch versions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"locked": false, "versions": versions})
}

// ListBookProjects handles GET /book-projects: returns all projects owned by the user.
func (h *Handler) ListBookProjects(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	projects, err := db.ListBookProjectsByUserID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch book projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

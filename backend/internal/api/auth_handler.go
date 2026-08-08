package api

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

var dummyPasswordHash, _ = bcrypt.GenerateFromPassword([]byte("dummy-password-for-timing-defense"), bcrypt.DefaultCost)

type signupRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Signup handles POST /auth/signup: creates a new account with a default
// free-tier subscription and sets an httpOnly JWT cookie. Every user, free or paid,
// needs an account — see docs/05-pricing-and-plans.md.
func (h *Handler) Signup(c *gin.Context) {
	var req signupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, err := db.GetUserByEmail(h.DB, req.Email); err == nil {
		// Generic message to prevent email enumeration
		c.JSON(http.StatusBadRequest, gin.H{"error": "unable to process signup with provided details"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	userID := uuid.New().String()
	user := &models.User{ID: userID, Email: req.Email, PasswordHash: string(hash)}

	if err := db.CreateUser(h.DB, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create account"})
		return
	}

	if err := db.EnsureFreeSubscription(h.DB, uuid.New().String(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set up account"})
		return
	}

	token, err := middleware.GenerateJWT(userID, h.Config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}

	c.SetCookie("auth_token", token, 7*24*3600, "/", "", false, true)
	c.JSON(http.StatusCreated, gin.H{"token": token, "user_id": userID})
}

// Login handles POST /auth/login.
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := db.GetUserByEmail(h.DB, req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Perform dummy hash comparison to mitigate timing side-channel attack
			_ = bcrypt.CompareHashAndPassword(dummyPasswordHash, []byte(req.Password))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to log in"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := middleware.GenerateJWT(user.ID, h.Config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}

	c.SetCookie("auth_token", token, 7*24*3600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"token": token, "user_id": user.ID})
}

// Logout handles POST /auth/logout: clears the httpOnly auth_token cookie.
func (h *Handler) Logout(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}

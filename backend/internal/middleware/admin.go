package middleware

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// RequireAdmin is a middleware that ensures the currently authenticated user
// has the is_admin flag set to true in the database.
// It must be placed *after* the Auth middleware in the router chain, so that
// the UserIDContextKey is already populated.
func RequireAdmin(database *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString(UserIDContextKey)
		if userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var isAdmin bool
		err := database.Get(&isAdmin, `SELECT is_admin FROM users WHERE id = $1`, userID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to verify permissions"})
			return
		}

		if !isAdmin {
			// Returns 403 Forbidden because they are authenticated, but lack the
			// specific permissions to access this admin route.
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			return
		}

		c.Next()
	}
}

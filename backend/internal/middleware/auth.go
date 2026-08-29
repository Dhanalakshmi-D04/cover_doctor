package middleware

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
)

// UserIDContextKey is the Gin context key set by Auth() and read by
// handlers to identify the authenticated user.
const UserIDContextKey = "user_id"

// GenerateJWT issues a signed token for a user, valid for 7 days.
// The token_version is embedded to allow server-side revocation on password change or logout.
func GenerateJWT(userID string, tokenVersion int, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":       userID,
		"token_version": tokenVersion,
		"exp":           time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// Auth is Gin middleware requiring a valid JWT delivered exclusively via the
// "auth_token" HttpOnly cookie. It checks the token's validity, decodes the claims,
// and finally checks the database to ensure the token's embedded token_version matches
// the current version for the user. If they don't match, the session was revoked.
func Auth(database *sqlx.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookieToken, err := c.Cookie("auth_token")
		if err != nil || cookieToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}

		token, err := jwt.Parse(cookieToken, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session — please log in again"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		tokenVersionFloat, ok := claims["token_version"].(float64)
		if !ok {
			// Older tokens without version claim are invalid by default now
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session — please log in again"})
			return
		}
		tokenVersion := int(tokenVersionFloat)

		// Fetch the user's current token version from the database
		var currentVersion int
		err = database.Get(&currentVersion, `SELECT token_version FROM users WHERE id = $1`, userID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session — please log in again"})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		if tokenVersion != currentVersion {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session — please log in again"})
			return
		}

		c.Set(UserIDContextKey, userID)
		c.Next()
	}
}

package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// UserIDContextKey is the Gin context key set by Auth() and read by
// handlers to identify the authenticated user.
const UserIDContextKey = "user_id"

// GenerateJWT issues a signed token for a user, valid for 7 days.
func GenerateJWT(userID, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// Auth is Gin middleware requiring a valid JWT (either via "auth_token"
// httpOnly cookie or "Authorization: Bearer <token>" header). On success,
// it sets the authenticated user's ID in the request context under
// UserIDContextKey for handlers to read.
func Auth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// First try reading from httpOnly cookie
		if cookieToken, err := c.Cookie("auth_token"); err == nil && cookieToken != "" {
			tokenString = cookieToken
		} else {
			// Fallback to Authorization header
			header := c.GetHeader("Authorization")
			if strings.HasPrefix(header, "Bearer ") {
				tokenString = strings.TrimPrefix(header, "Bearer ")
			}
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization token"})
			return
		}

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
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

		c.Set(UserIDContextKey, userID)
		c.Next()
	}
}

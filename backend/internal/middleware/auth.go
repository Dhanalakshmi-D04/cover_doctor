package middleware

import (
	"net/http"
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

// Auth is Gin middleware requiring a valid JWT delivered exclusively via the
// "auth_token" HttpOnly cookie. Bearer header auth has been removed because:
//   - The cookie is HttpOnly and therefore inaccessible to JS — the strongest
//     XSS protection available in a browser.
//   - Maintaining two auth paths (cookie + header) doubles the attack surface
//     and creates inconsistency in how sessions are managed.
//
// If a future mobile/native client is built, add a separate API key or
// OAuth2 token scheme rather than re-enabling Bearer headers here.
func Auth(secret string) gin.HandlerFunc {
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

		c.Set(UserIDContextKey, userID)
		c.Next()
	}
}

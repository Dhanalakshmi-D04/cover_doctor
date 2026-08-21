package middleware

import "github.com/gin-gonic/gin"

// CORS is middleware allowing configured origins (e.g. production frontend URL)
// and localhost for local development to call this API with credentials (cookies).
func CORS(frontendURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		allowed := origin == frontendURL || origin == "http://localhost:5173" || frontendURL == "*"

		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if frontendURL != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

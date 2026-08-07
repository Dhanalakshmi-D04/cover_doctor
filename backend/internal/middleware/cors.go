package middleware

import "github.com/gin-gonic/gin"

// CORS is a minimal CORS middleware for local development, allowing the
// Vite dev server (http://localhost:5173) to call this API. This should be
// replaced with a stricter, environment-driven allow-list before deploying.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

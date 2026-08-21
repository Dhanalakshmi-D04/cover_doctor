package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
)

// UploadRateLimiter is a distributed rate limiter for authenticated users.
type UploadRateLimiter struct {
	limiter *redis_rate.Limiter
	limit   redis_rate.Limit
}

// NewUploadRateLimiter creates a new rate limiter for uploads (e.g. 10 per min).
func NewUploadRateLimiter(rdb *redis.Client, requestsPerMinute int) *UploadRateLimiter {
	limiter := redis_rate.NewLimiter(rdb)
	return &UploadRateLimiter{
		limiter: limiter,
		limit:   redis_rate.PerMinute(requestsPerMinute),
	}
}

// Limit returns a Gin middleware enforcing the rate limit per authenticated user.
func (rl *UploadRateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get(UserIDContextKey)
		if !exists || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized, missing user ID for rate limit",
			})
			return
		}

		key := "upload_rate_limit:user:" + userID.(string)

		res, err := rl.limiter.Allow(c.Request.Context(), key, rl.limit)
		if err != nil {
			// Fail close on Redis error for billed actions
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "rate limiter error",
			})
			return
		}

		if res.Allowed == 0 {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many uploads, you are limited to 10 requests per minute",
			})
			return
		}

		c.Next()
	}
}

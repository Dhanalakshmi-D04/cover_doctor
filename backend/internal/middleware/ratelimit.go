package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
)

// RateLimiter wraps redis_rate.Limiter.
type RateLimiter struct {
	limiter *redis_rate.Limiter
	limit   redis_rate.Limit
}

// NewRateLimiter creates a new distributed rate limiter.
func NewRateLimiter(rdb *redis.Client, requestsPerMinute int) *RateLimiter {
	limiter := redis_rate.NewLimiter(rdb)
	return &RateLimiter{
		limiter: limiter,
		limit:   redis_rate.PerMinute(requestsPerMinute),
	}
}

// Limit returns a Gin middleware enforcing the rate limit per client IP.
func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := "rate_limit:" + ip

		res, err := rl.limiter.Allow(c.Request.Context(), key, rl.limit)
		if err != nil {
			// If Redis is down, we might want to fail open or close. Fail close for now.
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "rate limiter error",
			})
			return
		}

		if res.Allowed == 0 {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please slow down",
			})
			return
		}

		c.Next()
	}
}

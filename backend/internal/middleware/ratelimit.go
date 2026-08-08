package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientLimiter struct {
	tokens     float64
	lastRefill time.Time
}

// RateLimiter is a thread-safe sliding token-bucket rate limiter keyed by client IP.
type RateLimiter struct {
	mu         sync.Mutex
	clients    map[string]*clientLimiter
	maxTokens  float64
	refillRate float64 // tokens per second
}

// NewRateLimiter creates a new rate limiter with the given requests per minute limit.
func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	rl := &RateLimiter{
		clients:    make(map[string]*clientLimiter),
		maxTokens:  float64(requestsPerMinute),
		refillRate: float64(requestsPerMinute) / 60.0,
	}

	// Periodic cleanup of stale clients to avoid memory leaks
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.mu.Lock()
			now := time.Now()
			for ip, client := range rl.clients {
				if now.Sub(client.lastRefill) > 10*time.Minute {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

// Limit returns a Gin middleware enforcing the rate limit per client IP.
func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		rl.mu.Lock()
		now := time.Now()
		client, exists := rl.clients[ip]
		if !exists {
			client = &clientLimiter{
				tokens:     rl.maxTokens - 1.0,
				lastRefill: now,
			}
			rl.clients[ip] = client
			rl.mu.Unlock()
			c.Next()
			return
		}

		elapsed := now.Sub(client.lastRefill).Seconds()
		client.lastRefill = now
		client.tokens += elapsed * rl.refillRate
		if client.tokens > rl.maxTokens {
			client.tokens = rl.maxTokens
		}

		if client.tokens < 1.0 {
			rl.mu.Unlock()
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please slow down",
			})
			return
		}

		client.tokens -= 1.0
		rl.mu.Unlock()
		c.Next()
	}
}

package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HTTPSRedirect returns a middleware that enforces HTTPS when the app is
// running behind a TLS-terminating reverse proxy (e.g. nginx, Cloudflare,
// AWS ALB, or Railway's built-in proxy).
//
// How it works: the proxy strips TLS and forwards plain HTTP to our Go
// server, but also adds an "X-Forwarded-Proto: http" header to tell us
// the *original* request came in over plain HTTP. When we see that header
// set to "http", we redirect the client to the HTTPS version of the URL.
//
// In local dev (no proxy), this header is never set so the middleware is
// a no-op — you won't get spurious redirects on your laptop.
func HTTPSRedirect() gin.HandlerFunc {
	return func(c *gin.Context) {
		// X-Forwarded-Proto is set by virtually every TLS-terminating proxy.
		// If it's "https" (or missing, meaning we're not behind a proxy),
		// just proceed normally.
		if c.GetHeader("X-Forwarded-Proto") == "http" {
			// Build the HTTPS target URL, preserving the path and query string.
			target := "https://" + c.Request.Host + c.Request.URL.RequestURI()
			c.Redirect(http.StatusMovedPermanently, target)
			c.Abort()
			return
		}
		c.Next()
	}
}

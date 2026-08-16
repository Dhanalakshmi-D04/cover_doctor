package middleware

import (
	"context"
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const RequestIDKey = "request_id"

// RequestLogger generates a UUID for each request, injects it into the context,
// and logs the start and end of the request using slog.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		reqID := uuid.New().String()
		c.Set(RequestIDKey, reqID)

		// Create a logger with the request ID attached
		logger := slog.With(
			"request_id", reqID,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"client_ip", c.ClientIP(),
		)

		// Optional: Store the logger in the context so handlers can use it
		// c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), "logger", logger))

		logger.Info("Started request")

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		if len(c.Errors) > 0 {
			logger.Error("Completed request with errors",
				"status", status,
				"latency", latency,
				"errors", c.Errors.String(),
			)
		} else {
			logger.Info("Completed request",
				"status", status,
				"latency", latency,
			)
		}
	}
}

// GetLogger retrieves a request-scoped logger from context, or default slog if not found.
func GetLogger(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value("logger").(*slog.Logger); ok {
		return logger
	}
	return slog.Default()
}

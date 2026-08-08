package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestAuthMiddleware(t *testing.T) {
	secret := "secret-key-must-be-at-least-32-chars-long"

	router := gin.New()
	router.Use(middleware.Auth(secret))
	router.GET("/protected", func(c *gin.Context) {
		userID := c.GetString(middleware.UserIDContextKey)
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})

	t.Run("Missing token", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("Valid token via Authorization header", func(t *testing.T) {
		token, err := middleware.GenerateJWT("user-123", secret)
		if err != nil {
			t.Fatalf("failed to generate JWT: %v", err)
		}

		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Valid token via httpOnly cookie", func(t *testing.T) {
		token, err := middleware.GenerateJWT("user-456", secret)
		if err != nil {
			t.Fatalf("failed to generate JWT: %v", err)
		}

		req, _ := http.NewRequest("GET", "/protected", nil)
		req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Invalid secret token", func(t *testing.T) {
		token, _ := middleware.GenerateJWT("user-123", "wrong-secret-key-32chars-long!!!")

		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})
}

func TestCORSMiddleware(t *testing.T) {
	allowedOrigin := "http://localhost:5173"
	router := gin.New()
	router.Use(middleware.CORS(allowedOrigin))
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != allowedOrigin {
		t.Fatalf("expected Access-Control-Allow-Origin %s, got %s", allowedOrigin, w.Header().Get("Access-Control-Allow-Origin"))
	}
	if w.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Fatalf("expected Access-Control-Allow-Credentials true")
	}
}

func TestRateLimiter(t *testing.T) {
	limiter := middleware.NewRateLimiter(2)

	router := gin.New()
	router.Use(limiter.Limit())
	router.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	// First request - ok
	req1, _ := http.NewRequest("GET", "/ping", nil)
	req1.RemoteAddr = "192.168.1.1:12345"
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("expected 200 on first request, got %d", w1.Code)
	}

	// Second request - ok
	req2, _ := http.NewRequest("GET", "/ping", nil)
	req2.RemoteAddr = "192.168.1.1:12345"
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 on second request, got %d", w2.Code)
	}

	// Third request - rate limited (429)
	req3, _ := http.NewRequest("GET", "/ping", nil)
	req3.RemoteAddr = "192.168.1.1:12345"
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 on third request, got %d", w3.Code)
	}
}

package api_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/api"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func testConfig() *config.Config {
	return &config.Config{
		Port:          "8080",
		DatabaseURL:   "postgres://localhost/test",
		JWTSecret:     "this-is-a-32-character-secret-key-for-jwt-testing!",
		AllowedOrigin: "http://localhost:5173",
		GinMode:       "test",
	}
}

func TestSignupValidation(t *testing.T) {
	cfg := testConfig()
	aiClient := ai.NewClient("")
	billingClient := billing.NewClient("")
	router := api.NewRouter(nil, cfg, aiClient, billingClient, t.TempDir())

	t.Run("Invalid email format", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{
			"email":    "invalid-email",
			"password": "password123",
		})
		req, _ := http.NewRequest("POST", "/auth/signup", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d", w.Code)
		}
	})

	t.Run("Short password", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{
			"email":    "user@example.com",
			"password": "123",
		})
		req, _ := http.NewRequest("POST", "/auth/signup", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d", w.Code)
		}
	})
}

func TestUploadFileValidation(t *testing.T) {
	cfg := testConfig()
	aiClient := ai.NewClient("")
	billingClient := billing.NewClient("")
	uploadDir := t.TempDir()
	router := api.NewRouter(nil, cfg, aiClient, billingClient, uploadDir)

	token, _ := middleware.GenerateJWT("user-1", cfg.JWTSecret)

	t.Run("Missing cover field", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/upload", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d", w.Code)
		}
	})

	t.Run("Invalid file extension", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("cover", "malicious.exe")
		part.Write([]byte("not an image"))
		writer.Close()

		req, _ := http.NewRequest("POST", "/upload", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for invalid extension, got %d", w.Code)
		}
	})
}

func TestUnauthenticatedRoutes(t *testing.T) {
	cfg := testConfig()
	aiClient := ai.NewClient("")
	billingClient := billing.NewClient("")
	router := api.NewRouter(nil, cfg, aiClient, billingClient, t.TempDir())

	protectedRoutes := []struct {
		method string
		path   string
	}{
		{"POST", "/upload"},
		{"GET", "/report/cover-123"},
		{"GET", "/images/cover-123.jpg"},
		{"POST", "/book-projects"},
		{"GET", "/book-projects"},
		{"GET", "/book-projects/proj-123/versions"},
		{"POST", "/billing/checkout"},
		{"POST", "/billing/portal"},
		{"GET", "/admin/scraper/status"},
		{"POST", "/admin/scraper/run"},
	}

	for _, route := range protectedRoutes {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			req, _ := http.NewRequest(route.method, route.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Fatalf("expected 401 Unauthorized for unauthenticated request to %s, got %d", route.path, w.Code)
			}
		})
	}
}

func TestHealthCheck(t *testing.T) {
	cfg := testConfig()
	router := api.NewRouter(nil, cfg, ai.NewClient(""), billing.NewClient(""), os.TempDir())

	req, _ := http.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestAdminScraperEndpoints(t *testing.T) {
	cfg := testConfig()
	aiClient := ai.NewClient("")
	billingClient := billing.NewClient("")

	opts := scraper.DefaultSchedulerOptions()
	opts.ScraperOpts.TempDir = t.TempDir()
	opts.ScraperOpts.LimitPerStyle = 1
	opts.ScraperOpts.Styles = []string{"Bold Typography"}
	opts.Sources = []scraper.BestsellerSource{scraper.NewSampleSource()}

	sched := scraper.NewScheduler(nil, aiClient, opts)
	router := api.NewRouter(nil, cfg, aiClient, billingClient, t.TempDir(), sched)

	token, _ := middleware.GenerateJWT("admin-1", cfg.JWTSecret)

	t.Run("GET /admin/scraper/status", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/admin/scraper/status", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", w.Code)
		}
	})

	t.Run("POST /admin/scraper/run", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/admin/scraper/run", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusAccepted {
			t.Fatalf("expected 202 Accepted, got %d", w.Code)
		}
	})
}

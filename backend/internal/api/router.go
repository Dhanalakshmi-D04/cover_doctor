package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
)

// NewRouter wires up all HTTP routes for the API.
func NewRouter(database *sqlx.DB, cfg *config.Config, aiClient *ai.Client, billingClient *billing.Client, uploadDir string, scraperScheduler ...*scraper.Scheduler) *gin.Engine {
	if cfg.GinMode != "" {
		gin.SetMode(cfg.GinMode)
	}

	router := gin.Default()
	_ = router.SetTrustedProxies(nil) // explicitly disable proxy trusting by default

	router.Use(middleware.CORS(cfg.AllowedOrigin))

	// Rate limiters for sensitive endpoints
	authRateLimiter := middleware.NewRateLimiter(15)   // 15 requests/min per IP
	uploadRateLimiter := middleware.NewRateLimiter(20) // 20 uploads/min per IP

	var sched *scraper.Scheduler
	if len(scraperScheduler) > 0 {
		sched = scraperScheduler[0]
	}

	handler := &Handler{
		DB:               database,
		UploadDir:        uploadDir,
		Config:           cfg,
		AI:               aiClient,
		Billing:          billingClient,
		ScraperScheduler: sched,
	}

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.POST("/auth/signup", authRateLimiter.Limit(), handler.Signup)
	router.POST("/auth/login", authRateLimiter.Limit(), handler.Login)

	// Stripe signs this payload itself; it can never carry a JWT.
	router.POST("/billing/webhook", handler.StripeWebhook)

	protected := router.Group("/")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		protected.POST("/auth/logout", handler.Logout)
		protected.POST("/upload", uploadRateLimiter.Limit(), handler.Upload)
		protected.GET("/report/:cover_id", handler.GetReport)
		protected.GET("/images/:filename", handler.GetCoverImage)
		protected.POST("/book-projects", handler.CreateBookProject)
		protected.GET("/book-projects", handler.ListBookProjects)
		protected.GET("/book-projects/:id/versions", handler.ListVersions)
		protected.POST("/billing/checkout", handler.CreateCheckoutSession)
		protected.POST("/billing/portal", handler.CreatePortalSession)

		// Protected account info
		protected.GET("/account", handler.GetAccount)

		// Admin scraper control routes
		protected.POST("/admin/scraper/run", handler.TriggerScraper)
		protected.GET("/admin/scraper/status", handler.GetScraperStatus)
}

	return router
	}

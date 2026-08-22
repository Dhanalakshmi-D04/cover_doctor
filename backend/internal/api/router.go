package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/email"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
)

// NewRouter wires up all HTTP routes for the API.
func NewRouter(database *sqlx.DB, rdb *redis.Client, cfg *config.Config, aiClient *ai.Client, billingClient *billing.Client, s3Client *storage.S3Client, taskQueue *asynq.Client, emailClient email.EmailSender, scraperScheduler ...*scraper.Scheduler) *gin.Engine {
	if cfg.GinMode != "" {
		gin.SetMode(cfg.GinMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.HTTPSRedirect()) // Redirects http→https when behind a TLS proxy
	_ = router.SetTrustedProxies(nil)      // explicitly disable proxy trusting by default

	router.Use(middleware.CORS(cfg.FrontendURL))

	// Rate limiters for sensitive endpoints
	authRateLimiter := middleware.NewRateLimiter(rdb, 15)         // 15 requests/min per IP
	uploadRateLimiter := middleware.NewUploadRateLimiter(rdb, 10) // 10 uploads/min per user

	var sched *scraper.Scheduler
	if len(scraperScheduler) > 0 {
		sched = scraperScheduler[0]
	}

	handler := &Handler{
		DB:               database,
		Storage:          s3Client,
		TaskQueue:        taskQueue,
		Config:           cfg,
		AI:               aiClient,
		Billing:          billingClient,
		ScraperScheduler: sched,
		EmailSender:      emailClient,
	}

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.POST("/auth/signup", authRateLimiter.Limit(), handler.Signup)
	router.POST("/auth/login", authRateLimiter.Limit(), handler.Login)
	router.POST("/auth/forgot-password", authRateLimiter.Limit(), handler.ForgotPassword)
	router.POST("/auth/reset-password", authRateLimiter.Limit(), handler.ResetPassword)

	// Polar signs this payload itself; it can never carry a JWT.
	router.POST("/billing/webhook", handler.PolarWebhook)

	protected := router.Group("/")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		protected.POST("/auth/logout", handler.Logout)
		protected.POST("/upload", uploadRateLimiter.Limit(), handler.Upload)
		protected.GET("/jobs/:job_id", handler.GetJobStatus)
		protected.GET("/report/:cover_id", handler.GetReport)
		protected.GET("/images/:filename", handler.GetCoverImage)
		protected.POST("/book-projects", handler.CreateBookProject)
		protected.GET("/book-projects", handler.ListBookProjects)
		protected.GET("/book-projects/:id/versions", handler.ListVersions)
		protected.GET("/billing/checkout-url", handler.GetCheckoutURL)
		protected.POST("/billing/checkout", handler.CreateCheckoutSession)
		protected.POST("/billing/portal", handler.CreatePortalSession)

		// Protected account info — also aliased as /user/plan for frontend plan polling
		protected.GET("/account", handler.GetAccount)
		protected.GET("/user/plan", handler.GetAccount)

		// Admin scraper control routes (requires is_admin=true)
		admin := protected.Group("/admin")
		admin.Use(middleware.RequireAdmin(database))
		{
			admin.POST("/scraper/run", handler.TriggerScraper)
			admin.GET("/scraper/status", handler.GetScraperStatus)
		}
	}

	return router
}

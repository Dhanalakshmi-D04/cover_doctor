package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds all environment-driven configuration for the backend,
// loaded and validated once at startup rather than scattering os.Getenv
// calls across packages.
type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	FrontendURL   string
	// CookieDomain sets the Domain attribute on auth cookies.
	// Leave blank on .onrender.com (same-domain, no subdomain needed).
	// Set to ".yourdomain.com" (with leading dot) when using a custom domain
	// so the cookie is shared across subdomains (e.g. api.yourdomain.com + yourdomain.com).
	CookieDomain  string
	GinMode       string

	// AppBaseURL is the public URL of the frontend app (e.g. "http://localhost:5173"
	// in dev, "https://coverdoctor.com" in production). Used to build absolute
	// redirect URLs for Stripe checkout/portal so they work in both environments.
	AppBaseURL string

	// AnthropicAPIKey is optional. If empty, AI features (style tagging,
	// explanations) fall back to safe deterministic behavior rather than
	// failing the request — see internal/ai.
	AnthropicAPIKey string

	// Polar settings are optional. If PolarAccessToken is empty, billing
	// endpoints return a clear "not configured" error instead of panicking.
	PolarAccessToken      string
	PolarWebhookSecret    string
	PolarProductIDStarter   string
	PolarProductIDCreator   string
	PolarProductIDPublisher string
	PolarOrganizationID   string
	// PolarAPIBaseURL overrides the Polar REST API host.
	// Leave blank for production (https://api.polar.sh/v1).
	// Set to https://sandbox-api.polar.sh/v1 when POLAR_SANDBOX_MODE=true
	// or when POLAR_API_BASE_URL is explicitly set in the environment.
	PolarAPIBaseURL string

	// Redis configuration for job queue and rate limiting
	RedisURL string

	// S3/MinIO configuration for object storage.
	// S3Endpoint can point at MinIO (local dev), Cloudflare R2, or real AWS S3 —
	// only env vars need to change, no code changes required.
	S3Endpoint       string
	S3AccessKey      string
	S3SecretKey      string
	S3Bucket         string
	S3ForcePathStyle bool

	// ZeptoMail configuration for sending transactional emails.
	// Get ZEPTOMAIL_API_KEY from the ZeptoMail dashboard → Agent → Domain.
	// ZEPTOMAIL_FROM_EMAIL must match a domain you've verified in ZeptoMail.
	ZeptoMailAPIKey    string
	ZeptoMailFromEmail string

	// Google OAuth2 settings. All three must be set for Google login to work.
	// Leave blank to disable the /auth/google routes entirely.
	// GOOGLE_REDIRECT_URL must match one of the Authorized Redirect URIs in
	// your Google Cloud Console OAuth 2.0 Client credentials.
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// ScraperAPIKey is used to bypass Amazon's anti-scraping defenses
	// during quarterly benchmark runs.
	ScraperAPIKey string

	// AdminEmails is a comma-separated list of email addresses whose accounts
	// always receive PlanPublisher entitlements regardless of their subscription
	// row. Intended for developer/QA use only.
	// Set ADMIN_EMAILS=you@example.com,tester@example.com in the environment.
	// Never expose this value publicly.
	AdminEmails []string
}

// Load reads environment variables into a Config, returning an error only
// if a variable required for the app to run at all is missing.
// In production, env vars are injected by the hosting platform.
// In local dev, they are loaded from a .env file before this function is called.
func Load() (*Config, error) {
	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
		CookieDomain:  os.Getenv("COOKIE_DOMAIN"), // empty = same-origin (correct for Render)
		GinMode:       getEnv("GIN_MODE", "release"),
		AppBaseURL:    getEnv("APP_BASE_URL", "http://localhost:5173"),

		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),

		PolarAccessToken:        os.Getenv("POLAR_ACCESS_TOKEN"),
		PolarWebhookSecret:      os.Getenv("POLAR_WEBHOOK_SECRET"),
		PolarProductIDStarter:   os.Getenv("POLAR_PRODUCT_ID_STARTER"),
		PolarProductIDCreator:   os.Getenv("POLAR_PRODUCT_ID_CREATOR"),
		PolarProductIDPublisher: os.Getenv("POLAR_PRODUCT_ID_PUBLISHER"),
		PolarOrganizationID:     os.Getenv("POLAR_ORGANIZATION_ID"),

		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379/0"),
		S3Endpoint:       os.Getenv("S3_ENDPOINT"),
		S3AccessKey:      os.Getenv("S3_ACCESS_KEY"),
		S3SecretKey:      os.Getenv("S3_SECRET_KEY"),
		S3Bucket:         os.Getenv("S3_BUCKET"),
		S3ForcePathStyle: getEnv("S3_FORCE_PATH_STYLE", "true") == "true",
		ZeptoMailAPIKey:    os.Getenv("ZEPTOMAIL_API_KEY"),
		ZeptoMailFromEmail: os.Getenv("ZEPTOMAIL_FROM_EMAIL"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		ScraperAPIKey:    os.Getenv("SCRAPER_API_KEY"),
	}

	// Parse the optional ADMIN_EMAILS comma-separated list.
	if raw := os.Getenv("ADMIN_EMAILS"); raw != "" {
		for _, e := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(strings.ToLower(e)); trimmed != "" {
				cfg.AdminEmails = append(cfg.AdminEmails, trimmed)
			}
		}
	}

	// Resolve the Polar API base URL.
	// Priority:
	//   1. POLAR_API_BASE_URL — explicit override (any host, including custom proxies)
	//   2. POLAR_SANDBOX_MODE=true — automatically selects https://sandbox-api.polar.sh/v1
	//   3. default — https://api.polar.sh/v1 (production)
	//
	// A sandbox access token will be rejected with 401 by the production host,
	// so these two settings MUST match the environment your Polar credentials came from.
	switch {
	case os.Getenv("POLAR_API_BASE_URL") != "":
		cfg.PolarAPIBaseURL = os.Getenv("POLAR_API_BASE_URL")
	case strings.EqualFold(os.Getenv("POLAR_SANDBOX_MODE"), "true") ||
		os.Getenv("POLAR_SANDBOX_MODE") == "1":
		cfg.PolarAPIBaseURL = "https://sandbox-api.polar.sh/v1"
	default:
		cfg.PolarAPIBaseURL = "https://api.polar.sh/v1"
	}

	// Fail fast with a specific message naming the missing variable, so it's
	// immediately obvious what needs to be configured in a new environment.
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("missing required env var DATABASE_URL (postgres connection string)")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("missing required env var JWT_SECRET")
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters long for security")
	}
	if cfg.S3Endpoint == "" {
		return nil, fmt.Errorf("missing required env var S3_ENDPOINT (use http://localhost:9000 for local MinIO)")
	}
	if cfg.S3AccessKey == "" {
		return nil, fmt.Errorf("missing required env var S3_ACCESS_KEY")
	}
	if cfg.S3SecretKey == "" {
		return nil, fmt.Errorf("missing required env var S3_SECRET_KEY")
	}
	if cfg.S3Bucket == "" {
		return nil, fmt.Errorf("missing required env var S3_BUCKET")
	}

	return cfg, nil
}

// AIEnabled reports whether real AI calls can be made.
func (c *Config) AIEnabled() bool {
	return c.AnthropicAPIKey != ""
}

// BillingEnabled reports whether real Polar calls can be made.
func (c *Config) BillingEnabled() bool {
	return c.PolarAccessToken != ""
}

// IsProduction returns true when running in production/release mode.
// Used to enable security flags (e.g. Secure cookies) that should be off in dev.
func (c *Config) IsProduction() bool {
	return c.GinMode == "release"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

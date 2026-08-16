package config

import (
	"fmt"
	"os"
)

// Config holds all environment-driven configuration for the backend,
// loaded and validated once at startup rather than scattering os.Getenv
// calls across packages.
type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	AllowedOrigin string
	GinMode       string

	// AppBaseURL is the public URL of the frontend app (e.g. "http://localhost:5173"
	// in dev, "https://coverdoctor.com" in production). Used to build absolute
	// redirect URLs for Stripe checkout/portal so they work in both environments.
	AppBaseURL string

	// AnthropicAPIKey is optional. If empty, AI features (style tagging,
	// explanations) fall back to safe deterministic behavior rather than
	// failing the request — see internal/ai.
	AnthropicAPIKey string

	// Stripe settings are optional. If StripeSecretKey is empty, billing
	// endpoints return a clear "not configured" error instead of panicking.
	StripeSecretKey      string
	StripeWebhookSecret  string
	StripePriceIDMonthly string
	StripePriceIDAnnual  string

	// Redis configuration for job queue and rate limiting
	RedisURL string

	// S3/MinIO configuration for object storage.
	// S3Endpoint can point at MinIO (local dev), Cloudflare R2, or real AWS S3 —
	// only env vars need to change, no code changes required.
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string
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
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		GinMode:       getEnv("GIN_MODE", "release"),
		AppBaseURL:    getEnv("APP_BASE_URL", "http://localhost:5173"),

		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),

		StripeSecretKey:      os.Getenv("STRIPE_SECRET_KEY"),
		StripeWebhookSecret:  os.Getenv("STRIPE_WEBHOOK_SECRET"),
		StripePriceIDMonthly: os.Getenv("STRIPE_PRICE_ID_MONTHLY"),
		StripePriceIDAnnual:  os.Getenv("STRIPE_PRICE_ID_ANNUAL"),

		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		S3Endpoint:  os.Getenv("S3_ENDPOINT"),
		S3AccessKey: os.Getenv("S3_ACCESS_KEY"),
		S3SecretKey: os.Getenv("S3_SECRET_KEY"),
		S3Bucket:    os.Getenv("S3_BUCKET"),
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

// BillingEnabled reports whether real Stripe calls can be made.
func (c *Config) BillingEnabled() bool {
	return c.StripeSecretKey != ""
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

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
}

// Load reads environment variables into a Config, returning an error only
// if a variable required for the app to run at all is missing.
func Load() (*Config, error) {
	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		GinMode:       getEnv("GIN_MODE", "release"),

		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),

		StripeSecretKey:      os.Getenv("STRIPE_SECRET_KEY"),
		StripeWebhookSecret:  os.Getenv("STRIPE_WEBHOOK_SECRET"),
		StripePriceIDMonthly: os.Getenv("STRIPE_PRICE_ID_MONTHLY"),
		StripePriceIDAnnual:  os.Getenv("STRIPE_PRICE_ID_ANNUAL"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required (see backend/.env)")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required (see backend/.env)")
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters long for security")
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

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

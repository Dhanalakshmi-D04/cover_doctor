package config_test

import (
	"os"
	"testing"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
)

func TestConfigLoad(t *testing.T) {
	origDB := os.Getenv("DATABASE_URL")
	origJWT := os.Getenv("JWT_SECRET")
	defer func() {
		os.Setenv("DATABASE_URL", origDB)
		os.Setenv("JWT_SECRET", origJWT)
	}()

	t.Run("Missing DATABASE_URL", func(t *testing.T) {
		os.Unsetenv("DATABASE_URL")
		os.Setenv("JWT_SECRET", "12345678901234567890123456789012")
		_, err := config.Load()
		if err == nil {
			t.Fatal("expected error when DATABASE_URL is missing")
		}
	})

	t.Run("Missing JWT_SECRET", func(t *testing.T) {
		os.Setenv("DATABASE_URL", "postgres://localhost/test")
		os.Unsetenv("JWT_SECRET")
		_, err := config.Load()
		if err == nil {
			t.Fatal("expected error when JWT_SECRET is missing")
		}
	})

	t.Run("Short JWT_SECRET", func(t *testing.T) {
		os.Setenv("DATABASE_URL", "postgres://localhost/test")
		os.Setenv("JWT_SECRET", "too-short-secret")
		_, err := config.Load()
		if err == nil {
			t.Fatal("expected error when JWT_SECRET is shorter than 32 characters")
		}
	})

	t.Run("Valid Config", func(t *testing.T) {
		os.Setenv("DATABASE_URL", "postgres://localhost/test")
		os.Setenv("JWT_SECRET", "this-is-a-very-long-and-secure-jwt-secret-key-32chars")
		cfg, err := config.Load()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if cfg.JWTSecret != "this-is-a-very-long-and-secure-jwt-secret-key-32chars" {
			t.Fatalf("unexpected JWT secret: %s", cfg.JWTSecret)
		}
	})
}

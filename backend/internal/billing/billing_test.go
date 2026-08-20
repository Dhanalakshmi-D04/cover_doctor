package billing_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestWebhookHandlerUnconfigured(t *testing.T) {
	router := gin.New()
	router.POST("/billing/webhook", billing.HandleWebhook(nil, ""))

	req, _ := http.NewRequest("POST", "/billing/webhook", bytes.NewBufferString("{}"))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 Service Unavailable when webhook secret is unconfigured, got %d", w.Code)
	}
}

func TestBillingClientDisabled(t *testing.T) {
	client := billing.NewClient("")
	if client.Enabled() {
		t.Fatal("expected billing client to be disabled when secretKey is empty")
	}

	_, err := client.CreateCheckoutSession("price_123", "test@example.com", "user_1", "http://success")
	if err == nil {
		t.Fatal("expected error from CreateCheckoutSession when billing client is disabled")
	}

	_, err = client.CreatePortalSession("cus_123")
	if err == nil {
		t.Fatal("expected error from CreatePortalSession when billing client is disabled")
	}
}

package billing_test

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	standardwebhooks "github.com/standard-webhooks/standard-webhooks/libraries/go"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
)

// makeSecret creates a valid base64-encoded 24-byte secret for the
// standard-webhooks library (it expects "whsec_<base64>" format).
func makeSecret(t *testing.T) string {
	t.Helper()
	raw := make([]byte, 24)
	for i := range raw {
		raw[i] = byte(i + 1) // deterministic, non-random for tests
	}
	return "whsec_" + base64.StdEncoding.EncodeToString(raw)
}

// signPayload uses the standard-webhooks signer to produce valid headers
// for the given payload and timestamp.
func signPayload(t *testing.T, secret string, msgID string, ts time.Time, payload []byte) http.Header {
	t.Helper()
	wh, err := standardwebhooks.NewWebhook(secret)
	if err != nil {
		t.Fatalf("failed to create test signer: %v", err)
	}
	sig, err := wh.Sign(msgID, ts, payload)
	if err != nil {
		t.Fatalf("failed to sign payload: %v", err)
	}
	h := http.Header{}
	h.Set("webhook-id", msgID)
	h.Set("webhook-timestamp", fmt.Sprintf("%d", ts.Unix()))
	h.Set("webhook-signature", sig)
	return h
}

func setupWebhookRouter(secret string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/billing/webhook", billing.HandleWebhook(nil, secret, nil))
	return router
}

// ---------------------------------------------------------------------------
// Valid signature — must proceed past verification (reach JSON parsing,
// and return 400 on bad JSON body, NOT 400 on sig failure).
// ---------------------------------------------------------------------------

func TestWebhookSignature_Valid(t *testing.T) {
	secret := makeSecret(t)
	router := setupWebhookRouter(secret)

	payload := []byte(`{"type":"test.event","data":{}}`)
	ts := time.Now()
	headers := signPayload(t, secret, "msg_valid_001", ts, payload)

	req := httptest.NewRequest(http.MethodPost, "/billing/webhook", bytes.NewReader(payload))
	for k, vs := range headers {
		for _, v := range vs {
			req.Header.Set(k, v)
		}
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// 200 OK — signature passed, event type "test.event" is a no-op and returns ok.
	if w.Code != http.StatusOK {
		t.Errorf("valid signature: expected 200 OK, got %d — body: %s", w.Code, w.Body.String())
	}
}

// ---------------------------------------------------------------------------
// Invalid signature — must be rejected with 400.
// ---------------------------------------------------------------------------

func TestWebhookSignature_Invalid(t *testing.T) {
	secret := makeSecret(t)
	router := setupWebhookRouter(secret)

	payload := []byte(`{"type":"subscription.created","data":{}}`)
	ts := time.Now()

	// Use a different secret to produce a bad signature.
	wrongSecret := "whsec_" + base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0xFF}, 24))
	headers := signPayload(t, wrongSecret, "msg_invalid_001", ts, payload)

	req := httptest.NewRequest(http.MethodPost, "/billing/webhook", bytes.NewReader(payload))
	for k, vs := range headers {
		for _, v := range vs {
			req.Header.Set(k, v)
		}
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid signature: expected 400 Bad Request, got %d — body: %s", w.Code, w.Body.String())
	}
}

// ---------------------------------------------------------------------------
// Missing signature headers — must be rejected with 400.
// ---------------------------------------------------------------------------

func TestWebhookSignature_Missing(t *testing.T) {
	secret := makeSecret(t)
	router := setupWebhookRouter(secret)

	payload := []byte(`{"type":"subscription.created","data":{}}`)
	req := httptest.NewRequest(http.MethodPost, "/billing/webhook", bytes.NewReader(payload))
	// Deliberately send NO webhook-id / webhook-timestamp / webhook-signature headers.

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("missing headers: expected 400 Bad Request, got %d — body: %s", w.Code, w.Body.String())
	}
}

// ---------------------------------------------------------------------------
// Unconfigured secret (empty string) — must return 503 Service Unavailable,
// not 401 or 200. Existing test in billing_test.go already covers this;
// verified here for completeness alongside the other sig cases.
// ---------------------------------------------------------------------------

func TestWebhookSignature_UnconfiguredSecret(t *testing.T) {
	router := setupWebhookRouter("") // empty secret = billing disabled

	req := httptest.NewRequest(http.MethodPost, "/billing/webhook", bytes.NewBufferString("{}"))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("unconfigured secret: expected 503, got %d", w.Code)
	}
}

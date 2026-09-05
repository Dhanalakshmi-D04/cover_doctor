package billing

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	webhook "github.com/standard-webhooks/standard-webhooks/libraries/go"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// isHexString returns true if s consists entirely of lowercase hex characters.
// This is how the Polar CLI generates its local webhook secrets.
var hexPattern = regexp.MustCompile(`^[0-9a-f]+$`)

// normalizeWebhookSecret converts any supported secret format into the
// whsec_<standard-padded-base64> format required by the standard-webhooks library:
//
//   - whsec_<base64std padded>    → returned as-is (Polar Dashboard format)
//   - whsec_<base64url unpadded>  → alphabet fixed + padding re-added
//   - raw hex string              → Base64-encoded then wrapped in whsec_
//   - plain base64                → wrapped in whsec_
func normalizeWebhookSecret(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.Trim(s, `"'`)

	// Strip the whsec_ prefix so we can normalise the inner base64 blob,
	// then re-attach it at the end.
	inner := s
	if strings.HasPrefix(s, "whsec_") {
		inner = s[len("whsec_"):]
	} else if hexPattern.MatchString(s) {
		// Raw hex from `polar listen` → encode to standard base64 first.
		inner = base64.StdEncoding.EncodeToString([]byte(s))
		return "whsec_" + inner
	}

	// Fix base64url alphabet (- → +, _ → /) so StdEncoding can decode it.
	inner = strings.NewReplacer("-", "+", "_", "/").Replace(inner)

	// Re-add padding so the length is a multiple of 4.
	switch len(inner) % 4 {
	case 2:
		inner += "=="
	case 3:
		inner += "="
	}

	return "whsec_" + inner
}

type polarWebhookEvent struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type polarSubscriptionData struct {
	ID                string                 `json:"id"`
	Status            string                 `json:"status"` // "active", "canceled", etc.
	CustomerID        string                 `json:"customer_id"`
	ProductID         string                 `json:"product_id"`
	Metadata          map[string]string      `json:"metadata"`
	CustomFieldData   map[string]interface{} `json:"custom_field_data"`
	ClientReferenceID string                 `json:"client_reference_id"`
	CurrentPeriodEnd  string                 `json:"current_period_end"`
}

// HandleWebhook returns a Gin handler that verifies and processes Polar webhook events.
// cfg is needed to map incoming product_id values to plan tier names.
func HandleWebhook(database *sqlx.DB, secret string, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if secret == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "billing is not configured (missing POLAR_WEBHOOK_SECRET)"})
			return
		}

		payload, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read body"})
			return
		}

		headers := make(map[string][]string)
		for k, v := range c.Request.Header {
			headers[k] = v
		}

		// Normalize the secret regardless of format:
		//   whsec_<base64>  → used as-is (Polar Dashboard)
		//   raw hex         → auto Base64-encoded (polar listen CLI)
		fixedSecret := normalizeWebhookSecret(secret)

		wh, err := webhook.NewWebhook(fixedSecret)
		if err != nil {
			slog.Error("failed to initialize webhook verifier", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "webhook configuration error"})
			return
		}

		if err = wh.Verify(payload, headers); err != nil {
			slog.Error("webhook signature verification failed", "error", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signature"})
			return
		}

		var event polarWebhookEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}

		if err := processPolarEvent(database, cfg, event); err != nil {
			slog.Error("failed to process polar webhook", "event_type", event.Type, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process event"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"received": true})
	}
}

// planFromProductID maps a Polar product_id to our Plan tier string.
// Returns empty string if the product_id is unrecognised — callers must
// handle this case and NOT default to any elevated access level.
func planFromProductID(cfg *config.Config, productID string) string {
	if cfg == nil {
		return ""
	}
	switch {
	case productID != "" && productID == cfg.PolarProductIDStarter:
		return string(PlanStarter)
	case productID != "" && productID == cfg.PolarProductIDCreator:
		return string(PlanCreator)
	case productID != "" && productID == cfg.PolarProductIDPublisher:
		return string(PlanPublisher)
	default:
		return ""
	}
}

func processPolarEvent(database *sqlx.DB, cfg *config.Config, event polarWebhookEvent) error {
	switch event.Type {
	case "subscription.created", "subscription.updated":
		var subData polarSubscriptionData
		if err := json.Unmarshal(event.Data, &subData); err != nil {
			return err
		}

		plan := planFromProductID(cfg, subData.ProductID)
		if plan == "" {
			// Unknown product_id — log and abort without changing the user's plan.
			// Never grant elevated access for an unrecognised product.
			slog.Error("polar webhook with unrecognised product_id — plan unchanged",
				"product_id", subData.ProductID,
				"subscription_id", subData.ID,
			)
			return nil
		}

		// If the subscription is no longer active, downgrade to free.
		if subData.Status != "active" && subData.Status != "trialing" {
			plan = string(PlanFree)
		}

		userID := ""
		if subData.CustomFieldData != nil && subData.CustomFieldData["user_id"] != nil {
			userID = fmt.Sprintf("%v", subData.CustomFieldData["user_id"])
		}
		if userID == "" && subData.Metadata != nil {
			userID = subData.Metadata["user_id"]
		}
		if userID == "" {
			userID = subData.ClientReferenceID
		}
		if event.Type == "subscription.created" && userID != "" {
			if err := db.AttachPolarCustomer(database, userID, subData.CustomerID, subData.ID, plan); err != nil {
				return err
			}
		}

		err := db.UpdateSubscriptionByPolarID(database, subData.ID, plan, subData.Status, nil)
		if err == sql.ErrNoRows {
			slog.Warn("webhook update affected 0 rows (polar subscription not found)",
				"subscription_id", subData.ID,
				"client_reference_id", subData.ClientReferenceID,
				"event_type", event.Type,
			)
			return nil // Acknowledge webhook anyway so it doesn't endlessly retry
		}
		return err

	case "subscription.revoked", "subscription.canceled":
		var subData polarSubscriptionData
		if err := json.Unmarshal(event.Data, &subData); err != nil {
			return err
		}
		err := db.UpdateSubscriptionByPolarID(database, subData.ID, string(PlanFree), subData.Status, nil)
		if err == sql.ErrNoRows {
			slog.Warn("webhook update affected 0 rows (polar subscription not found)",
				"subscription_id", subData.ID,
				"event_type", event.Type,
			)
			return nil
		}
		return err
	}

	return nil
}

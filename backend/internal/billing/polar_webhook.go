package billing

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	webhook "github.com/standard-webhooks/standard-webhooks/libraries/go"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

type polarWebhookEvent struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type polarSubscriptionData struct {
	ID                string            `json:"id"`
	Status            string            `json:"status"` // "active", "canceled", etc.
	CustomerID        string            `json:"customer_id"`
	ProductID         string            `json:"product_id"`
	Metadata          map[string]string `json:"metadata"`
	ClientReferenceID string            `json:"client_reference_id"`
	CurrentPeriodEnd  string            `json:"current_period_end"`
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

		wh, err := webhook.NewWebhook(secret)
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

		userID := subData.ClientReferenceID
		if event.Type == "subscription.created" && userID != "" {
			if err := db.AttachPolarCustomer(database, userID, subData.CustomerID, subData.ID, plan); err != nil {
				return err
			}
		}

		return db.UpdateSubscriptionByPolarID(database, subData.ID, plan, subData.Status, nil)

	case "subscription.revoked", "subscription.canceled":
		var subData polarSubscriptionData
		if err := json.Unmarshal(event.Data, &subData); err != nil {
			return err
		}
		return db.UpdateSubscriptionByPolarID(database, subData.ID, string(PlanFree), subData.Status, nil)
	}

	return nil
}

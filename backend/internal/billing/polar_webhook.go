package billing

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	webhook "github.com/standard-webhooks/standard-webhooks/libraries/go"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

type polarWebhookEvent struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type polarSubscriptionData struct {
	ID                 string `json:"id"`
	Status             string `json:"status"` // "active", "canceled", etc
	CustomerID         string `json:"customer_id"`
	Metadata           map[string]string `json:"metadata"`
	ClientReferenceID  string `json:"client_reference_id"`
	CurrentPeriodEnd   string `json:"current_period_end"`
}

func HandleWebhook(database *sqlx.DB, secret string) gin.HandlerFunc {
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
			log.Printf("Failed to initialize webhook verifier: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "webhook configuration error"})
			return
		}

		err = wh.Verify(payload, headers)
		if err != nil {
			log.Printf("Webhook signature verification failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signature"})
			return
		}

		var event polarWebhookEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}

		if err := processPolarEvent(database, event); err != nil {
			log.Printf("Failed to process polar webhook %s: %v", event.Type, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process event"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"received": true})
	}
}

func processPolarEvent(database *sqlx.DB, event polarWebhookEvent) error {
	switch event.Type {
	case "subscription.created", "subscription.updated":
		var subData polarSubscriptionData
		if err := json.Unmarshal(event.Data, &subData); err != nil {
			return err
		}
		
		userID := subData.ClientReferenceID
		plan := string(PlanFree)
		if subData.Status == "active" || subData.Status == "trialing" {
			plan = string(PlanPaid)
		}

		if event.Type == "subscription.created" && userID != "" {
			err := db.AttachPolarCustomer(database, userID, subData.CustomerID, subData.ID)
			if err != nil {
				return err
			}
		}

		// Update by Polar ID just in case client_reference_id isn't always present
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

package billing

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/webhook"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// HandleWebhook processes Stripe subscription lifecycle events and keeps
// the local `subscriptions` table in sync. Stripe is always the source of
// truth here — this handler only mirrors what Stripe already decided, it
// never originates a plan change itself.
func HandleWebhook(database *sqlx.DB, webhookSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if webhookSecret == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "billing webhooks are not configured (missing STRIPE_WEBHOOK_SECRET)"})
			return
		}

		payload, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
			return
		}

		event, err := webhook.ConstructEvent(payload, c.GetHeader("Stripe-Signature"), webhookSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("webhook signature verification failed: %v", err)})
			return
		}

		switch event.Type {
		case "checkout.session.completed":
			var session stripe.CheckoutSession
			if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse checkout session payload"})
				return
			}
			userID := session.ClientReferenceID
			var customerID, subscriptionID string
			if session.Customer != nil {
				customerID = session.Customer.ID
			}
			if session.Subscription != nil {
				subscriptionID = session.Subscription.ID
			}
			if userID != "" && customerID != "" && subscriptionID != "" {
				if err := db.AttachStripeCustomer(database, userID, customerID, subscriptionID); err != nil {
					log.Printf("failed to attach stripe customer for user %s: %v", userID, err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to link subscription"})
					return
				}
			}

		case "customer.subscription.created", "customer.subscription.updated":
			var sub stripe.Subscription
			if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse subscription payload"})
				return
			}
			if err := db.UpdateSubscriptionByStripeID(database, sub.ID, "paid", string(sub.Status)); err != nil {
				log.Printf("failed to update subscription for stripe sub %s: %v", sub.ID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
				return
			}

		case "customer.subscription.deleted":
			var sub stripe.Subscription
			if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse subscription payload"})
				return
			}
			if err := db.UpdateSubscriptionByStripeID(database, sub.ID, "free", "canceled"); err != nil {
				log.Printf("failed to delete subscription for stripe sub %s: %v", sub.ID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"received": true})
	}
}

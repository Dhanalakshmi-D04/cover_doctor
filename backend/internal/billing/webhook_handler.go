package billing

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/webhook"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// HandleWebhook processes Stripe subscription lifecycle events and keeps
// the local `subscriptions` table in sync. Stripe is always the source of
// truth — this handler only mirrors what Stripe already decided.
//
// Idempotency: Stripe retries webhook deliveries on failure. We record every
// processed event ID in the `processed_stripe_events` table and skip duplicates,
// so retries never cause double-processing (e.g. upgrading a user twice).
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

		// Idempotency check: if we've already handled this event, acknowledge
		// it and return 200 so Stripe stops retrying. Don't process it again.
		alreadyDone, err := db.HasProcessedStripeEvent(database, event.ID)
		if err != nil {
			slog.Error("failed to check stripe event idempotency", "event_id", event.ID, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		if alreadyDone {
			slog.Info("Stripe event already processed, skipping", "event_id", event.ID, "type", event.Type)
			c.JSON(http.StatusOK, gin.H{"received": true, "skipped": true})
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
					slog.Error("failed to attach stripe customer", "user_id", userID, "error", err)
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
			// Convert the Unix timestamp Stripe sends into a *time.Time so we
			// can store it and eventually show users their renewal date.
			var periodEnd *time.Time
			if sub.CurrentPeriodEnd > 0 {
				t := time.Unix(sub.CurrentPeriodEnd, 0).UTC()
				periodEnd = &t
			}
			if err := db.UpdateSubscriptionByStripeID(database, sub.ID, "paid", string(sub.Status), periodEnd); err != nil {
				slog.Error("failed to update subscription", "stripe_sub_id", sub.ID, "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
				return
			}

		case "customer.subscription.deleted":
			var sub stripe.Subscription
			if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse subscription payload"})
				return
			}
			if err := db.UpdateSubscriptionByStripeID(database, sub.ID, "free", "canceled", nil); err != nil {
				slog.Error("failed to cancel subscription", "stripe_sub_id", sub.ID, "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
				return
			}
		}

		// Mark this event as processed so Stripe retries don't run it again.
		if err := db.MarkStripeEventProcessed(database, event.ID); err != nil {
			// Log but don't fail — we already applied the change successfully above.
			slog.Warn("failed to record processed stripe event", "event_id", event.ID, "error", err)
		}

		c.JSON(http.StatusOK, gin.H{"received": true})
	}
}

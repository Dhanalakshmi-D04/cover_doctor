package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// CreateCheckoutSession handles POST /billing/checkout: starts a Stripe
// Checkout session for the authenticated user to subscribe to the paid plan.
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load account"})
		return
	}

	var req struct {
		Plan string `json:"plan"` // "monthly" | "annual"
	}
	_ = c.ShouldBindJSON(&req)

	priceID := h.Config.StripePriceIDMonthly
	if req.Plan == "annual" {
		priceID = h.Config.StripePriceIDAnnual
	}

	// Build redirect URLs from APP_BASE_URL so they work in dev and production
	// without any code changes — just swap the env var.
	base := h.Config.AppBaseURL
	successURL := base + "/billing/success"
	cancelURL := base + "/billing/cancel"

	checkoutURL, err := h.Billing.CreateCheckoutSession(priceID, user.Email, userID, successURL, cancelURL)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "checkout is currently unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"checkout_url": checkoutURL})
}

// CreatePortalSession handles POST /billing/portal: opens the Stripe Customer
// Portal where users can manage, upgrade, or cancel their subscription.
func (h *Handler) CreatePortalSession(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	sub, err := db.GetSubscriptionByUserID(h.DB, userID)
	if err != nil || sub == nil || sub.StripeCustomerID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no billing account found — subscribe first"})
		return
	}

	returnURL := h.Config.AppBaseURL + "/account"

	portalURL, err := h.Billing.CreatePortalSession(*sub.StripeCustomerID, returnURL)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "billing portal is currently unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"portal_url": portalURL})
}

// StripeWebhook handles POST /billing/webhook. Stripe signs this payload
// itself, so this route sits outside the JWT-authenticated route group.
func (h *Handler) StripeWebhook(c *gin.Context) {
	billing.HandleWebhook(h.DB, h.Config.StripeWebhookSecret)(c)
}

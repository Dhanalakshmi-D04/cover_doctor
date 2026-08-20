package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// CreateCheckoutSession handles POST /billing/checkout: starts a Polar
// Checkout session for the authenticated user to subscribe to the paid plan.
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load account"})
		return
	}

	productID := h.Config.PolarProductIDMonthly

	// Build redirect URLs from APP_BASE_URL so they work in dev and production
	// without any code changes — just swap the env var.
	base := h.Config.AppBaseURL
	successURL := base + "/billing/success?checkout_id={CHECKOUT_ID}"

	checkoutURL, err := h.Billing.CreateCheckoutSession(productID, user.Email, userID, successURL)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "checkout is currently unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"checkout_url": checkoutURL})
}

// CreatePortalSession handles POST /billing/portal: opens the Polar Customer
// Portal where users can manage, upgrade, or cancel their subscription.
func (h *Handler) CreatePortalSession(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	sub, err := db.GetSubscriptionByUserID(h.DB, userID)
	if err != nil || sub == nil || sub.PolarCustomerID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no billing account found — subscribe first"})
		return
	}

	portalURL, err := h.Billing.CreatePortalSession(*sub.PolarCustomerID)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "billing portal is currently unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"portal_url": portalURL})
}

// PolarWebhook handles POST /billing/webhook. Polar signs this payload
// itself, so this route sits outside the JWT-authenticated route group.
func (h *Handler) PolarWebhook(c *gin.Context) {
	billing.HandleWebhook(h.DB, h.Config.PolarWebhookSecret)(c)
}

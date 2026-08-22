package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/billing"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
)

// planToProductID maps a plan name string to the configured Polar product ID.
func (h *Handler) planToProductID(plan string) (string, error) {
	switch plan {
	case "starter":
		if h.Config.PolarProductIDStarter == "" {
			return "", fmt.Errorf("POLAR_PRODUCT_ID_STARTER is not configured")
		}
		return h.Config.PolarProductIDStarter, nil
	case "creator":
		if h.Config.PolarProductIDCreator == "" {
			return "", fmt.Errorf("POLAR_PRODUCT_ID_CREATOR is not configured")
		}
		return h.Config.PolarProductIDCreator, nil
	case "publisher":
		if h.Config.PolarProductIDPublisher == "" {
			return "", fmt.Errorf("POLAR_PRODUCT_ID_PUBLISHER is not configured")
		}
		return h.Config.PolarProductIDPublisher, nil
	default:
		return "", fmt.Errorf("unknown plan %q — must be starter, creator, or publisher", plan)
	}
}

// GetCheckoutURL handles GET /billing/checkout-url?plan=starter|creator|publisher.
// Returns a Polar-hosted checkout URL so the frontend never needs to know product IDs.
// The backend injects client_reference_id (userID) so the webhook links payment to the account.
func (h *Handler) GetCheckoutURL(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)
	plan := c.Query("plan")
	if plan == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan query parameter is required (starter|creator|publisher)"})
		return
	}

	productID, err := h.planToProductID(plan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load account"})
		return
	}

	base := h.Config.AppBaseURL
	successURL := base + "/billing/success?checkout_id={CHECKOUT_ID}"

	checkoutURL, err := h.Billing.CreateCheckoutSession(productID, user.Email, userID, successURL)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "checkout is currently unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"checkout_url": checkoutURL})
}

// CreateCheckoutSession handles POST /billing/checkout.
// Legacy endpoint kept for backwards compat — prefer GET /billing/checkout-url?plan=X.
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	var req struct {
		Plan string `json:"plan"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.Plan == "" {
		req.Plan = "creator" // fallback for old callers that didn't send a plan
	}

	productID, err := h.planToProductID(req.Plan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load account"})
		return
	}

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
	billing.HandleWebhook(h.DB, h.Config.PolarWebhookSecret, h.Config)(c)
}

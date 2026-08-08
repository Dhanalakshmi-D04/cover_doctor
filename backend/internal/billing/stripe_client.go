package billing

import (
	"fmt"

	"github.com/stripe/stripe-go/v81"
	billingportalsession "github.com/stripe/stripe-go/v81/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v81/checkout/session"
)

// Client wraps the Stripe calls needed for Checkout and the Customer
// Portal. If no secret key is configured, calls return a clear error
// instead of panicking — billing is optional infrastructure that
// shouldn't block the rest of the app from running locally without
// Stripe test keys.
type Client struct {
	enabled bool
}

// NewClient creates a billing client. If secretKey is empty, the client is
// disabled.
func NewClient(secretKey string) *Client {
	if secretKey != "" {
		stripe.Key = secretKey
	}
	return &Client{enabled: secretKey != ""}
}

// Enabled reports whether real Stripe calls will be made.
func (c *Client) Enabled() bool {
	return c.enabled
}

// CreateCheckoutSession starts a Stripe Checkout session for a
// subscription and returns the hosted checkout URL to redirect to.
func (c *Client) CreateCheckoutSession(priceID, customerEmail, userID, successURL, cancelURL string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("billing is not configured (missing STRIPE_SECRET_KEY)")
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{Price: stripe.String(priceID), Quantity: stripe.Int64(1)},
		},
		CustomerEmail:     stripe.String(customerEmail),
		ClientReferenceID: stripe.String(userID),
		SuccessURL:        stripe.String(successURL),
		CancelURL:         stripe.String(cancelURL),
	}

	session, err := checkoutsession.New(params)
	if err != nil {
		return "", fmt.Errorf("creating checkout session: %w", err)
	}

	return session.URL, nil
}

// CreatePortalSession starts a Stripe Customer Portal session for managing
// an existing subscription (upgrade/downgrade/cancel/update card).
func (c *Client) CreatePortalSession(stripeCustomerID, returnURL string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("billing is not configured (missing STRIPE_SECRET_KEY)")
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(stripeCustomerID),
		ReturnURL: stripe.String(returnURL),
	}

	session, err := billingportalsession.New(params)
	if err != nil {
		return "", fmt.Errorf("creating portal session: %w", err)
	}

	return session.URL, nil
}

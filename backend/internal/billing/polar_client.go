package billing

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

const (
	PolarProductionBaseURL = "https://api.polar.sh/v1"
	PolarSandboxBaseURL    = "https://sandbox-api.polar.sh/v1"
)

// Client wraps the Polar calls needed for Checkout and the Customer Portal.
type Client struct {
	enabled     bool
	accessToken string
	baseURL     string
}

// NewClient creates a billing client.
// baseURL should be PolarProductionBaseURL or PolarSandboxBaseURL (or any
// override value). If empty, PolarProductionBaseURL is used as the default.
// If accessToken is empty the client is disabled and no real calls are made.
func NewClient(accessToken, baseURL string) *Client {
	if baseURL == "" {
		baseURL = PolarProductionBaseURL
	}
	return &Client{
		enabled:     accessToken != "",
		accessToken: accessToken,
		baseURL:     baseURL,
	}
}

// Enabled reports whether real Polar calls will be made.
func (c *Client) Enabled() bool {
	return c.enabled
}

func (c *Client) request(method, path string, body interface{}, respObj interface{}) error {
	url := c.baseURL + path
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Printf("error closing response body: %v\n", closeErr)
		}
	}()

	if resp.StatusCode >= 400 {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("polar API error (status %d): %s", resp.StatusCode, string(respBytes))
	}

	if respObj != nil {
		if err := json.NewDecoder(resp.Body).Decode(respObj); err != nil {
			return err
		}
	}

	return nil
}

// CreateCheckoutSession starts a Polar Checkout session for a
// subscription and returns the hosted checkout URL to redirect to.
func (c *Client) CreateCheckoutSession(productID, customerEmail, userID, successURL string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("billing is not configured (missing POLAR_ACCESS_TOKEN)")
	}

	payload := map[string]interface{}{
		"product_id":          productID,
		"customer_email":      customerEmail,
		"success_url":         successURL,
		"client_reference_id": userID,
		"metadata": map[string]string{
			"user_id": userID,
		},
		"custom_field_data": map[string]interface{}{
			"user_id": userID,
		},
	}

	var resp struct {
		URL string `json:"url"`
	}

	if err := c.request("POST", "/checkouts", payload, &resp); err != nil {
		return "", fmt.Errorf("creating checkout session: %w", err)
	}

	return resp.URL, nil
}

// CreatePortalSession starts a Polar Customer Portal session for managing
// an existing subscription.
func (c *Client) CreatePortalSession(polarCustomerID string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("billing is not configured (missing POLAR_ACCESS_TOKEN)")
	}

	payload := map[string]interface{}{
		"customer_id": polarCustomerID,
	}

	var resp struct {
		CustomerPortalURL string `json:"customer_portal_url"`
	}

	if err := c.request("POST", "/customer-portal", payload, &resp); err != nil {
		return "", fmt.Errorf("creating portal session: %w", err)
	}

	return resp.CustomerPortalURL, nil
}

// CancelSubscription deletes/cancels a user's active Polar subscription.
func (c *Client) CancelSubscription(polarSubscriptionID string) error {
	if !c.enabled {
		return nil
	}

	// Polar API uses DELETE to immediately revoke a subscription.
	path := "/subscriptions/" + polarSubscriptionID
	if err := c.request("DELETE", path, nil, nil); err != nil {
		return fmt.Errorf("canceling subscription: %w", err)
	}

	return nil
}

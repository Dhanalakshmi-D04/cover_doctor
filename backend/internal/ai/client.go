// Package ai contains the ONLY two AI touchpoints in this codebase: style
// classification and explanation writing. Nothing here ever decides a
// score or a recommendation — see docs/00-overview.md and
// docs/03-project-architecture.md, which deliberately keep this package
// the smallest and most isolated in the backend.
package ai

// Client wraps calls to Claude for style tagging and explanation writing.
type Client struct {
	apiKey  string
	enabled bool
}

// NewClient creates an AI client. If apiKey is empty, the client is
// disabled: its methods return safe, deterministic fallbacks instead of
// failing — AI is a narrow enhancement here, never a hard dependency for a
// report to exist.
func NewClient(apiKey string) *Client {
	return &Client{apiKey: apiKey, enabled: apiKey != ""}
}

// Enabled reports whether real AI calls will be made.
func (c *Client) Enabled() bool {
	return c.enabled
}

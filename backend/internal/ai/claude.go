package ai

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

const (
	claudeAPIURL     = "https://api.anthropic.com/v1/messages"
	claudeModel      = "claude-3-5-sonnet-20241022"
	claudeAPIVersion = "2023-06-01"
)

type claudeImageSource struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}

type claudeContentBlock struct {
	Type   string             `json:"type"`
	Text   string             `json:"text,omitempty"`
	Source *claudeImageSource `json:"source,omitempty"`
}

type claudeMessage struct {
	Role    string               `json:"role"`
	Content []claudeContentBlock `json:"content"`
}

type claudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []claudeMessage `json:"messages"`
}

type claudeResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// callClaudeText sends a plain text prompt and returns Claude's text reply.
func (c *Client) callClaudeText(prompt string) (string, error) {
	return c.callClaude(claudeMessage{
		Role:    "user",
		Content: []claudeContentBlock{{Type: "text", Text: prompt}},
	})
}

// callClaudeVision sends an image plus a text prompt and returns Claude's
// text reply.
func (c *Client) callClaudeVision(prompt string, imageBytes []byte, mediaType string) (string, error) {
	encoded := base64.StdEncoding.EncodeToString(imageBytes)

	return c.callClaude(claudeMessage{
		Role: "user",
		Content: []claudeContentBlock{
			{
				Type: "image",
				Source: &claudeImageSource{
					Type:      "base64",
					MediaType: mediaType,
					Data:      encoded,
				},
			},
			{Type: "text", Text: prompt},
		},
	})
}

func (c *Client) callClaude(message claudeMessage) (string, error) {
	reqBody := claudeRequest{
		Model:     claudeModel,
		MaxTokens: 512,
		Messages:  []claudeMessage{message},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("encoding request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, claudeAPIURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", claudeAPIVersion)

	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling claude API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response: %w", err)
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(respBytes, &claudeResp); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}

	if claudeResp.Error != nil {
		return "", fmt.Errorf("claude API error: %s", claudeResp.Error.Message)
	}
	if len(claudeResp.Content) == 0 {
		return "", fmt.Errorf("empty response from claude")
	}

	return strings.TrimSpace(claudeResp.Content[0].Text), nil
}

func detectMediaType(path string) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".webp":
		return "image/webp"
	default:
		return "image/png"
	}
}

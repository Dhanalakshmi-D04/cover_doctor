package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
)

type EmailSender interface {
	SendPasswordResetEmail(ctx context.Context, to, resetLink string) error
}

type ResendSender struct {
	apiKey    string
	fromEmail string
}

func NewResendSender(cfg *config.Config) *ResendSender {
	return &ResendSender{
		apiKey:    cfg.ResendAPIKey,
		fromEmail: cfg.ResendFromEmail,
	}
}

type resendRequest struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

type resendResponse struct {
	ID      string `json:"id,omitempty"`
	Message string `json:"message,omitempty"`
}

func (s *ResendSender) SendPasswordResetEmail(ctx context.Context, to, resetLink string) error {
	if s.apiKey == "" || s.fromEmail == "" {
		return fmt.Errorf("resend email not configured")
	}

	htmlContent := fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Reset your password</h2>
			<p>You requested a password reset for your Cover Doctor account.</p>
			<p>Click the link below to set a new password. This link will expire in 1 hour.</p>
			<p><a href="%s" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
			<p>If you didn't request this, you can safely ignore this email.</p>
		</div>
	`, resetLink)

	reqBody := resendRequest{
		From:    s.fromEmail,
		To:      to,
		Subject: "Reset your password - Cover Doctor",
		HTML:    htmlContent,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("encoding resend request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("building resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	httpClient := &http.Client{Timeout: 10 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("calling resend API: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("error closing resend response body: %v", err)
		}
	}()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("reading resend response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var apiErr resendResponse
		if err := json.Unmarshal(respBytes, &apiErr); err == nil && apiErr.Message != "" {
			return fmt.Errorf("resend API error: %s", apiErr.Message)
		}
		return fmt.Errorf("resend API error: status %d %s", resp.StatusCode, string(respBytes))
	}

	return nil
}

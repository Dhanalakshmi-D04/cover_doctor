package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
)

type EmailSender interface {
	SendPasswordResetEmail(ctx context.Context, to, resetLink string) error
}

// ZeptoMailSender sends transactional email via the ZeptoMail v1.1 API.
// It implements the EmailSender interface.
type ZeptoMailSender struct {
	apiKey    string
	fromEmail string
}

// NewZeptoMailSender returns a ZeptoMailSender wired up from config.
// If either ZEPTOMAIL_API_KEY or ZEPTOMAIL_FROM_EMAIL is unset, the sender
// is still returned — SendPasswordResetEmail will return a clear error
// rather than panicking at startup, consistent with how the rest of the
// optional third-party clients (Polar, Anthropic) behave.
func NewZeptoMailSender(cfg *config.Config) *ZeptoMailSender {
	return &ZeptoMailSender{
		apiKey:    cfg.ZeptoMailAPIKey,
		fromEmail: cfg.ZeptoMailFromEmail,
	}
}

// zeptoMailRequest matches the ZeptoMail v1.1 /email body shape.
type zeptoMailRequest struct {
	From    zeptoMailAddress   `json:"from"`
	To      []zeptoMailTo      `json:"to"`
	Subject string             `json:"subject"`
	HTMLBody string            `json:"htmlbody"`
}

type zeptoMailAddress struct {
	Address string `json:"address"`
	Name    string `json:"name"`
}

type zeptoMailTo struct {
	EmailAddress zeptoMailAddress `json:"email_address"`
}

// zeptoMailErrorResponse is the shape ZeptoMail returns on 4xx/5xx responses.
type zeptoMailErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Details []struct {
			Message string `json:"message"`
		} `json:"details"`
		Message string `json:"message"`
	} `json:"error"`
}

// SendPasswordResetEmail sends a password reset link to the given address.
// It implements the EmailSender interface.
func (s *ZeptoMailSender) SendPasswordResetEmail(ctx context.Context, to, resetLink string) error {
	if s.apiKey == "" || s.fromEmail == "" {
		return fmt.Errorf("zeptomail: not configured — set ZEPTOMAIL_API_KEY and ZEPTOMAIL_FROM_EMAIL")
	}

	htmlBody := fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Reset your password</h2>
			<p>You requested a password reset for your Cover Doctor account.</p>
			<p>Click the link below to set a new password. This link will expire in <strong>1 hour</strong>.</p>
			<p>
				<a href="%s" style="display:inline-block; background-color:#007bff; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
					Reset Password
				</a>
			</p>
			<p style="color:#666; font-size:0.9em;">
				If you didn't request this, you can safely ignore this email — your password will not change.
			</p>
		</div>
	`, resetLink)

	reqBody := zeptoMailRequest{
		From: zeptoMailAddress{
			Address: s.fromEmail,
			Name:    "Cover Doctor",
		},
		To: []zeptoMailTo{
			{EmailAddress: zeptoMailAddress{Address: to, Name: ""}},
		},
		Subject:  "Reset your password",
		HTMLBody: htmlBody,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("zeptomail: encoding request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.zeptomail.com/v1.1/email", bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("zeptomail: building request: %w", err)
	}

	// ZeptoMail uses "Zoho-enczapikey <key>" — NOT the standard "Bearer <token>" pattern.
	req.Header.Set("Authorization", "Zoho-enczapikey "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	httpClient := &http.Client{Timeout: 10 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("zeptomail: calling API: %w", err)
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			slog.Warn("zeptomail: error closing response body", "error", closeErr)
		}
	}()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("zeptomail: reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var apiErr zeptoMailErrorResponse
		if jsonErr := json.Unmarshal(respBytes, &apiErr); jsonErr == nil && apiErr.Error.Message != "" {
			slog.Error("zeptomail: API error",
				"status", resp.StatusCode,
				"code", apiErr.Error.Code,
				"message", apiErr.Error.Message,
				"to", to,
			)
			return fmt.Errorf("zeptomail: API error %s: %s", apiErr.Error.Code, apiErr.Error.Message)
		}
		slog.Error("zeptomail: unexpected API error", "status", resp.StatusCode, "body", string(respBytes))
		return fmt.Errorf("zeptomail: API error status %d: %s", resp.StatusCode, string(respBytes))
	}

	return nil
}

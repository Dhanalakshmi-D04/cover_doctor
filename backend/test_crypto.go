package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	webhook "github.com/standard-webhooks/standard-webhooks/libraries/go"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		fmt.Printf("Error loading .env: %v\n", err)
		return
	}

	secret := os.Getenv("POLAR_WEBHOOK_SECRET")
	fmt.Printf("Raw secret length: %d\n", len(secret))

	cleanSecret := strings.TrimSpace(secret)
	payloadStr := cleanSecret
	if strings.HasPrefix(cleanSecret, "whsec_") {
		payloadStr = cleanSecret[6:]
	}

	payloadStr = strings.ReplaceAll(payloadStr, "-", "+")
	payloadStr = strings.ReplaceAll(payloadStr, "_", "/")

	switch len(payloadStr) % 4 {
	case 2:
		payloadStr += "=="
	case 3:
		payloadStr += "="
	}

	fixedSecret := payloadStr
	if strings.HasPrefix(cleanSecret, "whsec_") {
		fixedSecret = "whsec_" + payloadStr
	}

	fmt.Printf("Fixed secret length: %d\n", len(fixedSecret))

	// 1. Try standard base64 decode manually
	secretBytes, err := base64.StdEncoding.DecodeString(payloadStr)
	if err != nil {
		fmt.Printf("Manual Base64 Decode Error: %v\n", err)
	} else {
		fmt.Printf("Manual Base64 Decode SUCCESS: %d bytes\n", len(secretBytes))
	}

	// 2. Try webhook.NewWebhook
	wh, err := webhook.NewWebhook(fixedSecret)
	if err != nil {
		fmt.Printf("Library NewWebhook Error: %v\n", err)
	} else {
		fmt.Printf("Library NewWebhook SUCCESS\n")
	}

	// 3. Manual HMAC calculation
	msgId := "msg_test123"
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	payload := `{"test":"data"}`

	toSign := fmt.Sprintf("%s.%s.%s", msgId, timestamp, payload)

	h := hmac.New(sha256.New, secretBytes)
	h.Write([]byte(toSign))
	computedSig := base64.StdEncoding.EncodeToString(h.Sum(nil))

	fmt.Printf("Manually Computed Signature (v1,msgId,timestamp,payload): v1,%s\n", computedSig)

	// 4. Compare with library
	if wh != nil {
		libSig, _ := wh.Sign(msgId, time.Unix(time.Now().Unix(), 0), []byte(payload))
		fmt.Printf("Library Computed Signature: %s\n", libSig)
		if "v1,"+computedSig == libSig {
			fmt.Printf("MATCH! Manual crypto perfectly matches library.\n")
		} else {
			fmt.Printf("MISMATCH!\n")
		}
	}
}

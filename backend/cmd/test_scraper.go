package main

import (
	"context"
	"fmt"
	"time"
	"os"

	"github.com/joho/godotenv"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
)

func main() {
	_ = godotenv.Load(".env")
	token := os.Getenv("APIFY_TOKEN")
	if token == "" {
		fmt.Println("No APIFY_TOKEN found!")
		return
	}

	fmt.Printf("Using Apify Token: %s***\n", token[:15])

	source := scraper.NewAmazonSource(120*time.Second, token)
	
	fmt.Println("Starting test fetch for Minimalist style (limit 3)... This may take 30-60 seconds for Apify to spin up Chrome...")
	covers, err := source.FetchTopCovers(context.Background(), "Minimalist", 3)
	if err != nil {
		fmt.Printf("FAILED: %v\n", err)
		return
	}

	fmt.Printf("\nSUCCESS! Extracted %d covers:\n", len(covers))
	for i, c := range covers {
		fmt.Printf("%d. %s\n   URL: %s\n   Bytes: %d\n", i+1, c.Title, c.ImageURL, len(c.ImageData))
	}
}

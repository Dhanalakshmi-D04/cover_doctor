package scraper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
	"regexp"
	"strings"
)

type AmazonSource struct {
	client   *http.Client
	apiToken string
}

func NewAmazonSource(timeout time.Duration, apiToken string) *AmazonSource {
	if timeout <= 0 {
		timeout = 60 * time.Second // Apify Puppeteer can take 30-40 seconds to spin up and render
	}

	return &AmazonSource{
		client:   &http.Client{Timeout: timeout},
		apiToken: apiToken,
	}
}

func (a *AmazonSource) Name() string {
	return "AmazonBestsellers_Apify"
}

// apifyRequest Payload for the Apify Puppeteer Scraper Actor
type apifyRequest struct {
	StartUrls    []map[string]string `json:"startUrls"`
	PageFunction string              `json:"pageFunction"`
}

// apifyResponse Represents the dataset item returned by the actor
type apifyResponse []struct {
	Html string `json:"html"`
}

func (a *AmazonSource) FetchTopCovers(ctx context.Context, style string, limit int) ([]BestsellerCover, error) {
	if a.apiToken == "" {
		return nil, fmt.Errorf("APIFY_TOKEN is not configured")
	}

	amazonURL := getAmazonCategoryURL(style)

	// We use Apify's official Puppeteer Scraper (apify/puppeteer-scraper)
	// run-sync-get-dataset-items allows us to start the job, wait for it to finish, and get the data in one request!
	apiURL := fmt.Sprintf("https://api.apify.com/v2/acts/apify~puppeteer-scraper/run-sync-get-dataset-items?token=%s", a.apiToken)

	reqPayload := apifyRequest{
		StartUrls: []map[string]string{{"url": amazonURL}},
		// This tiny JS function runs inside the Apify headless browser and grabs the fully rendered HTML
		PageFunction: "async function pageFunction(context) { return { html: await context.page.content() }; }",
	}

	reqBytes, _ := json.Marshal(reqPayload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("apify API request failed: %w", err)
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			fmt.Printf("error closing apify response body: %v\n", closeErr)
		}
	}()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyErr, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("apify API returned status %d: %s", resp.StatusCode, string(bodyErr))
	}

	var dataset apifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&dataset); err != nil {
		return nil, fmt.Errorf("failed to decode apify response: %w", err)
	}

	if len(dataset) == 0 || dataset[0].Html == "" {
		return nil, fmt.Errorf("apify returned empty dataset")
	}

	// Parse HTML using goquery
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(dataset[0].Html))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	var covers []BestsellerCover
	reHighRes := regexp.MustCompile(`\._.*_\.([a-zA-Z0-9]+)$`)
	reJSONUrl := regexp.MustCompile(`https://[^"]+`)

	doc.Find("img.a-dynamic-image").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if len(covers) >= limit {
			return false
		}

		imgSrc, exists := s.Attr("src")
		if !exists || imgSrc == "" {
			dynamicJSON, dynExists := s.Attr("data-a-dynamic-image")
			if dynExists {
				match := reJSONUrl.FindString(dynamicJSON)
				if match != "" {
					imgSrc = match
				}
			}
		}

		if imgSrc == "" {
			return true
		}

		highResSrc := reHighRes.ReplaceAllString(imgSrc, ".$1")

		imgData, err := a.downloadImage(ctx, highResSrc)
		if err != nil || len(imgData) == 0 {
			return true
		}

		covers = append(covers, BestsellerCover{
			ID:        uuid.New().String(),
			Title:     fmt.Sprintf("Amazon Bestseller %d (%s)", i+1, style),
			Style:     style,
			ImageURL:  highResSrc,
			ImageData: imgData,
			Filename:  fmt.Sprintf("amazon_%s_%d.jpg", style, i+1),
		})

		return true
	})

	if len(covers) == 0 {
		return nil, fmt.Errorf("failed to extract any covers from Amazon HTML")
	}

	return covers, nil
}

func (a *AmazonSource) downloadImage(ctx context.Context, imgURL string) ([]byte, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, imgURL, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			fmt.Printf("error closing image response body: %v\n", closeErr)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func getAmazonCategoryURL(style string) string {
	switch style {
	case "Dark Photographic":
		return "https://www.amazon.com/best-sellers-books/zgbs/books/10484"
	case "Illustrated":
		return "https://www.amazon.com/best-sellers-books/zgbs/books/16190"
	case "Bold Typography":
		return "https://www.amazon.com/best-sellers-books/zgbs/books/3"
	case "Minimalist":
		return "https://www.amazon.com/best-sellers-books/zgbs/books/4736"
	default:
		return "https://www.amazon.com/best-sellers-books/zgbs/books/17"
	}
}

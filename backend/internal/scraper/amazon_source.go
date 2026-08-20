package scraper

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
)

type AmazonSource struct {
	client *http.Client
	apiKey string
}

func NewAmazonSource(timeout time.Duration, apiKey string) *AmazonSource {
	if timeout <= 0 {
		timeout = 30 * time.Second // ScraperAPI can take longer as it rotates proxies
	}
	return &AmazonSource{
		client: &http.Client{Timeout: timeout},
		apiKey: apiKey,
	}
}

func (a *AmazonSource) Name() string {
	return "AmazonBestsellers_Production"
}

func (a *AmazonSource) FetchTopCovers(ctx context.Context, style string, limit int) ([]BestsellerCover, error) {
	if a.apiKey == "" {
		return nil, fmt.Errorf("SCRAPER_API_KEY is not configured")
	}

	amazonURL := getAmazonCategoryURL(style)

	// Construct the ScraperAPI URL
	apiURL := fmt.Sprintf("http://api.scraperapi.com?api_key=%s&url=%s&render=true", a.apiKey, url.QueryEscape(amazonURL))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("scraper API request failed: %w", err)
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			// Just log the error, don't fail the whole scrape
			fmt.Printf("error closing response body: %v\n", closeErr)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("scraper API returned status: %d", resp.StatusCode)
	}

	// Parse HTML using goquery
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	var covers []BestsellerCover

	// Find all images within the Amazon Bestseller grid
	doc.Find("img.a-dynamic-image").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if len(covers) >= limit {
			return false // Stop when we hit the limit
		}

		imgSrc, exists := s.Attr("src")
		if !exists || imgSrc == "" {
			return true // continue to next
		}

		// Download the actual image byte array
		imgData, err := a.downloadImage(ctx, imgSrc)
		if err != nil || len(imgData) == 0 {
			return true // continue to next
		}

		covers = append(covers, BestsellerCover{
			ID:        uuid.New().String(),
			Title:     fmt.Sprintf("Amazon Bestseller %d (%s)", i+1, style),
			Style:     style,
			ImageURL:  imgSrc,
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
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

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
		// Thriller / Suspense
		return "https://www.amazon.com/best-sellers-books/zgbs/books/10484"
	case "Illustrated":
		// Fantasy
		return "https://www.amazon.com/best-sellers-books/zgbs/books/16190"
	case "Bold Typography":
		// Business & Money
		return "https://www.amazon.com/best-sellers-books/zgbs/books/3"
	case "Minimalist":
		// Self-Help
		return "https://www.amazon.com/best-sellers-books/zgbs/books/4736"
	default:
		// Fallback to general Literature & Fiction
		return "https://www.amazon.com/best-sellers-books/zgbs/books/17"
	}
}

package scraper

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/measure"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
)

// ScrapeAndSave executes a full bestseller cover scraping and measurement pipeline,
// inserting extracted visual benchmark metrics into PostgreSQL.
// progressFn is called after every meaningful step so callers can expose live status.
func ScrapeAndSave(ctx context.Context, database *sqlx.DB, aiClient *ai.Client, sources []BestsellerSource, opts Options, progressFn func(ScrapeProgress)) (*ScrapeResult, error) {
	if len(opts.Styles) == 0 {
		opts.Styles = DefaultOptions().Styles
	}
	if opts.LimitPerStyle <= 0 {
		opts.LimitPerStyle = DefaultOptions().LimitPerStyle
	}
	if opts.TempDir == "" {
		opts.TempDir = DefaultOptions().TempDir
	}
	if len(sources) == 0 {
		sources = []BestsellerSource{NewSampleSource()}
	}
	if progressFn == nil {
		progressFn = func(ScrapeProgress) {} // no-op so callers don't need to check nil
	}

	if err := os.MkdirAll(opts.TempDir, 0o755); err != nil {
		return nil, fmt.Errorf("creating temp directory %s: %w", opts.TempDir, err)
	}

	start := time.Now()
	result := &ScrapeResult{
		StartedAt: start,
		ByStyle:   make(map[string]int),
		Errors:    make([]string, 0),
	}

	// Reset table if overwrite is explicitly requested
	if opts.OverwriteData && database != nil {
		if err := db.ClearBenchmarks(database); err != nil {
			log.Printf("warning: failed to clear existing benchmarks table: %v", err)
		}
	}

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Estimate total covers so the progress bar can show a percent
	totalEstimated := len(opts.Styles) * len(sources) * opts.LimitPerStyle

	for _, style := range opts.Styles {
		for _, source := range sources {
			if ctx.Err() != nil {
				return result, ctx.Err()
			}

			progressFn(ScrapeProgress{
				CurrentStyle:    style,
				CurrentAction:   fmt.Sprintf("Fetching Amazon bestsellers for \"%s\" via Apify...", style),
				TotalCovers:     totalEstimated,
				ProcessedCovers: result.TotalProcessed,
				InsertedCovers:  result.TotalInserted,
				ErrorCount:      len(result.Errors),
				PercentComplete: percent(result.TotalProcessed, totalEstimated),
			})

			covers, err := source.FetchTopCovers(ctx, style, opts.LimitPerStyle)
			if err != nil {
				errMsg := fmt.Sprintf("source %s failed for style %s: %v", source.Name(), style, err)
				result.Errors = append(result.Errors, errMsg)
				log.Println("scraper error:", errMsg)
				continue
			}

			result.TotalFetched += len(covers)
			// Refine total now that we know the actual fetched count
			totalEstimated = totalEstimated - opts.LimitPerStyle + len(covers)

			for i, c := range covers {
				if ctx.Err() != nil {
					return result, ctx.Err()
				}

				progressFn(ScrapeProgress{
					CurrentStyle:    style,
					CurrentAction:   fmt.Sprintf("Processing cover %d of %d for \"%s\"...", i+1, len(covers), style),
					TotalCovers:     totalEstimated,
					ProcessedCovers: result.TotalProcessed,
					InsertedCovers:  result.TotalInserted,
					ErrorCount:      len(result.Errors),
					PercentComplete: percent(result.TotalProcessed, totalEstimated),
				})

				bm, err := processSingleCover(ctx, c, style, opts.TempDir, aiClient, opts.HTTPTimeout, r)
				if err != nil {
					errMsg := fmt.Sprintf("failed processing cover %s (%s): %v", c.Title, style, err)
					result.Errors = append(result.Errors, errMsg)
					log.Println("scraper error:", errMsg)
					continue
				}

				result.TotalProcessed++

				if database != nil {
					if err := db.InsertBenchmark(database, bm); err != nil {
						errMsg := fmt.Sprintf("failed inserting benchmark for cover %s: %v", c.Title, err)
						result.Errors = append(result.Errors, errMsg)
						log.Println("scraper error:", errMsg)
						continue

					}
					result.TotalInserted++
				}

				result.ByStyle[style]++
			}
		}
	}

	result.CompletedAt = time.Now()
	result.DurationSeconds = result.CompletedAt.Sub(result.StartedAt).Seconds()
	return result, nil
}

func processSingleCover(ctx context.Context, c BestsellerCover, targetStyle, tempDir string, aiClient *ai.Client, timeout time.Duration, r *rand.Rand) (*models.Benchmark, error) {
	tempPath := filepath.Join(tempDir, fmt.Sprintf("%s_%s.jpg", uuid.New().String(), sanitizeFilename(c.Title)))
	defer func() { _ = os.Remove(tempPath) }()

	imgBytes := c.ImageData
	if len(imgBytes) == 0 && c.ImageURL != "" {
		fetched, err := fetchImageURL(ctx, c.ImageURL, timeout)
		if err != nil {
			return nil, fmt.Errorf("fetching cover image URL %s: %w", c.ImageURL, err)
		}
		imgBytes = fetched
	}

	if len(imgBytes) == 0 {
		return nil, fmt.Errorf("no image data provided for cover %s", c.Title)
	}

	if err := os.WriteFile(tempPath, imgBytes, 0o644); err != nil {
		return nil, fmt.Errorf("writing temp image file: %w", err)
	}

	img, _, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return nil, fmt.Errorf("decoding cover image: %w", err)
	}

	imgWidth := img.Bounds().Dx()
	imgHeight := img.Bounds().Dy()

	var (
		titleHeightPercent float64
		contrastRatio      float64
		whitespacePercent  float64
	)

	// Attempt Tesseract OCR extraction
	words, ocrErr := ocr.ExtractText(tempPath)
	if ocrErr == nil && len(words) > 0 {
		titleRes, err := measure.DetectTitle(words, imgHeight)
		if err == nil {
			titleHeightPercent = titleRes.HeightPercent
			if cr, err := measure.ContrastRatio(img, titleRes.Box); err == nil {
				contrastRatio = cr
			}
		}
		whitespacePercent = measure.WhitespacePercent(words, imgWidth, imgHeight)
	}

	// Reject cover entirely if OCR cannot measure it reliably (strict zero-fallback policy)
	if titleHeightPercent == 0 || contrastRatio == 0 || whitespacePercent == 0 {
		return nil, fmt.Errorf("OCR or measurements failed (title: %.2f, contrast: %.2f, whitespace: %.2f) - discarding cover", titleHeightPercent, contrastRatio, whitespacePercent)
	}

	// AI classification touchpoint: classify style if AI client is enabled
	detectedStyle := targetStyle
	if aiClient != nil && aiClient.Enabled() {
		if classified, err := aiClient.ClassifyStyle(tempPath); err == nil && classified != "" {
			detectedStyle = classified
		}
	}

	return &models.Benchmark{
		ID:                 uuid.New().String(),
		Style:              detectedStyle,
		TitleHeightPercent: roundToDecimal(titleHeightPercent, 2),
		ContrastRatio:      roundToDecimal(contrastRatio, 2),
		WhitespacePercent:  roundToDecimal(whitespacePercent, 2),
		Title:              &c.Title,
		Author:             &c.Author,
		Category:           &c.Category,
		ImageURL:           &c.ImageURL,
		CreatedAt:          time.Now(),
	}, nil
}

func fetchImageURL(ctx context.Context, url string, timeout time.Duration) ([]byte, error) {
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	client := &http.Client{Timeout: timeout}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "CoverDoctorScraper/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}



func sanitizeFilename(name string) string {
	var out []rune
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			out = append(out, r)
		} else {
			out = append(out, '_')
		}
	}
	if len(out) > 20 {
		out = out[:20]
	}
	return string(out)
}

func roundToDecimal(val float64, decimals int) float64 {
	var mult float64 = 1
	for i := 0; i < decimals; i++ {
		mult *= 10
	}
	return float64(int(val*mult+0.5)) / mult
}

// percent returns processed/total as an integer 0–100.
func percent(processed, total int) int {
	if total <= 0 {
		return 0
	}
	p := (processed * 100) / total
	if p > 100 {
		return 100
	}
	return p
}


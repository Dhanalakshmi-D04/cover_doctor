package scraper

import (
	"context"
	"time"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// BestsellerCover represents metadata and raw image data for a bestseller book cover.
type BestsellerCover struct {
	ID          string
	Title       string
	Author      string
	Style       string // "Bold Typography", "Dark Photographic", "Illustrated", "Minimalist"
	Category    string // "Fiction", "Non-Fiction", "Sci-Fi", "Romance", etc.
	ImageURL    string
	ImageData   []byte // Optional pre-fetched image bytes
	Filename    string
}

// ScrapeResult summarizes the results of a scraper execution run.
type ScrapeResult struct {
	StartedAt      time.Time         `json:"started_at"`
	CompletedAt    time.Time         `json:"completed_at"`
	DurationSeconds float64          `json:"duration_seconds"`
	TotalFetched   int               `json:"total_fetched"`
	TotalProcessed int               `json:"total_processed"`
	TotalInserted  int               `json:"total_inserted"`
	ByStyle        map[string]int    `json:"by_style"`
	Errors         []string          `json:"errors"`
}

// BestsellerSource defines an interface for fetching bestseller cover candidates.
type BestsellerSource interface {
	Name() string
	FetchTopCovers(ctx context.Context, style string, limit int) ([]BestsellerCover, error)
}

// Options configures scraper execution parameters.
type Options struct {
	Styles           []string      // Visual styles to fetch and process
	LimitPerStyle    int           // Target sample count per visual style (default 15–20)
	TempDir          string        // Directory for temporary image processing
	OverwriteData    bool          // If true, clears existing benchmarks table before inserting
	HTTPTimeout      time.Duration // Timeout for HTTP cover image downloads
}

// DefaultOptions returns recommended default settings for quarterly scraping runs.
func DefaultOptions() Options {
	return Options{
		Styles: []string{
			"Bold Typography",
			"Dark Photographic",
			"Illustrated",
			"Minimalist",
		},
		LimitPerStyle: 15,
		TempDir:       "uploads/scraper_temp",
		OverwriteData: false,
		HTTPTimeout:   15 * time.Second,
	}
}

// SchedulerStatus reports current status of the background scraper job.
type SchedulerStatus struct {
	Enabled       bool          `json:"enabled"`
	IsRunning     bool          `json:"is_running"`
	IntervalDays  int           `json:"interval_days"`
	LastRunTime   *time.Time    `json:"last_run_time,omitempty"`
	NextRunTime   *time.Time    `json:"next_run_time,omitempty"`
	LastResult    *ScrapeResult `json:"last_result,omitempty"`
	TotalInDB     int           `json:"total_in_db"`
}

// BenchmarkFromCover converts processed cover measurements into a DB Benchmark model.
func BenchmarkFromCover(id, style string, titleHeightPercent, contrastRatio, whitespacePercent float64) *models.Benchmark {
	return &models.Benchmark{
		ID:                 id,
		Style:              style,
		TitleHeightPercent: titleHeightPercent,
		ContrastRatio:      contrastRatio,
		WhitespacePercent:  whitespacePercent,
		CreatedAt:          time.Now(),
	}
}

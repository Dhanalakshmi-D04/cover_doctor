package scraper

import (
	"context"
	"time"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
)

// BestsellerCover represents metadata and raw image data for a bestseller book cover.
type BestsellerCover struct {
	ID        string
	Title     string
	Author    string
	Style     string // "Bold Typography", "Dark Photographic", "Illustrated", "Minimalist"
	Category  string // "Fiction", "Non-Fiction", "Sci-Fi", "Romance", etc.
	ImageURL  string
	ImageData []byte // Optional pre-fetched image bytes
	Filename  string
}

// ScrapeProgress holds the live state of a running scraper job.
// It is updated in real-time as the pipeline progresses so the admin UI
// can display an accurate progress bar and status message.
type ScrapeProgress struct {
	CurrentStyle     string `json:"current_style"`      // e.g. "Minimalist"
	CurrentAction    string `json:"current_action"`     // e.g. "Fetching Amazon data via Apify..."
	TotalCovers      int    `json:"total_covers"`       // total covers found across all styles
	ProcessedCovers  int    `json:"processed_covers"`   // how many have completed OCR/AI/DB
	InsertedCovers   int    `json:"inserted_covers"`    // how many were successfully saved to DB
	ErrorCount       int    `json:"error_count"`        // failures so far
	PercentComplete  int    `json:"percent_complete"`   // 0–100
}


// ScrapeResult summarizes the results of a scraper execution run.
type ScrapeResult struct {
	StartedAt       time.Time      `json:"started_at"`
	CompletedAt     time.Time      `json:"completed_at"`
	DurationSeconds float64        `json:"duration_seconds"`
	TotalFetched    int            `json:"total_fetched"`
	TotalProcessed  int            `json:"total_processed"`
	TotalInserted   int            `json:"total_inserted"`
	ByStyle         map[string]int `json:"by_style"`
	Errors          []string       `json:"errors"`
}

// BestsellerSource defines an interface for fetching bestseller cover candidates.
type BestsellerSource interface {
	Name() string
	FetchTopCovers(ctx context.Context, style string, limit int) ([]BestsellerCover, error)
}

// Options configures scraper execution parameters.
type Options struct {
	Styles        []string      // Visual styles to fetch and process
	LimitPerStyle int           // Target sample count per visual style (default 15–20)
	TempDir       string        // Directory for temporary image processing
	OverwriteData bool          // If true, clears existing benchmarks table before inserting
	HTTPTimeout   time.Duration // Timeout for HTTP cover image downloads
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
	Enabled      bool            `json:"enabled"`
	IsRunning    bool            `json:"is_running"`
	IntervalDays int             `json:"interval_days"`
	LastRunTime  *time.Time      `json:"last_run_time,omitempty"`
	NextRunTime  *time.Time      `json:"next_run_time,omitempty"`
	LastResult   *ScrapeResult   `json:"last_result,omitempty"`
	TotalInDB    int             `json:"total_in_db"`
	Progress     *ScrapeProgress `json:"progress,omitempty"` // non-nil only while running
}

// BenchmarkFromCover converts processed cover measurements into a DB Benchmark model.
func BenchmarkFromCover(c BestsellerCover, titleHeightPercent, contrastRatio, whitespacePercent float64) *models.Benchmark {
	return &models.Benchmark{
		ID:                 c.ID,
		Style:              c.Style,
		TitleHeightPercent: titleHeightPercent,
		ContrastRatio:      contrastRatio,
		WhitespacePercent:  whitespacePercent,
		Title:              &c.Title,
		Author:             &c.Author,
		Category:           &c.Category,
		ImageURL:           &c.ImageURL,
		CreatedAt:          time.Now(),
	}
}

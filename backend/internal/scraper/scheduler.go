package scraper

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
)

// SchedulerOptions configures background periodic scraper execution.
type SchedulerOptions struct {
	Enabled      bool    `json:"enabled"`
	IntervalDays int     `json:"interval_days"` // e.g. 90 for quarterly runs
	RunOnStartup bool    `json:"run_on_startup"`
	ScraperOpts  Options `json:"scraper_opts"`
	Sources      []BestsellerSource
}

// DefaultSchedulerOptions returns recommended settings for quarterly scraping.
func DefaultSchedulerOptions() SchedulerOptions {
	return SchedulerOptions{
		Enabled:      true,
		IntervalDays: 90, // Quarterly (approx 90 days)
		RunOnStartup: false,
		ScraperOpts:  DefaultOptions(),
		Sources: []BestsellerSource{
			NewAmazonSource(15 * time.Second),
			NewSampleSource(),
		},
	}
}

// Scheduler handles periodic background automated benchmark scraping.
type Scheduler struct {
	database *sqlx.DB
	aiClient *ai.Client
	opts     SchedulerOptions

	mu          sync.RWMutex
	isRunning   bool
	lastRunTime *time.Time
	nextRunTime *time.Time
	lastResult  *ScrapeResult
	stopCh      chan struct{}
}

// NewScheduler creates a new quarterly scraper scheduler instance.
func NewScheduler(database *sqlx.DB, aiClient *ai.Client, opts SchedulerOptions) *Scheduler {
	if opts.IntervalDays <= 0 {
		opts.IntervalDays = 90
	}
	if len(opts.Sources) == 0 {
		opts.Sources = []BestsellerSource{
			NewAmazonSource(15 * time.Second),
			NewSampleSource(),
		}
	}
	return &Scheduler{
		database: database,
		aiClient: aiClient,
		opts:     opts,
		stopCh:   make(chan struct{}),
	}
}

// Start launches the background ticker goroutine.
func (s *Scheduler) Start() {
	s.mu.Lock()
	if !s.opts.Enabled {
		s.mu.Unlock()
		log.Println("automated quarterly scraper scheduler is disabled")
		return
	}

	interval := time.Duration(s.opts.IntervalDays) * 24 * time.Hour
	next := time.Now().Add(interval)
	s.nextRunTime = &next
	s.mu.Unlock()

	log.Printf("automated quarterly scraper scheduled every %d days (next run: %s)", s.opts.IntervalDays, next.Format(time.RFC3339))

	go s.loop(interval)

	if s.opts.RunOnStartup {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
			defer cancel()
			if _, err := s.TriggerNow(ctx); err != nil {
				log.Printf("startup scraper run failed: %v", err)
			}
		}()
	}
}

func (s *Scheduler) loop(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			return
		case <-ticker.C:
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
			if _, err := s.TriggerNow(ctx); err != nil {
				log.Printf("scheduled quarterly scraper run failed: %v", err)
			}
			cancel()

			s.mu.Lock()
			next := time.Now().Add(interval)
			s.nextRunTime = &next
			s.mu.Unlock()
		}
	}
}

// Stop gracefully stops the background scheduler.
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	select {
	case <-s.stopCh:
		// already closed
	default:
		close(s.stopCh)
	}
}

// TriggerNow executes a scrape job immediately. It is thread-safe and prevents concurrent execution.
func (s *Scheduler) TriggerNow(ctx context.Context) (*ScrapeResult, error) {
	s.mu.Lock()
	if s.isRunning {
		s.mu.Unlock()
		return nil, fmt.Errorf("scraper job is already running")
	}
	s.isRunning = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		s.isRunning = false
		s.mu.Unlock()
	}()

	log.Println("starting automated benchmark scraper job...")
	result, err := ScrapeAndSave(ctx, s.database, s.aiClient, s.opts.Sources, s.opts.ScraperOpts)
	if err != nil {
		return nil, fmt.Errorf("scrape execution failed: %w", err)
	}

	now := time.Now()
	s.mu.Lock()
	s.lastRunTime = &now
	s.lastResult = result
	s.mu.Unlock()

	log.Printf("automated benchmark scraper completed successfully in %.2fs (inserted %d benchmarks)", result.DurationSeconds, result.TotalInserted)
	return result, nil
}

// Status returns current status information for the scraper.
func (s *Scheduler) Status(ctx context.Context) SchedulerStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()

	totalInDB := 0
	if s.database != nil {
		if count, err := db.CountBenchmarks(s.database); err == nil {
			totalInDB = count
		}
	}

	return SchedulerStatus{
		Enabled:      s.opts.Enabled,
		IsRunning:    s.isRunning,
		IntervalDays: s.opts.IntervalDays,
		LastRunTime:  s.lastRunTime,
		NextRunTime:  s.nextRunTime,
		LastResult:   s.lastResult,
		TotalInDB:    totalInDB,
	}
}

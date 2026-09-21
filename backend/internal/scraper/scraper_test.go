package scraper

import (
	"context"
	"testing"
	"time"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
)

func TestSampleSource_FetchTopCovers(t *testing.T) {
	src := NewSampleSource()
	if src.Name() != "SampleSource" {
		t.Errorf("expected name SampleSource, got %s", src.Name())
	}

	ctx := context.Background()
	styles := []string{"Bold Typography", "Dark Photographic", "Illustrated", "Minimalist"}

	for _, style := range styles {
		covers, err := src.FetchTopCovers(ctx, style, 3)
		if err != nil {
			t.Fatalf("failed to fetch top covers for style %s: %v", style, err)
		}
		if len(covers) != 3 {
			t.Errorf("expected 3 covers, got %d", len(covers))
		}

		for _, c := range covers {
			if c.Style != style {
				t.Errorf("expected cover style %s, got %s", style, c.Style)
			}
			if len(c.ImageData) == 0 {
				t.Errorf("expected non-empty ImageData for cover %s", c.Title)
			}
		}
	}
}

func TestScrapeAndSave_OfflinePipeline(t *testing.T) {
	// SampleSource generates solid-colour JPEG images with no renderable text.
	// Since we removed the synthetic fallback generator, Tesseract will return 0
	// words for these images and the strict OCR gate will discard all of them.
	// This test verifies:
	//   (a) the pipeline fetches the expected number of covers from the source, and
	//   (b) covers that fail OCR are logged as errors but do NOT produce benchmark rows.
	tempDir := t.TempDir()
	opts := Options{
		Styles:        []string{"Bold Typography", "Minimalist"},
		LimitPerStyle: 2,
		TempDir:       tempDir,
		OverwriteData: false,
		HTTPTimeout:   5 * time.Second,
	}

	sources := []BestsellerSource{NewSampleSource()}
	aiClient := ai.NewClient("") // deterministic fallback client

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := ScrapeAndSave(ctx, nil, aiClient, sources, opts, nil)
	if err != nil {
		t.Fatalf("ScrapeAndSave failed: %v", err)
	}

	// 4 images fetched (2 styles × 2 each), none make it past OCR.
	if result.TotalFetched != 4 {
		t.Errorf("expected TotalFetched=4, got %d", result.TotalFetched)
	}
	// No fake data inserted — all 4 should be discarded as OCR failures.
	if result.TotalProcessed != 0 {
		t.Errorf("expected TotalProcessed=0 (no OCR success on synthetic images), got %d", result.TotalProcessed)
	}
	if result.TotalInserted != 0 {
		t.Errorf("expected TotalInserted=0, got %d", result.TotalInserted)
	}
	// All 4 cover failures should be recorded in the error list.
	if len(result.Errors) != 4 {
		t.Errorf("expected 4 OCR-discard errors, got %d: %v", len(result.Errors), result.Errors)
	}
}


func TestScheduler_LifecycleAndTrigger(t *testing.T) {
	tempDir := t.TempDir()
	opts := DefaultSchedulerOptions()
	opts.Enabled = true
	opts.IntervalDays = 90
	opts.RunOnStartup = false
	opts.ScraperOpts.TempDir = tempDir
	opts.ScraperOpts.LimitPerStyle = 1
	opts.ScraperOpts.Styles = []string{"Bold Typography"}
	opts.Sources = []BestsellerSource{NewSampleSource()}

	aiClient := ai.NewClient("")
	sched := NewScheduler(nil, aiClient, opts)

	status := sched.Status(context.Background())
	if status.IsRunning {
		t.Error("expected scheduler not running initially")
	}

	sched.Start()
	defer sched.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := sched.TriggerNow(ctx)
	if err != nil {
		t.Fatalf("TriggerNow failed: %v", err)
	}

	// SampleSource covers cannot be OCR'd (no rendered text); the pipeline
	// discards them. Verify the scheduler ran and produced 0 processed covers
	// rather than silently inserting fake benchmark data.
	if res.TotalProcessed != 0 {
		t.Errorf("expected 0 processed covers (solid-colour synthetic images fail OCR gate), got %d", res.TotalProcessed)
	}

	statusAfter := sched.Status(context.Background())
	if statusAfter.LastRunTime == nil {
		t.Error("expected LastRunTime to be populated after run")
	}
	if statusAfter.LastResult == nil {
		t.Error("expected LastResult to be populated after run")
	}
}

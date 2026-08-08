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

	result, err := ScrapeAndSave(ctx, nil, aiClient, sources, opts)
	if err != nil {
		t.Fatalf("ScrapeAndSave failed: %v", err)
	}

	if result.TotalFetched != 4 {
		t.Errorf("expected TotalFetched=4, got %d", result.TotalFetched)
	}
	if result.TotalProcessed != 4 {
		t.Errorf("expected TotalProcessed=4, got %d", result.TotalProcessed)
	}
	if result.ByStyle["Bold Typography"] != 2 {
		t.Errorf("expected 2 Bold Typography covers, got %d", result.ByStyle["Bold Typography"])
	}
	if result.ByStyle["Minimalist"] != 2 {
		t.Errorf("expected 2 Minimalist covers, got %d", result.ByStyle["Minimalist"])
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

	if res.TotalProcessed != 1 {
		t.Errorf("expected 1 processed cover, got %d", res.TotalProcessed)
	}

	statusAfter := sched.Status(context.Background())
	if statusAfter.LastRunTime == nil {
		t.Error("expected LastRunTime to be populated after run")
	}
	if statusAfter.LastResult == nil {
		t.Error("expected LastResult to be populated after run")
	}
}

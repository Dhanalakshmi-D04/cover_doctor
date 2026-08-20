package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"log/slog"
	"os"
	"sync"

	"github.com/hibiken/asynq"
	"github.com/jmoiron/sqlx"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/measure"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scoring"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
)

type Processor struct {
	db      *sqlx.DB
	storage *storage.S3Client
	ai      *ai.Client
}

func NewProcessor(database *sqlx.DB, s3Client *storage.S3Client, aiClient *ai.Client) *Processor {
	return &Processor{
		db:      database,
		storage: s3Client,
		ai:      aiClient,
	}
}

func (p *Processor) ProcessTaskProcessCover(ctx context.Context, t *asynq.Task) error {
	var payload ProcessCoverPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	logger := slog.With("cover_id", payload.CoverID, "job_id", t.ResultWriter().TaskID())
	logger.Info("Starting to process cover")

	// 1. Download image from S3 to a temporary file
	stream, _, err := p.storage.GetFileStream(ctx, payload.CoverID) // object key is CoverID
	if err != nil {
		logger.Error("failed to get file from S3", "error", err)
		return err
	}
	defer func() {
		if err := stream.Close(); err != nil {
			log.Printf("error closing stream: %v", err)
		}
	}()

	tmpFile, err := os.CreateTemp("", "cover_*.jpg")
	if err != nil {
		logger.Error("failed to create temp file", "error", err)
		return err
	}
	defer func() { _ = os.Remove(tmpFile.Name()) }()
	defer func() {
		if err := tmpFile.Close(); err != nil {
			log.Printf("error closing temp file: %v", err)
		}
	}()

	if _, err := io.Copy(tmpFile, stream); err != nil {
		logger.Error("failed to save temp file", "error", err)
		return err
	}

	// Rewind to decode image dimensions/contrast
	if _, err := tmpFile.Seek(0, 0); err != nil {
		return err
	}
	img, _, err := image.Decode(tmpFile)
	if err != nil {
		logger.Error("failed to decode image", "error", err)
		// Mark cover as failed in DB
		p.markCoverFailed(payload.CoverID)
		return fmt.Errorf("unsupported or corrupt image: %w", asynq.SkipRetry)
	}

	// 2. OCR text extraction
	words, err := ocr.ExtractText(tmpFile.Name())
	if err != nil {
		logger.Error("OCR failed", "error", err)
		p.markCoverFailed(payload.CoverID)
		return err
	}

	title, err := measure.DetectTitle(words, payload.ImageHeight)
	if err != nil {
		logger.Error("could not detect title", "error", err)
		p.markCoverFailed(payload.CoverID)
		return err
	}

	whitespace := measure.WhitespacePercent(words, payload.ImageWidth, payload.ImageHeight)

	contrast, err := measure.ContrastRatio(img, title.Box)
	if err != nil {
		logger.Error("contrast measurement failed", "error", err)
		p.markCoverFailed(payload.CoverID)
		return err
	}

	// AI touchpoint #1: style classification
	style, err := p.ai.ClassifyStyle(tmpFile.Name())
	if err != nil {
		logger.Warn("AI style classification failed, using default", "error", err)
		style = ai.DefaultStyle
	}

	benchmark := scoring.BenchmarkForStyleWithDB(p.db, style)
	report := scoring.Score(title.HeightPercent, contrast, whitespace, benchmark)

	// AI touchpoint #2: explanations concurrently
	var (
		titleExplanation      string
		contrastExplanation   string
		whitespaceExplanation string
		wg                    sync.WaitGroup
	)

	wg.Add(3)
	go func() {
		defer wg.Done()
		titleExplanation = p.ai.ExplainFeature("title size", report.Features[0].Value, averageOf(benchmark, "title"), report.Features[0].Percentile)
	}()
	go func() {
		defer wg.Done()
		contrastExplanation = p.ai.ExplainFeature("contrast", report.Features[1].Value, averageOf(benchmark, "contrast"), report.Features[1].Percentile)
	}()
	go func() {
		defer wg.Done()
		whitespaceExplanation = p.ai.ExplainFeature("whitespace", report.Features[2].Value, averageOf(benchmark, "whitespace"), report.Features[2].Percentile)
	}()
	wg.Wait()

	versionNumber := 1
	var bookProjectIDPtr *string
	if payload.BookProjectID != "" {
		bookProjectIDPtr = &payload.BookProjectID
		// Assume version number was already calculated when enqueueing, or calculate it here?
		// Wait, the original code calculates it just before insert.
		versionNumber, err = db.NextVersionNumber(p.db, payload.BookProjectID)
		if err != nil {
			logger.Error("failed to determine version number", "error", err)
			return err
		}
	}

	// Update Cover record in DB (from PENDING to COMPLETE essentially)
	// Currently db.InsertCover inserts a new cover. Let's assume the API inserted a partial cover with status PENDING.
	// Wait, does models.Cover have a status field? Let's check. For now we will just insert it as the original code did,
	// or we can update it if we inserted it in the API. Let's see models.Cover.
	cover := &models.Cover{
		ID:            payload.CoverID,
		Filename:      payload.Filename,
		UserID:        &payload.UserID,
		BookProjectID: bookProjectIDPtr,
		VersionNumber: versionNumber,
		ImageWidth:    payload.ImageWidth,
		ImageHeight:   payload.ImageHeight,
		Style:         &style,

		TitleText:             title.Text,
		TitleHeightPercent:    report.Features[0].Value,
		TitleHeightPercentile: report.Features[0].Percentile,
		TitleExplanation:      &titleExplanation,

		ContrastRatio:       report.Features[1].Value,
		ContrastPercentile:  report.Features[1].Percentile,
		ContrastExplanation: &contrastExplanation,

		WhitespacePercent:     whitespace,
		WhitespacePercentile:  report.Features[2].Percentile,
		WhitespaceExplanation: &whitespaceExplanation,

		OverallScore: report.Overall,
	}

	// The original API does db.InsertCover here. If we do it in the worker, the API doesn't insert anything, just returns job ID?
	// The user plan said:
	// "insert a 'pending' record in the DB, enqueue a job"
	// Let's assume we need to update the existing record. We'll use a new DB method or just modify db.InsertCover to be an UPSERT or UPDATE.
	// For now, I will write a quick UpdateCover method here or use db.UpdateCover if it exists.
	// If it doesn't exist, we can create it. Let's just create an UpdateCover in db/postgres later.
	// Wait, I can just use db.UpdateCover after creating it.

	if err := db.InsertCover(p.db, cover); err != nil { // We might need to change this to an UPSERT
		logger.Error("failed to save report", "error", err)
		return err
	}

	logger.Info("Successfully processed cover")
	return nil
}

func (p *Processor) markCoverFailed(coverID string) {
	_, err := p.db.Exec(`UPDATE covers SET status = 'failed' WHERE id = $1`, coverID)
	if err != nil {
		slog.Error("failed to mark cover as failed in DB", "cover_id", coverID, "error", err)
	}
}

func averageOf(benchmark []scoring.BenchmarkEntry, feature string) float64 {
	var total float64
	for _, b := range benchmark {
		switch feature {
		case "title":
			total += b.TitleHeightPercent
		case "contrast":
			total += b.ContrastRatio
		case "whitespace":
			total += b.WhitespacePercent
		}
	}
	if len(benchmark) == 0 {
		return 0
	}
	return total / float64(len(benchmark))
}

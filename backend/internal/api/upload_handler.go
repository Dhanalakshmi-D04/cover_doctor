package api

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/measure"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scoring"
)

// Upload handles POST /upload: accepts a cover image, runs the full
// ocr -> measure -> scoring pipeline (see docs/03-project-architecture.md),
// stores the resulting report, and returns its cover_id.
//
// Every user gets the same fully-computed report today — tier-based
// redaction (docs/05-pricing-and-plans.md) is a future step in the `api`
// layer, not something this handler or the scoring math itself decides.
func (h *Handler) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing 'cover' file field"})
		return
	}

	coverID := uuid.New().String()
	ext := filepath.Ext(fileHeader.Filename)
	savedPath := filepath.Join(h.UploadDir, coverID+ext)

	if err := c.SaveUploadedFile(fileHeader, savedPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save uploaded file"})
		return
	}

	words, err := ocr.ExtractText(savedPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("OCR failed: %v", err)})
		return
	}

	imgFile, err := os.Open(savedPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reopen uploaded file"})
		return
	}
	defer imgFile.Close()

	img, _, err := image.Decode(imgFile)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported or corrupt image"})
		return
	}
	imgWidth := img.Bounds().Dx()
	imgHeight := img.Bounds().Dy()

	title, err := measure.DetectTitle(words, imgHeight)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": fmt.Sprintf("could not detect title text: %v", err)})
		return
	}

	whitespace := measure.WhitespacePercent(words, imgWidth, imgHeight)

	contrast, err := measure.ContrastRatio(img, title.Box)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("contrast measurement failed: %v", err)})
		return
	}

	report := scoring.Score(title.HeightPercent, contrast, whitespace, scoring.SampleBenchmark)

	cover := &models.Cover{
		ID:                    coverID,
		Filename:              fileHeader.Filename,
		ImageWidth:            imgWidth,
		ImageHeight:           imgHeight,
		TitleText:             title.Text,
		TitleHeightPercent:    report.Features[0].Value,
		TitleHeightPercentile: report.Features[0].Percentile,
		ContrastRatio:         report.Features[1].Value,
		ContrastPercentile:    report.Features[1].Percentile,
		WhitespacePercent:     report.Features[2].Value,
		WhitespacePercentile:  report.Features[2].Percentile,
		OverallScore:          report.Overall,
	}

	if err := db.InsertCover(h.DB, cover); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to save report: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cover_id": coverID})
}

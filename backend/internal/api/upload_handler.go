package api

import (
	"database/sql"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/measure"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scoring"
)

// Upload handles POST /upload: accepts a cover image, runs the full
// image validation -> measure -> style-tag -> scoring -> explain pipeline,
// stores the resulting report, and returns its cover_id.
func (h *Handler) Upload(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)

	fileHeader, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing 'cover' file field"})
		return
	}

	// 1. File size validation (10MB maximum)
	const maxFileSize = 10 * 1024 * 1024
	if fileHeader.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file size exceeds 10MB limit"})
		return
	}

	// 2. File type validation
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image format; only JPG, PNG, and WebP are allowed"})
		return
	}

	bookProjectID := c.PostForm("book_project_id") // optional: attaches this upload as a new version
	var bookProjectIDPtr *string

	// 3. IDOR check: verify book project ownership before processing upload
	if bookProjectID != "" {
		project, err := db.GetBookProjectByID(h.DB, bookProjectID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{"error": "book project not found"})
				return
			}
			log.Printf("failed to fetch book project %s: %v", bookProjectID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify book project"})
			return
		}
		if project.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not your book project"})
			return
		}
		bookProjectIDPtr = &bookProjectID
	}

	coverID := uuid.New().String()
	savedPath := filepath.Join(h.UploadDir, coverID+ext)

	if err := c.SaveUploadedFile(fileHeader, savedPath); err != nil {
		log.Printf("failed to save uploaded file %s: %v", savedPath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save uploaded file"})
		return
	}

	// Clean up file if any subsequent processing step fails
	var success bool
	defer func() {
		if !success {
			os.Remove(savedPath)
		}
	}()

	// 4. Validate image format & decode dimensions BEFORE running OCR
	imgFile, err := os.Open(savedPath)
	if err != nil {
		log.Printf("failed to open uploaded image file %s: %v", savedPath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process image file"})
		return
	}

	img, _, err := image.Decode(imgFile)
	imgFile.Close()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported or corrupt image"})
		return
	}
	imgWidth := img.Bounds().Dx()
	imgHeight := img.Bounds().Dy()

	// 5. OCR text extraction after image validation
	words, err := ocr.ExtractText(savedPath)
	if err != nil {
		log.Printf("OCR failed for %s: %v", savedPath, err)
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to extract text from cover image"})
		return
	}

	title, err := measure.DetectTitle(words, imgHeight)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "could not detect title text on cover"})
		return
	}

	whitespace := measure.WhitespacePercent(words, imgWidth, imgHeight)

	contrast, err := measure.ContrastRatio(img, title.Box)
	if err != nil {
		log.Printf("contrast measurement failed for %s: %v", savedPath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate cover contrast ratio"})
		return
	}

	// AI touchpoint #1: style classification (image -> fixed category).
	// Log warning on error and fall back to safe default.
	style, err := h.AI.ClassifyStyle(savedPath)
	if err != nil {
		log.Printf("warning: AI style classification failed: %v", err)
		style = ai.DefaultStyle
	}

	benchmark := scoring.BenchmarkForStyleWithDB(h.DB, style)
	report := scoring.Score(title.HeightPercent, contrast, whitespace, benchmark)

	// AI touchpoint #2: turning the already-finished numbers into prose.
	// Run explanation calls concurrently to prevent slow response times.
	var (
		titleExplanation      string
		contrastExplanation   string
		whitespaceExplanation string
		wg                    sync.WaitGroup
	)

	wg.Add(3)
	go func() {
		defer wg.Done()
		titleExplanation = h.AI.ExplainFeature("title size", report.Features[0].Value, averageOf(benchmark, "title"), report.Features[0].Percentile)
	}()
	go func() {
		defer wg.Done()
		contrastExplanation = h.AI.ExplainFeature("contrast", report.Features[1].Value, averageOf(benchmark, "contrast"), report.Features[1].Percentile)
	}()
	go func() {
		defer wg.Done()
		whitespaceExplanation = h.AI.ExplainFeature("whitespace", report.Features[2].Value, averageOf(benchmark, "whitespace"), report.Features[2].Percentile)
	}()
	wg.Wait()

	versionNumber := 1
	if bookProjectIDPtr != nil {
		versionNumber, err = db.NextVersionNumber(h.DB, *bookProjectIDPtr)
		if err != nil {
			log.Printf("failed to calculate next version number for project %s: %v", *bookProjectIDPtr, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to determine version number"})
			return
		}
	}

	cover := &models.Cover{
		ID:            coverID,
		Filename:      fileHeader.Filename,
		UserID:        &userID,
		BookProjectID: bookProjectIDPtr,
		VersionNumber: versionNumber,
		ImageWidth:    imgWidth,
		ImageHeight:   imgHeight,
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

	if err := db.InsertCover(h.DB, cover); err != nil {
		log.Printf("failed to save report to DB for %s: %v", coverID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save report"})
		return
	}

	success = true
	c.JSON(http.StatusOK, gin.H{"cover_id": coverID})
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

// topImprovements produces plain-text suggestions from whichever features
// scored lowest — used by GetReport for the free tier. Sorting ensures the
// weakest feature is always listed first.
func topImprovements(cover *models.Cover) []string {
	type feature struct {
		percentile float64
		text       string
	}

	features := []feature{
		{percentile: cover.TitleHeightPercentile, text: "Consider making your title larger — it's smaller than most covers in its style."},
		{percentile: cover.ContrastPercentile, text: "Consider increasing contrast between your title and background — it's lower than most covers in its style."},
		{percentile: cover.WhitespacePercentile, text: "Consider adjusting how much empty space your cover has compared to similar covers."},
	}

	sort.Slice(features, func(i, j int) bool {
		return features[i].percentile < features[j].percentile
	})

	improvements := make([]string, 0, len(features))
	for _, f := range features {
		improvements = append(improvements, f.text)
	}
	return improvements
}

// GetCoverImage handles GET /images/:filename: serves cover image file only if
// the requesting user owns the cover.
func (h *Handler) GetCoverImage(c *gin.Context) {
	userID := c.GetString(middleware.UserIDContextKey)
	filename := c.Param("filename")

	ext := filepath.Ext(filename)
	coverID := strings.TrimSuffix(filename, ext)

	cover, err := db.GetCoverByID(h.DB, coverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "image not found"})
		return
	}

	if cover.UserID == nil || *cover.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	filePath := filepath.Join(h.UploadDir, filepath.Base(filename))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "image file not found"})
		return
	}

	c.File(filePath)
}

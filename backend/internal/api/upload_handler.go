package api

import (
	"database/sql"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/middleware"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/models"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/worker"
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

	// 4. Validate image format & decode dimensions BEFORE uploading
	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open uploaded file"})
		return
	}
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("error closing file: %v", err)
		}
	}()

	sniffer := make([]byte, 512)
	n, err := f.Read(sniffer)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read uploaded file"})
		return
	}
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process uploaded file"})
		return
	}

	contentType := http.DetectContentType(sniffer[:n])
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image content type based on file signature"})
		return
	}

	// Read full decode config for dimensions
	imgConfig, format, err := image.DecodeConfig(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported or corrupt image"})
		return
	}
	imgWidth := imgConfig.Width
	imgHeight := imgConfig.Height

	// Reset file pointer
	if _, err := f.Seek(0, 0); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process uploaded file"})
		return
	}

	fileBytes, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file bytes"})
		return
	}

	contentType = "image/" + format
	switch format {
	case "jpeg":
		contentType = "image/jpeg"
	case "png":
		contentType = "image/png"
	}

	// 5. Upload to S3/MinIO
	if err := h.Storage.UploadFile(c.Request.Context(), coverID, contentType, fileBytes); err != nil {
		log.Printf("failed to upload file to S3: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save uploaded file"})
		return
	}

	versionNumber := 1
	if bookProjectIDPtr != nil {
		versionNumber, err = db.NextVersionNumber(h.DB, *bookProjectIDPtr)
		if err != nil {
			log.Printf("failed to calculate next version number for project %s: %v", *bookProjectIDPtr, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to determine version number"})
			return
		}
	}

	// 6. Insert "pending" record into the database
	jobID := uuid.New().String()
	cover := &models.Cover{
		ID:            coverID,
		Filename:      fileHeader.Filename,
		UserID:        &userID,
		BookProjectID: bookProjectIDPtr,
		VersionNumber: versionNumber,
		ImageWidth:    imgWidth,
		ImageHeight:   imgHeight,
		Status:        "pending",
		JobID:         &jobID,
	}

	if err := db.InsertCover(h.DB, cover); err != nil {
		log.Printf("failed to save report to DB for %s: %v", coverID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save report"})
		return
	}

	// 7. Enqueue background job
	task, err := worker.NewProcessCoverTask(worker.ProcessCoverPayload{
		CoverID:       coverID,
		Filename:      fileHeader.Filename,
		UserID:        userID,
		BookProjectID: bookProjectID,
		ImageWidth:    imgWidth,
		ImageHeight:   imgHeight,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create task"})
		return
	}

	info, err := h.TaskQueue.EnqueueContext(
		c.Request.Context(),
		task,
		asynq.TaskID(jobID),
		asynq.MaxRetry(3),
	)
	if err != nil {
		log.Printf("failed to enqueue task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue processing job"})
		return
	}

	// 8. Return 202 Accepted
	c.JSON(http.StatusAccepted, gin.H{"cover_id": coverID, "job_id": info.ID})
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

// GetCoverImage handles GET /images/:filename: serves cover image via
// a presigned S3 URL only if the requesting user owns the cover.
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

	url, err := h.Storage.GeneratePresignedURL(c.Request.Context(), coverID, 15*time.Minute)
	if err != nil {
		log.Printf("failed to generate presigned url for %s: %v", coverID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate image url"})
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GetJobStatus handles GET /jobs/:job_id to poll background processing status.
func (h *Handler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("job_id")

	cover, err := db.GetCoverByJobID(h.DB, jobID)
	if err != nil {
		// If the job_id doesn't exist in the DB, it's either invalid or hasn't committed yet.
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	// The frontend polls this endpoint until status is 'complete' or 'failed'.
	c.JSON(http.StatusOK, gin.H{
		"job_id":   jobID,
		"cover_id": cover.ID,
		"status":   cover.Status,
	})
}

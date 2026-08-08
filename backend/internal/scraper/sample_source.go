package scraper

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

// SampleSource provides synthetic baseline bestseller cover candidates for each
// visual style. It is ideal for offline testing, local seeding, and CI validation.
type SampleSource struct{}

// NewSampleSource returns a new instance of SampleSource.
func NewSampleSource() *SampleSource {
	return &SampleSource{}
}

func (s *SampleSource) Name() string {
	return "SampleSource"
}

// FetchTopCovers returns a set of generated cover candidates tailored to the requested style.
func (s *SampleSource) FetchTopCovers(ctx context.Context, style string, limit int) ([]BestsellerCover, error) {
	if limit <= 0 {
		limit = 10
	}

	covers := make([]BestsellerCover, 0, limit)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := 0; i < limit; i++ {
		imgBytes, err := generateSampleImage(style, i, r)
		if err != nil {
			return nil, fmt.Errorf("generating sample image for style %s: %w", style, err)
		}

		coverID := uuid.New().String()
		covers = append(covers, BestsellerCover{
			ID:        coverID,
			Title:     fmt.Sprintf("SAMPLE BESTSELLER %d", i+1),
			Author:    fmt.Sprintf("Author %d", i+1),
			Style:     style,
			Category:  styleToCategory(style),
			ImageData: imgBytes,
			Filename:  fmt.Sprintf("sample_%s_%d.jpg", style, i+1),
		})
	}

	return covers, nil
}

func styleToCategory(style string) string {
	switch style {
	case "Bold Typography":
		return "Non-Fiction"
	case "Dark Photographic":
		return "Thriller"
	case "Illustrated":
		return "Romance"
	case "Minimalist":
		return "Self-Help"
	default:
		return "General"
	}
}

// generateSampleImage creates a synthetic JPEG image matching characteristics of a visual style.
func generateSampleImage(style string, index int, r *rand.Rand) ([]byte, error) {
	width, height := 600, 900
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	var bgColor, textColor color.RGBA
	switch style {
	case "Bold Typography":
		// High contrast bold canvas (e.g. bright yellow / black)
		bgColor = color.RGBA{R: 245, G: 215, B: 65, A: 255}
		textColor = color.RGBA{R: 20, G: 20, B: 20, A: 255}
	case "Dark Photographic":
		// Dark mood canvas (dark grey / bright text)
		bgColor = color.RGBA{R: 25, G: 28, B: 36, A: 255}
		textColor = color.RGBA{R: 230, G: 235, B: 245, A: 255}
	case "Illustrated":
		// Soft colorful canvas (pastel blue / dark navy)
		bgColor = color.RGBA{R: 180, G: 215, B: 240, A: 255}
		textColor = color.RGBA{R: 30, G: 45, B: 80, A: 255}
	case "Minimalist":
		// Off-white canvas (stark dark grey text)
		bgColor = color.RGBA{R: 248, G: 248, B: 248, A: 255}
		textColor = color.RGBA{R: 40, G: 40, B: 40, A: 255}
	default:
		bgColor = color.RGBA{R: 200, G: 200, B: 200, A: 255}
		textColor = color.RGBA{R: 10, G: 10, B: 10, A: 255}
	}

	// Fill background
	draw.Draw(img, img.Bounds(), &image.Uniform{bgColor}, image.Point{}, draw.Src)

	// Draw simulated title box area with text color
	// Variation per index for statistical spread
	offsetY := (index % 5) * 15
	titleBox := image.Rect(100, 200+offsetY, 500, 350+offsetY)
	draw.Draw(img, titleBox, &image.Uniform{textColor}, image.Point{}, draw.Src)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// Command scoretest is a throwaway CLI for Milestone 1 validation: prove
// that ocr -> measure -> scoring produce a real score for a real image,
// before any API, database, or auth exists. See docs/06-getting-started.md.
package main

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"os"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/measure"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scoring"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("usage: scoretest <path-to-cover-image>")
		os.Exit(1)
	}
	imagePath := os.Args[1]

	words, err := ocr.ExtractText(imagePath)
	if err != nil {
		fmt.Println("OCR error:", err)
		os.Exit(1)
	}
	fmt.Printf("OCR found %d words\n", len(words))

	imgFile, err := os.Open(imagePath)
	if err != nil {
		fmt.Println("error opening image:", err)
		os.Exit(1)
	}
	defer func() { _ = imgFile.Close() }()

	img, _, err := image.Decode(imgFile)
	if err != nil {
		fmt.Println("error decoding image:", err)
		os.Exit(1)
	}
	imgWidth := img.Bounds().Dx()
	imgHeight := img.Bounds().Dy()
	fmt.Printf("Image size: %dx%d\n", imgWidth, imgHeight)

	title, err := measure.DetectTitle(words, imgHeight)
	if err != nil {
		fmt.Println("title detection error:", err)
		os.Exit(1)
	}
	fmt.Printf("Detected title: %q (height: %.2f%% of image)\n", title.Text, title.HeightPercent)

	whitespace := measure.WhitespacePercent(words, imgWidth, imgHeight)
	fmt.Printf("Whitespace: %.2f%%\n", whitespace)

	contrast, err := measure.ContrastRatio(img, title.Box)
	if err != nil {
		fmt.Println("contrast error:", err)
		os.Exit(1)
	}
	fmt.Printf("Contrast ratio (title vs. background): %.2f:1\n", contrast)

	report := scoring.Score(title.HeightPercent, contrast, whitespace, scoring.SampleBenchmark)
	fmt.Println("\n--- Score Report ---")
	for _, f := range report.Features {
		fmt.Printf("%-22s value=%.2f  percentile=%.0f\n", f.Feature, f.Value, f.Percentile)
	}
	fmt.Printf("Overall score (avg percentile): %.0f\n", report.Overall)
}

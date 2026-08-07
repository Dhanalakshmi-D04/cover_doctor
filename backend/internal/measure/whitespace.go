package measure

import "github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"

// WhitespacePercent estimates the percentage of the cover NOT covered by any
// detected text, as a simple proxy for visual "breathing room". It sums each
// word's bounding box area independently rather than computing a true
// union — a reasonable approximation since word boxes on a cover rarely
// overlap each other.
func WhitespacePercent(words []ocr.WordBox, imageWidthPx, imageHeightPx int) float64 {
	if imageWidthPx <= 0 || imageHeightPx <= 0 {
		return 0
	}

	var textArea float64
	for _, w := range words {
		textArea += float64(w.Width * w.Height)
	}

	totalArea := float64(imageWidthPx * imageHeightPx)
	coveredPercent := (textArea / totalArea) * 100
	if coveredPercent > 100 {
		coveredPercent = 100
	}

	return 100 - coveredPercent
}

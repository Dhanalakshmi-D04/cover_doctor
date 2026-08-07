package measure

import (
	"testing"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
)

func TestWhitespacePercent(t *testing.T) {
	words := []ocr.WordBox{
		{Left: 0, Top: 0, Width: 10, Height: 10}, // area 100
		{Left: 0, Top: 0, Width: 10, Height: 10}, // area 100
	}
	// image 100x100 = 10000 area, text area = 200 -> covered 2%, whitespace 98%
	got := WhitespacePercent(words, 100, 100)
	want := 98.0
	if got != want {
		t.Errorf("expected %.2f, got %.2f", want, got)
	}
}

func TestWhitespacePercent_NoWords(t *testing.T) {
	got := WhitespacePercent(nil, 100, 100)
	if got != 100 {
		t.Errorf("expected 100, got %.2f", got)
	}
}

func TestWhitespacePercent_InvalidDimensions(t *testing.T) {
	got := WhitespacePercent(nil, 0, 0)
	if got != 0 {
		t.Errorf("expected 0, got %.2f", got)
	}
}

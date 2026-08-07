package measure

import (
	"testing"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
)

func TestDetectTitle_PicksTallestLine(t *testing.T) {
	words := []ocr.WordBox{
		// Small subtitle line
		{BlockNum: 1, ParNum: 1, LineNum: 1, WordNum: 1, Left: 10, Top: 10, Width: 40, Height: 10, Confidence: 90, Text: "A"},
		{BlockNum: 1, ParNum: 1, LineNum: 1, WordNum: 2, Left: 55, Top: 10, Width: 40, Height: 10, Confidence: 90, Text: "Subtitle"},
		// Big title line
		{BlockNum: 1, ParNum: 2, LineNum: 1, WordNum: 1, Left: 10, Top: 50, Width: 80, Height: 60, Confidence: 95, Text: "BIG"},
		{BlockNum: 1, ParNum: 2, LineNum: 1, WordNum: 2, Left: 95, Top: 50, Width: 80, Height: 60, Confidence: 95, Text: "TITLE"},
		// Small author line
		{BlockNum: 1, ParNum: 3, LineNum: 1, WordNum: 1, Left: 10, Top: 300, Width: 60, Height: 8, Confidence: 90, Text: "Author"},
		{BlockNum: 1, ParNum: 3, LineNum: 1, WordNum: 2, Left: 75, Top: 300, Width: 40, Height: 8, Confidence: 90, Text: "Name"},
	}

	result, err := DetectTitle(words, 500)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Text != "BIG TITLE" {
		t.Errorf("expected title %q, got %q", "BIG TITLE", result.Text)
	}

	wantPercent := 60.0 / 500.0 * 100
	if result.HeightPercent != wantPercent {
		t.Errorf("expected height percent %.2f, got %.2f", wantPercent, result.HeightPercent)
	}
}

func TestDetectTitle_NoWords(t *testing.T) {
	_, err := DetectTitle(nil, 500)
	if err != ErrNoText {
		t.Errorf("expected ErrNoText, got %v", err)
	}
}

func TestDetectTitle_MergesMultiLineTitle(t *testing.T) {
	words := []ocr.WordBox{
		// Two lines of a wrapped title, same font size, close together
		{BlockNum: 1, ParNum: 1, LineNum: 1, WordNum: 1, Left: 20, Top: 100, Width: 150, Height: 15, Confidence: 92, Text: "ABANDONED"},
		{BlockNum: 1, ParNum: 1, LineNum: 2, WordNum: 1, Left: 40, Top: 120, Width: 100, Height: 15, Confidence: 96, Text: "KINGDOM"},
		// Small author line, far below
		{BlockNum: 1, ParNum: 2, LineNum: 1, WordNum: 1, Left: 30, Top: 300, Width: 80, Height: 8, Confidence: 90, Text: "AUTHOR"},
	}

	result, err := DetectTitle(words, 410)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Text != "ABANDONED KINGDOM" {
		t.Errorf("expected merged title %q, got %q", "ABANDONED KINGDOM", result.Text)
	}
}

func TestDetectTitle_InvalidImageHeight(t *testing.T) {
	words := []ocr.WordBox{
		{BlockNum: 1, ParNum: 1, LineNum: 1, WordNum: 1, Left: 0, Top: 0, Width: 10, Height: 10, Confidence: 90, Text: "X"},
	}
	if _, err := DetectTitle(words, 0); err == nil {
		t.Error("expected error for zero image height, got nil")
	}
}

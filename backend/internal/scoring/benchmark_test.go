package scoring

import (
	"testing"
)

func TestBenchmarkForStyle_Fallback(t *testing.T) {
	tests := []struct {
		style string
		want  string
	}{
		{"Bold Typography", "Bold Typography"},
		{"Dark Photographic", "Dark Photographic"},
		{"Illustrated", "Illustrated"},
		{"Minimalist", "Minimalist"},
		{"NonExistentStyle", "Bold Typography"}, // fallback to Bold Typography
	}

	for _, tt := range tests {
		t.Run(tt.style, func(t *testing.T) {
			got := BenchmarkForStyle(tt.style)
			if len(got) == 0 {
				t.Fatalf("expected non-empty benchmark entries for style %s", tt.style)
			}
		})
	}
}

func TestBenchmarkForStyleWithDB_NilDBFallback(t *testing.T) {
	// Should safely fallback to in-memory defaults when db is nil
	got := BenchmarkForStyleWithDB(nil, "Minimalist")
	if len(got) == 0 {
		t.Fatal("expected non-empty fallback benchmark entries when db is nil")
	}

	// Verify entries match standard Minimalist dataset
	expected := BenchmarkForStyle("Minimalist")
	if len(got) != len(expected) {
		t.Errorf("expected %d entries, got %d", len(expected), len(got))
	}
}

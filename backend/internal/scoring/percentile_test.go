package scoring

import "testing"

func TestPercentileRank(t *testing.T) {
	distribution := []float64{10, 20, 30, 40, 50}

	tests := []struct {
		value float64
		want  float64
	}{
		{value: 5, want: 0},
		{value: 10, want: 20},
		{value: 30, want: 60},
		{value: 50, want: 100},
		{value: 100, want: 100},
	}

	for _, tt := range tests {
		got := PercentileRank(tt.value, distribution)
		if got != tt.want {
			t.Errorf("PercentileRank(%.0f) = %.2f, want %.2f", tt.value, got, tt.want)
		}
	}
}

func TestPercentileRank_EmptyDistribution(t *testing.T) {
	got := PercentileRank(50, nil)
	if got != 0 {
		t.Errorf("expected 0, got %.2f", got)
	}
}

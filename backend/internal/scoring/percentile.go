package scoring

import "sort"

// PercentileRank returns the percentage of values in the distribution that
// are less than or equal to value. Pure arithmetic — no AI, no external
// stats library, matching the "AI never scores" principle in
// docs/00-overview.md.
func PercentileRank(value float64, distribution []float64) float64 {
	if len(distribution) == 0 {
		return 0
	}

	count := 0
	for _, v := range distribution {
		if v <= value {
			count++
		}
	}

	return (float64(count) / float64(len(distribution))) * 100
}

// SortedCopy returns a sorted copy of a distribution, useful for callers
// that want to display a distribution alongside its percentile.
func SortedCopy(distribution []float64) []float64 {
	cp := make([]float64, len(distribution))
	copy(cp, distribution)
	sort.Float64s(cp)
	return cp
}

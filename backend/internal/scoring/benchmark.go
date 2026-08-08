package scoring

// BenchmarkEntry represents one already-analyzed cover's measurements, used
// as a comparison point for percentile calculations.
type BenchmarkEntry struct {
	TitleHeightPercent float64
	ContrastRatio      float64
	WhitespacePercent  float64
}

// benchmarksByStyle holds a small hardcoded placeholder dataset per style
// category. Still temporary — it exists to prove per-style percentile math
// works before real Postgres-backed, per-style benchmark data exists (see
// docs/06-getting-started.md).
var benchmarksByStyle = map[string][]BenchmarkEntry{
	"Bold Typography": {
		{TitleHeightPercent: 8.2, ContrastRatio: 4.1, WhitespacePercent: 62},
		{TitleHeightPercent: 11.5, ContrastRatio: 6.8, WhitespacePercent: 55},
		{TitleHeightPercent: 14.0, ContrastRatio: 3.2, WhitespacePercent: 48},
		{TitleHeightPercent: 9.7, ContrastRatio: 5.5, WhitespacePercent: 58},
		{TitleHeightPercent: 12.3, ContrastRatio: 7.9, WhitespacePercent: 51},
		{TitleHeightPercent: 16.8, ContrastRatio: 2.9, WhitespacePercent: 44},
		{TitleHeightPercent: 10.1, ContrastRatio: 4.6, WhitespacePercent: 60},
		{TitleHeightPercent: 13.4, ContrastRatio: 8.5, WhitespacePercent: 53},
		{TitleHeightPercent: 7.6, ContrastRatio: 3.8, WhitespacePercent: 65},
		{TitleHeightPercent: 15.2, ContrastRatio: 6.1, WhitespacePercent: 47},
		{TitleHeightPercent: 11.0, ContrastRatio: 5.0, WhitespacePercent: 57},
		{TitleHeightPercent: 9.3, ContrastRatio: 4.9, WhitespacePercent: 59},
		{TitleHeightPercent: 17.5, ContrastRatio: 9.2, WhitespacePercent: 42},
		{TitleHeightPercent: 12.9, ContrastRatio: 7.0, WhitespacePercent: 50},
		{TitleHeightPercent: 10.6, ContrastRatio: 5.7, WhitespacePercent: 56},
	},
	"Dark Photographic": {
		{TitleHeightPercent: 6.5, ContrastRatio: 7.2, WhitespacePercent: 30},
		{TitleHeightPercent: 8.1, ContrastRatio: 8.5, WhitespacePercent: 25},
		{TitleHeightPercent: 5.9, ContrastRatio: 6.1, WhitespacePercent: 35},
		{TitleHeightPercent: 9.4, ContrastRatio: 9.8, WhitespacePercent: 22},
		{TitleHeightPercent: 7.2, ContrastRatio: 5.5, WhitespacePercent: 38},
		{TitleHeightPercent: 10.2, ContrastRatio: 10.1, WhitespacePercent: 18},
		{TitleHeightPercent: 6.8, ContrastRatio: 7.9, WhitespacePercent: 28},
		{TitleHeightPercent: 8.8, ContrastRatio: 8.2, WhitespacePercent: 24},
	},
	"Illustrated": {
		{TitleHeightPercent: 9.5, ContrastRatio: 4.8, WhitespacePercent: 40},
		{TitleHeightPercent: 11.2, ContrastRatio: 5.9, WhitespacePercent: 36},
		{TitleHeightPercent: 8.7, ContrastRatio: 4.2, WhitespacePercent: 45},
		{TitleHeightPercent: 13.1, ContrastRatio: 6.5, WhitespacePercent: 32},
		{TitleHeightPercent: 10.4, ContrastRatio: 5.1, WhitespacePercent: 41},
		{TitleHeightPercent: 12.0, ContrastRatio: 6.0, WhitespacePercent: 38},
		{TitleHeightPercent: 9.0, ContrastRatio: 4.5, WhitespacePercent: 43},
		{TitleHeightPercent: 14.3, ContrastRatio: 7.1, WhitespacePercent: 29},
	},
	"Minimalist": {
		{TitleHeightPercent: 5.0, ContrastRatio: 9.5, WhitespacePercent: 78},
		{TitleHeightPercent: 6.5, ContrastRatio: 11.2, WhitespacePercent: 74},
		{TitleHeightPercent: 4.2, ContrastRatio: 8.8, WhitespacePercent: 82},
		{TitleHeightPercent: 7.1, ContrastRatio: 12.0, WhitespacePercent: 70},
		{TitleHeightPercent: 5.8, ContrastRatio: 10.1, WhitespacePercent: 76},
		{TitleHeightPercent: 6.0, ContrastRatio: 10.8, WhitespacePercent: 73},
		{TitleHeightPercent: 4.8, ContrastRatio: 9.0, WhitespacePercent: 80},
		{TitleHeightPercent: 7.5, ContrastRatio: 13.1, WhitespacePercent: 68},
	},
}

// SampleBenchmark is kept for backward compatibility with cmd/scoretest,
// which doesn't have a style to key off of.
var SampleBenchmark = benchmarksByStyle["Bold Typography"]

// BenchmarkForStyle returns the benchmark dataset for a given style,
// falling back to "Bold Typography" if the style is unrecognized.
func BenchmarkForStyle(style string) []BenchmarkEntry {
	if data, ok := benchmarksByStyle[style]; ok {
		return data
	}
	return benchmarksByStyle["Bold Typography"]
}

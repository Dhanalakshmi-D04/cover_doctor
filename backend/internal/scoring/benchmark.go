package scoring

// BenchmarkEntry represents one already-analyzed cover's measurements, used
// as a comparison point for percentile calculations.
type BenchmarkEntry struct {
	TitleHeightPercent float64
	ContrastRatio      float64
	WhitespacePercent  float64
}

// SampleBenchmark is a small hardcoded placeholder dataset for Milestone 1
// only — it exists to prove the percentile math works before
// backend/internal/db exists. It will be replaced by real Postgres-backed
// benchmark data, grouped by style tag, once the db package is built (see
// docs/06-getting-started.md, Milestone 2).
var SampleBenchmark = []BenchmarkEntry{
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
}

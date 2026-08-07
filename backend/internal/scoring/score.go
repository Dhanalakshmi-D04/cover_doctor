package scoring

// FeatureScore is the result of comparing one measured feature against its
// benchmark distribution.
type FeatureScore struct {
	Feature    string
	Value      float64
	Percentile float64
}

// Report is the full set of feature scores plus an overall score, which is
// simply the average percentile across features — deliberately simple,
// deliberately not AI-decided (see docs/00-overview.md).
type Report struct {
	Features []FeatureScore
	Overall  float64
}

// Score compares a cover's measurements against a benchmark and returns a
// percentile per feature plus an overall average score.
func Score(titleHeightPercent, contrastRatio, whitespacePercent float64, benchmark []BenchmarkEntry) Report {
	titleHeights := make([]float64, len(benchmark))
	contrasts := make([]float64, len(benchmark))
	whitespaces := make([]float64, len(benchmark))

	for i, b := range benchmark {
		titleHeights[i] = b.TitleHeightPercent
		contrasts[i] = b.ContrastRatio
		whitespaces[i] = b.WhitespacePercent
	}

	features := []FeatureScore{
		{Feature: "title_height_percent", Value: titleHeightPercent, Percentile: PercentileRank(titleHeightPercent, titleHeights)},
		{Feature: "contrast_ratio", Value: contrastRatio, Percentile: PercentileRank(contrastRatio, contrasts)},
		{Feature: "whitespace_percent", Value: whitespacePercent, Percentile: PercentileRank(whitespacePercent, whitespaces)},
	}

	var total float64
	for _, f := range features {
		total += f.Percentile
	}

	return Report{
		Features: features,
		Overall:  total / float64(len(features)),
	}
}

package models

import "time"

// Cover is the full, already-scored record for one uploaded book cover.
// Every field here is computed by ocr/measure/scoring — nothing here is
// ever decided by AI (see docs/00-overview.md).
type Cover struct {
	ID       string `db:"id" json:"id"`
	Filename string `db:"filename" json:"filename"`

	ImageWidth  int `db:"image_width" json:"image_width"`
	ImageHeight int `db:"image_height" json:"image_height"`

	TitleText             string  `db:"title_text" json:"title_text"`
	TitleHeightPercent    float64 `db:"title_height_percent" json:"title_height_percent"`
	TitleHeightPercentile float64 `db:"title_height_percentile" json:"title_height_percentile"`

	ContrastRatio      float64 `db:"contrast_ratio" json:"contrast_ratio"`
	ContrastPercentile float64 `db:"contrast_percentile" json:"contrast_percentile"`

	WhitespacePercent    float64 `db:"whitespace_percent" json:"whitespace_percent"`
	WhitespacePercentile float64 `db:"whitespace_percentile" json:"whitespace_percentile"`

	OverallScore float64 `db:"overall_score" json:"overall_score"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

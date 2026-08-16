package models

import "time"

// Cover is the full, already-scored record for one uploaded book cover.
// Every measurement here is computed by ocr/measure/scoring — nothing is
// ever decided by AI (see docs/00-overview.md). AI only supplies the style
// label and the explanation text, both purely descriptive, never scoring.
type Cover struct {
	ID       string `db:"id" json:"id"`
	Filename string `db:"filename" json:"filename"`

	UserID        *string `db:"user_id" json:"user_id,omitempty"`
	BookProjectID *string `db:"book_project_id" json:"book_project_id,omitempty"`
	VersionNumber int     `db:"version_number" json:"version_number"`
	Status        string  `db:"status" json:"status"`

	ImageWidth  int `db:"image_width" json:"image_width"`
	ImageHeight int `db:"image_height" json:"image_height"`

	Style *string `db:"style" json:"style,omitempty"`

	TitleText             string  `db:"title_text" json:"title_text"`
	TitleHeightPercent    float64 `db:"title_height_percent" json:"title_height_percent"`
	TitleHeightPercentile float64 `db:"title_height_percentile" json:"title_height_percentile"`
	TitleExplanation      *string `db:"title_explanation" json:"title_explanation,omitempty"`

	ContrastRatio       float64 `db:"contrast_ratio" json:"contrast_ratio"`
	ContrastPercentile  float64 `db:"contrast_percentile" json:"contrast_percentile"`
	ContrastExplanation *string `db:"contrast_explanation" json:"contrast_explanation,omitempty"`

	WhitespacePercent     float64 `db:"whitespace_percent" json:"whitespace_percent"`
	WhitespacePercentile  float64 `db:"whitespace_percentile" json:"whitespace_percentile"`
	WhitespaceExplanation *string `db:"whitespace_explanation" json:"whitespace_explanation,omitempty"`

	OverallScore float64 `db:"overall_score" json:"overall_score"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

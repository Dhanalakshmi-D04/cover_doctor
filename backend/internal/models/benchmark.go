package models

import "time"

// Benchmark represents one reference cover's measurements in the database.
type Benchmark struct {
	ID                 string    `db:"id" json:"id"`
	Style              string    `db:"style" json:"style"`
	TitleHeightPercent float64   `db:"title_height_percent" json:"title_height_percent"`
	ContrastRatio      float64   `db:"contrast_ratio" json:"contrast_ratio"`
	WhitespacePercent  float64   `db:"whitespace_percent" json:"whitespace_percent"`
	CreatedAt          time.Time `db:"created_at" json:"created_at"`
}

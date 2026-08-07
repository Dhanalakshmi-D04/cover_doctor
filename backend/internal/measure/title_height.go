package measure

import (
	"errors"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
)

// ErrNoText is returned when no OCR text was found to measure.
var ErrNoText = errors.New("measure: no text detected on cover")

// Tuning constants for merging wrapped multi-line titles (e.g. "ABANDONED"
// / "KINGDOM" on two separate OCR lines that are really one title).
const (
	// titleHeightSimilarityRatio: lines within this fraction of the seed
	// line's height are considered part of the same title block.
	titleHeightSimilarityRatio = 0.3
	// titleLineGapMultiplier: lines separated vertically by more than this
	// multiple of the seed line's height are considered a different block
	// (e.g. the title vs. the author name further down the cover).
	titleLineGapMultiplier = 1.5
)

// TitleResult holds the detected title text, its bounding box, and its
// height as a percentage of the overall image height.
type TitleResult struct {
	Text          string
	HeightPercent float64
	Box           BoundingBox
}

// DetectTitle finds the most likely title on a book cover: the line of text
// with the largest average character height, plus any adjacent lines of
// similar height (to correctly capture titles that wrap across multiple
// lines). This is a deliberate, deterministic heuristic (not AI) — a book's
// title is almost always the most visually dominant text on a cover, which
// is a far more reliable signal than vertical position (title placement
// varies by design, but prominence rarely does).
func DetectTitle(words []ocr.WordBox, imageHeightPx int) (TitleResult, error) {
	if len(words) == 0 {
		return TitleResult{}, ErrNoText
	}
	if imageHeightPx <= 0 {
		return TitleResult{}, errors.New("measure: image height must be positive")
	}

	lines := groupLines(words)
	if len(lines) == 0 {
		return TitleResult{}, ErrNoText
	}

	seedIndex := 0
	for i, l := range lines {
		if l.AvgHeight > lines[seedIndex].AvgHeight {
			seedIndex = i
		}
	}

	titleBlock := mergeTitleBlock(lines, seedIndex)
	combined := combineLines(titleBlock)

	percent := (combined.AvgHeight / float64(imageHeightPx)) * 100

	return TitleResult{
		Text:          combined.Text,
		HeightPercent: percent,
		Box: BoundingBox{
			Left:   combined.Left,
			Top:    combined.Top,
			Width:  combined.Right - combined.Left,
			Height: combined.Bottom - combined.Top,
		},
	}, nil
}

// mergeTitleBlock starts at the tallest line (the "seed") and expands
// outward, upward and downward, absorbing neighboring lines that are close
// enough in height and vertical position to plausibly be part of the same
// wrapped title.
func mergeTitleBlock(lines []Line, seedIndex int) []Line {
	seed := lines[seedIndex]
	block := []Line{seed}

	for i := seedIndex - 1; i >= 0; i-- {
		prev := lines[i]
		next := block[0]
		if !linesBelongTogether(prev, next, seed.AvgHeight) {
			break
		}
		block = append([]Line{prev}, block...)
	}

	for i := seedIndex + 1; i < len(lines); i++ {
		next := lines[i]
		prevInBlock := block[len(block)-1]
		if !linesBelongTogether(prevInBlock, next, seed.AvgHeight) {
			break
		}
		block = append(block, next)
	}

	return block
}

// linesBelongTogether decides whether two vertically-adjacent lines are
// plausibly part of the same title block, based on how similar their
// heights are and how close together they sit.
func linesBelongTogether(a, b Line, seedHeight float64) bool {
	heightDiff := b.AvgHeight - a.AvgHeight
	if heightDiff < 0 {
		heightDiff = -heightDiff
	}
	if heightDiff/seedHeight > titleHeightSimilarityRatio {
		return false
	}

	gap := b.Top - a.Bottom
	if gap < 0 {
		gap = 0
	}
	if float64(gap) > seedHeight*titleLineGapMultiplier {
		return false
	}

	return true
}

// combineLines merges multiple lines (already known to belong to the same
// title block) into a single Line: text joined in order, bounding box as
// the union of all lines, and height as the word-count-weighted average.
func combineLines(lines []Line) Line {
	if len(lines) == 1 {
		return lines[0]
	}

	combined := lines[0]
	var totalWeightedHeight float64
	var totalWords int
	var texts []string

	for _, l := range lines {
		if l.Left < combined.Left {
			combined.Left = l.Left
		}
		if l.Top < combined.Top {
			combined.Top = l.Top
		}
		if l.Right > combined.Right {
			combined.Right = l.Right
		}
		if l.Bottom > combined.Bottom {
			combined.Bottom = l.Bottom
		}
		totalWeightedHeight += l.AvgHeight * float64(l.WordCount)
		totalWords += l.WordCount
		texts = append(texts, l.Text)
	}

	combined.WordCount = totalWords
	combined.AvgHeight = totalWeightedHeight / float64(totalWords)
	combined.Text = joinWords(texts)

	return combined
}

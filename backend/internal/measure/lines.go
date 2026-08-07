package measure

import (
	"sort"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ocr"
)

// Line groups the words Tesseract found on the same block/paragraph/line
// into a single bounding box and an average word height, which acts as a
// proxy for that line's font size.
type Line struct {
	Text      string
	Left      int
	Top       int
	Right     int
	Bottom    int
	AvgHeight float64
	WordCount int
}

// groupLines groups OCR word boxes into lines based on Tesseract's own
// block/paragraph/line numbering, then computes each line's combined
// bounding box and average word height. The returned lines are sorted
// top-to-bottom by vertical position, so callers can reason about which
// lines are visually adjacent to each other.
func groupLines(words []ocr.WordBox) []Line {
	type key struct{ block, par, line int }
	grouped := make(map[key][]ocr.WordBox)
	var order []key

	for _, w := range words {
		k := key{w.BlockNum, w.ParNum, w.LineNum}
		if _, exists := grouped[k]; !exists {
			order = append(order, k)
		}
		grouped[k] = append(grouped[k], w)
	}

	lines := make([]Line, 0, len(order))
	for _, k := range order {
		ws := grouped[k]
		line := Line{
			Left:   ws[0].Left,
			Top:    ws[0].Top,
			Right:  ws[0].Left + ws[0].Width,
			Bottom: ws[0].Top + ws[0].Height,
		}

		var totalHeight float64
		var texts []string
		for _, w := range ws {
			if w.Left < line.Left {
				line.Left = w.Left
			}
			if w.Top < line.Top {
				line.Top = w.Top
			}
			if right := w.Left + w.Width; right > line.Right {
				line.Right = right
			}
			if bottom := w.Top + w.Height; bottom > line.Bottom {
				line.Bottom = bottom
			}
			totalHeight += float64(w.Height)
			texts = append(texts, w.Text)
		}

		line.WordCount = len(ws)
		line.AvgHeight = totalHeight / float64(len(ws))
		line.Text = joinWords(texts)

		lines = append(lines, line)
	}

	sort.Slice(lines, func(i, j int) bool {
		return lines[i].Top < lines[j].Top
	})

	return lines
}

func joinWords(words []string) string {
	result := ""
	for i, w := range words {
		if i > 0 {
			result += " "
		}
		result += w
	}
	return result
}

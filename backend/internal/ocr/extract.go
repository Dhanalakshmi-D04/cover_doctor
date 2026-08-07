package ocr

import (
	"bufio"
	"bytes"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

// WordBox represents a single recognized word and its position on the
// image, as reported by Tesseract's TSV output.
type WordBox struct {
	BlockNum   int
	ParNum     int
	LineNum    int
	WordNum    int
	Left       int
	Top        int
	Width      int
	Height     int
	Confidence float64
	Text       string
}

// ExtractText runs Tesseract OCR against the image at imagePath and returns
// every recognized word with its bounding box. It shells out to the
// `tesseract` CLI rather than using a CGO binding (like gosseract), keeping
// this package's only dependency an external binary that must be installed
// on the host — simpler to build and deploy for now. See
// docs/01-tech-stack.md, which allows either approach.
func ExtractText(imagePath string) ([]WordBox, error) {
	cmd := exec.Command("tesseract", imagePath, "stdout", "tsv")

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("running tesseract: %w (stderr: %s)", err, stderr.String())
	}

	return parseTSV(stdout.Bytes())
}

// minWordConfidence filters out low-confidence word detections, which are
// usually noise (e.g. Tesseract misreading a decorative border flourish as
// a stray character) rather than real text.
const minWordConfidence = 60.0

// parseTSV parses Tesseract's TSV output format. Columns are:
// level, page_num, block_num, par_num, line_num, word_num,
// left, top, width, height, conf, text
func parseTSV(data []byte) ([]WordBox, error) {
	var boxes []WordBox

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	firstLine := true
	for scanner.Scan() {
		line := scanner.Text()
		if firstLine {
			firstLine = false
			continue // skip header row
		}
		if strings.TrimSpace(line) == "" {
			continue
		}

		fields := strings.Split(line, "\t")
		if len(fields) < 12 {
			continue
		}

		level, err := strconv.Atoi(fields[0])
		if err != nil || level != 5 { // 5 = word-level row
			continue
		}

		text := strings.TrimSpace(fields[11])
		if text == "" {
			continue
		}

		conf, _ := strconv.ParseFloat(fields[10], 64)
		if conf < minWordConfidence {
			continue // treat low-confidence detections as noise, not real text
		}

		blockNum, _ := strconv.Atoi(fields[2])
		parNum, _ := strconv.Atoi(fields[3])
		lineNum, _ := strconv.Atoi(fields[4])
		wordNum, _ := strconv.Atoi(fields[5])
		left, _ := strconv.Atoi(fields[6])
		top, _ := strconv.Atoi(fields[7])
		width, _ := strconv.Atoi(fields[8])
		height, _ := strconv.Atoi(fields[9])

		boxes = append(boxes, WordBox{
			BlockNum:   blockNum,
			ParNum:     parNum,
			LineNum:    lineNum,
			WordNum:    wordNum,
			Left:       left,
			Top:        top,
			Width:      width,
			Height:     height,
			Confidence: conf,
			Text:       text,
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scanning tesseract output: %w", err)
	}

	return boxes, nil
}

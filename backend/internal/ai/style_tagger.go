package ai

import (
	"fmt"
	"os"
	"strings"
)

// styleCategories is the fixed, small list of styles every cover gets
// classified into, defined once up front — never learned or clustered.
// See docs/00-overview.md, "AI Use #1 — Style Tagging".
var styleCategories = []string{
	"Bold Typography",
	"Dark Photographic",
	"Illustrated",
	"Minimalist",
}

// DefaultStyle is used whenever AI is disabled, fails, or returns
// something outside the fixed category list — style tagging only affects
// which benchmark group a cover is compared against, never the score
// itself, so a safe fallback here is always acceptable.
const DefaultStyle = "Bold Typography"

// ClassifyStyle sends the cover image to Claude and returns one of the
// fixed style categories.
func (c *Client) ClassifyStyle(imagePath string) (string, error) {
	if !c.enabled {
		return DefaultStyle, nil
	}

	imageBytes, err := os.ReadFile(imagePath)
	if err != nil {
		return DefaultStyle, fmt.Errorf("reading image: %w", err)
	}

	prompt := fmt.Sprintf(
		"Given this book cover, classify it as one of: %s. Respond with only the category name, nothing else.",
		strings.Join(styleCategories, " / "),
	)

	response, err := c.callClaudeVision(prompt, imageBytes, detectMediaType(imagePath))
	if err != nil {
		return DefaultStyle, fmt.Errorf("style classification failed: %w", err)
	}

	cleaned := strings.Trim(strings.TrimSpace(response), `."'`)
	for _, valid := range styleCategories {
		if strings.EqualFold(cleaned, valid) {
			return valid, nil
		}
	}

	return DefaultStyle, nil // reject anything outside the fixed list, fall back safely
}

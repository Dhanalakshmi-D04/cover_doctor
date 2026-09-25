package ai

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// styleCategories is the fixed, small list of styles every cover gets
// classified into, defined once up front — never learned or clustered.
var styleCategories = []string{
	"Bold Typography",
	"Dark Photographic",
	"Illustrated",
	"Minimalist",
}

// DefaultStyle is used whenever AI is disabled, fails, or returns
// something outside the fixed category list.
const DefaultStyle = "Bold Typography"

// CoverAnalysis holds both the style tag and the Claude-extracted title text
// from a single vision API call.
type CoverAnalysis struct {
	Style      string
	TitleText  string
	AuthorText string
}

// AnalyzeCover sends the cover image to Claude ONCE and returns both the
// visual style tag AND the extracted title text in a single API call.
// This replaces the old ClassifyStyle call and also eliminates the need to
// rely on Tesseract for the title string (Tesseract is still used for
// bounding box coordinates to do contrast math).
func (c *Client) AnalyzeCover(imagePath string) (CoverAnalysis, error) {
	fallback := CoverAnalysis{Style: DefaultStyle, TitleText: "", AuthorText: ""}

	if !c.enabled {
		return fallback, nil
	}

	imageBytes, err := os.ReadFile(imagePath)
	if err != nil {
		return fallback, fmt.Errorf("reading image: %w", err)
	}

	prompt := fmt.Sprintf(
		`You are analyzing a book cover image. Return ONLY a valid JSON object with exactly three keys:
1. "style": classify the cover as exactly one of: %s
2. "title": the exact title text visible on the cover (read carefully, including stylized or decorative fonts). If you truly cannot read any title text, use an empty string "".
3. "author": the author name visible on the cover. If you cannot read any author name, use an empty string "".

Example response: {"style": "Dark Photographic", "title": "The Silent Patient", "author": "Alex Michaelides"}

Return only the JSON object, nothing else.`,
		strings.Join(styleCategories, " / "),
	)

	response, err := c.callClaudeVision(prompt, imageBytes, detectMediaType(imagePath))
	if err != nil {
		return fallback, fmt.Errorf("cover analysis failed: %w", err)
	}

	// Strip markdown code fences if Claude wrapped the JSON
	cleaned := strings.TrimSpace(response)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var result struct {
		Style  string `json:"style"`
		Title  string `json:"title"`
		Author string `json:"author"`
	}
	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return fallback, fmt.Errorf("parsing cover analysis JSON: %w", err)
	}

	// Validate style is one of our known categories
	validStyle := DefaultStyle
	for _, s := range styleCategories {
		if strings.EqualFold(strings.TrimSpace(result.Style), s) {
			validStyle = s
			break
		}
	}

	return CoverAnalysis{
		Style:      validStyle,
		TitleText:  strings.TrimSpace(result.Title),
		AuthorText: strings.TrimSpace(result.Author),
	}, nil
}

// ClassifyStyle is kept for backwards compatibility (used by the scraper pipeline).
func (c *Client) ClassifyStyle(imagePath string) (string, error) {
	analysis, err := c.AnalyzeCover(imagePath)
	return analysis.Style, err
}


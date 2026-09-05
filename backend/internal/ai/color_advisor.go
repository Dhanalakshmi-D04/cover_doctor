package ai

import (
	"encoding/json"
	"fmt"
	"strings"
)

// ColorSuggestion represents a single color swap recommendation.
type ColorSuggestion struct {
	CurrentHex     string `json:"current_hex"`
	SuggestedHex   string `json:"suggested_hex"`
	Reason         string `json:"reason"`
	Role           string `json:"role"` // "Primary", "Accent", etc.
}

// ColorAdvice is the full response from the AI color advisor.
type ColorAdvice struct {
	Summary     string            `json:"summary"`
	Suggestions []ColorSuggestion `json:"suggestions"`
}

// SuggestColors asks Claude to evaluate the extracted palette against
// the cover's visual style and suggest specific hex swaps.
// It always returns a safe fallback if AI is disabled or fails.
func (c *Client) SuggestColors(paletteHexes []string, style, genre string) ColorAdvice {
	fallback := ColorAdvice{
		Summary: fmt.Sprintf(
			"Your palette uses %d distinct colors. For the %s style, ensure your darkest color has enough contrast against your title text.",
			len(paletteHexes), style,
		),
		Suggestions: []ColorSuggestion{},
	}

	if !c.enabled || len(paletteHexes) == 0 {
		return fallback
	}

	paletteList := strings.Join(paletteHexes, ", ")

	prompt := fmt.Sprintf(`You are a professional book cover design consultant with deep knowledge of genre color psychology.

A book cover has been analyzed and its top dominant colors extracted:
Palette: %s
Visual Style: %s
Genre: %s

Analyze these colors and:
1. Write a 1-2 sentence summary evaluating if these colors fit the genre expectations.
2. For up to 3 colors, suggest a specific improved hex code with a clear, one-sentence reason WHY the change would help sell more books.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "summary": "...",
  "suggestions": [
    {
      "current_hex": "#XXXXXX",
      "suggested_hex": "#YYYYYY",
      "reason": "...",
      "role": "Primary"
    }
  ]
}`, paletteList, style, genre)

	response, err := c.callClaudeText(prompt)
	if err != nil || response == "" {
		return fallback
	}

	// Strip markdown code fences if present
	response = strings.TrimSpace(response)
	if strings.HasPrefix(response, "```") {
		lines := strings.Split(response, "\n")
		var cleaned []string
		for _, line := range lines {
			if !strings.HasPrefix(line, "```") {
				cleaned = append(cleaned, line)
			}
		}
		response = strings.Join(cleaned, "\n")
	}

	var advice ColorAdvice
	if err := json.Unmarshal([]byte(response), &advice); err != nil {
		return fallback
	}

	return advice
}

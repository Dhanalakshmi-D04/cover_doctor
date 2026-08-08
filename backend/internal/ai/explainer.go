package ai

import "fmt"

// ExplainFeature turns already-computed numbers into a short, natural
// sentence. It never decides the score or the recommendation — that data
// is already final by the time it reaches here. See docs/00-overview.md,
// "AI Use #2 — Writing the Why Explanations".
func (c *Client) ExplainFeature(feature string, value, benchmarkAverage, percentile float64) string {
	if !c.enabled {
		return fallbackExplanation(feature, value, percentile)
	}

	prompt := fmt.Sprintf(
		"Turn this data into a short, clear, one-sentence explanation for a book author, in a friendly but direct tone. Do not invent numbers not given here.\nFeature: %s\nYour value: %.2f\nBenchmark average: %.2f\nPercentile: %.0f",
		feature, value, benchmarkAverage, percentile,
	)

	response, err := c.callClaudeText(prompt)
	if err != nil || response == "" {
		return fallbackExplanation(feature, value, percentile)
	}

	return response
}

// fallbackExplanation is used when AI is disabled or the call fails — a
// plain template, less polished, but it never blocks the report from
// existing.
func fallbackExplanation(feature string, value, percentile float64) string {
	return fmt.Sprintf("%s is %.2f, which is at the %.0fth percentile among comparable covers.", feature, value, percentile)
}

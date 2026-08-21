package ai

import (
	"encoding/json"
	"fmt"
)

type FeatureData struct {
	Name             string  `json:"name"`
	Value            float64 `json:"value"`
	BenchmarkAverage float64 `json:"benchmark_average"`
	Percentile       float64 `json:"percentile"`
}

// ExplainFeatures turns already-computed numbers into short, natural
// sentences in a single batched API call.
func (c *Client) ExplainFeatures(features []FeatureData) map[string]string {
	results := make(map[string]string)
	
	// Pre-fill with fallbacks so we always have a safe default
	for _, f := range features {
		results[f.Name] = fallbackExplanation(f.Name, f.Value, f.Percentile)
	}

	if !c.enabled || len(features) == 0 {
		return results
	}

	prompt := "Turn the following data into a short, clear, one-sentence explanation for a book author, in a friendly but direct tone per feature. Do not invent numbers. Return ONLY a JSON object where the keys are the feature names and the values are your string explanations.\n\n"
	
	prompt += "Features Data:\n"
	for _, f := range features {
		prompt += fmt.Sprintf("- Feature: %s | Value: %.2f | Benchmark average: %.2f | Percentile: %.0f\n", f.Name, f.Value, f.BenchmarkAverage, f.Percentile)
	}

	response, err := c.callClaudeText(prompt)
	if err != nil || response == "" {
		return results // Fallback already in map
	}

	var parsed map[string]string
	if err := json.Unmarshal([]byte(response), &parsed); err != nil {
		// If JSON parsing fails, fallback
		return results
	}

	for _, f := range features {
		if explanation, ok := parsed[f.Name]; ok && explanation != "" {
			results[f.Name] = explanation
		}
	}

	return results
}

// fallbackExplanation is used when AI is disabled or the call fails — a
// plain template, less polished, but it never blocks the report from
// existing.
func fallbackExplanation(feature string, value, percentile float64) string {
	return fmt.Sprintf("%s is %.2f, which is at the %.0fth percentile among comparable covers.", feature, value, percentile)
}

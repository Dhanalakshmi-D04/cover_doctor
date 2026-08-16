package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeProcessCover = "cover:process"
)

// ProcessCoverPayload is the data passed to the worker.
type ProcessCoverPayload struct {
	CoverID       string `json:"cover_id"`
	Filename      string `json:"filename"`
	UserID        string `json:"user_id"`
	BookProjectID string `json:"book_project_id,omitempty"`
	ImageWidth    int    `json:"image_width"`
	ImageHeight   int    `json:"image_height"`
}

// NewProcessCoverTask creates a new Asynq task for processing a cover image.
func NewProcessCoverTask(payload ProcessCoverPayload) (*asynq.Task, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeProcessCover, b), nil
}

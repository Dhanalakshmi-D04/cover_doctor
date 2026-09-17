package main

import (
	"context"
	"fmt"
	
	"github.com/joho/godotenv"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/storage"
)

func main() {
	godotenv.Load(".env")
	cfg, _ := config.Load()

	// Test with path style true
	cfg.S3ForcePathStyle = true
	c1, _ := storage.NewS3Client(context.Background(), cfg)
	err := c1.UploadFile(context.Background(), "test1.txt", "text/plain", []byte("hello"))
	fmt.Printf("PathStyle=true -> %v\n", err)

	// Test with path style false
	cfg.S3ForcePathStyle = false
	c2, _ := storage.NewS3Client(context.Background(), cfg)
	err = c2.UploadFile(context.Background(), "test2.txt", "text/plain", []byte("hello"))
	fmt.Printf("PathStyle=false -> %v\n", err)
}

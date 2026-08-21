package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	appconfig "github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
)

// S3Client encapsulates the AWS S3 client for object storage operations.
type S3Client struct {
	client *s3.Client
	bucket string
}

// NewS3Client creates a new S3Client connected to the provided endpoint (MinIO or real AWS S3).
func NewS3Client(ctx context.Context, cfg *appconfig.Config) (*S3Client, error) {
	opts := []func(*config.LoadOptions) error{
		config.WithRegion("ap-south-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.S3AccessKey, cfg.S3SecretKey, "")),
	}

	awsCfg, err := config.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.S3ForcePathStyle
		if cfg.S3Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.S3Endpoint)
		}
	})

	return &S3Client{
		client: client,
		bucket: cfg.S3Bucket,
	}, nil
}

// UploadFile uploads content to the specified key in S3.
func (s *S3Client) UploadFile(ctx context.Context, key string, contentType string, content []byte) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(content),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("failed to upload object to S3: %w", err)
	}
	return nil
}

// GetFileStream retrieves a file from S3 as a stream.
// It returns an io.ReadCloser which must be closed by the caller, or an error.
func (s *S3Client) GetFileStream(ctx context.Context, key string) (io.ReadCloser, string, error) {
	output, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to get object from S3: %w", err)
	}

	contentType := ""
	if output.ContentType != nil {
		contentType = *output.ContentType
	}
	return output.Body, contentType, nil
}

// GeneratePresignedURL generates a presigned URL to download an object directly.
func (s *S3Client) GeneratePresignedURL(ctx context.Context, key string, duration time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(duration))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return req.URL, nil
}

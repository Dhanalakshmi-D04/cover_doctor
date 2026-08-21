FROM golang:1.22-alpine AS builder

# Install tesseract for OCR
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binaries
RUN go build -o /api ./cmd/api
RUN go build -o /worker ./cmd/worker

# Create final image
FROM alpine:latest

# Install tesseract in the final image
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /api /api
COPY --from=builder /worker /worker

# We need the env and migrations available if we were running them from within the container
COPY .env.example .env
COPY migrations migrations

# PRODUCTION DEPLOYMENT NOTE:
# This single Docker image contains both the web API and the background worker.
# To deploy to production, you must run TWO separate container services from this image:
#
# 1. API Service (Web):
#    - Exposes Port: 8080
#    - Command Override: /api
#
# 2. Worker Service (Background processing):
#    - Exposes Port: None
#    - Command Override: /worker

EXPOSE 8080

# The default command runs the API. To run the worker, override the command with "/worker".
CMD ["/api"]

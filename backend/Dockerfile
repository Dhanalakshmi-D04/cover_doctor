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

EXPOSE 8080

CMD ["/api"]

# Cover Doctor 🩺📘

A full-stack web app that helps authors and publishers diagnose, score, and benchmark their book covers against real bestseller trends — using deterministic OCR/computer-vision measurement, not AI opinion.

Covers are compared across visual style categories (Minimalist, Dark Photographic, Illustrated, Bold Typography) against a database of scraped, OCR-verified Amazon bestseller covers, producing quantitative scores on typography, contrast, and layout.

## Features

- **Deterministic scoring** — title height, contrast ratio, and whitespace are measured via OCR (Tesseract), not estimated by AI. AI is used only for two narrow, non-scoring tasks: style classification and turning finished numbers into a natural-language explanation.
- **Real benchmark data** — covers are compared against genuine, OCR-verified Amazon bestsellers, scraped and processed through the same measurement pipeline as user uploads.
- **Authentication** — email/password (bcrypt) and Google OAuth2, both backed by stateless JWTs stored exclusively in `HttpOnly` cookies, with server-side token revocation ("log out of all devices").
- **Tiered billing** — subscription plans (Starter / Creator / Publisher) via [Polar.sh](https://polar.sh), enforced server-side and kept in sync via signed webhooks.
- **Async processing** — OCR and AI work run in a background job queue (Redis + Asynq), decoupled from the API.
- **S3-compatible storage** — works with AWS S3, Cloudflare R2, or local MinIO.

## Tech Stack

**Backend**
- Go, Gin
- PostgreSQL (`sqlx`, plain SQL migrations)
- Redis + Asynq (job queue)
- AWS SDK v2 (S3-compatible storage)
- `golang-jwt/jwt/v5`, `golang.org/x/oauth2`

**Frontend**
- React 18 + Vite
- React Router
- React Query (`@tanstack/react-query`)

## Prerequisites

- Go 1.21+
- Node.js 18+ and npm
- PostgreSQL
- Redis
- MinIO (or another S3-compatible store, for local dev)

## Local Development

**1. Database**
```bash
createdb covers
```
Apply the SQL migrations in `backend/migrations/` in order (e.g. via `golang-migrate`, or sequentially by hand).

**2. Backend**
```bash
cd backend
cp .env.example .env   # fill in your local Postgres, Redis, and MinIO credentials, plus a JWT_SECRET
go mod tidy
go run ./cmd/api        # http://localhost:8080
```
Optional integrations (AI, billing, email, Google sign-in) only activate if their respective env vars are set — see `.env.example` for the full list.

**3. Worker** (background OCR/AI processing — run in a separate terminal)
```bash
cd backend
go run ./cmd/worker
```

**4. Frontend**
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## Project Structure

```
cover_doctor/
├── backend/
│   ├── cmd/              # Entrypoints: api, worker, scraper
│   ├── internal/
│   │   ├── ai/            # Anthropic Claude integration
│   │   ├── api/            # HTTP handlers and routing
│   │   ├── billing/        # Polar.sh integration
│   │   ├── config/         # Env var loading
│   │   ├── db/              # SQL queries
│   │   ├── middleware/      # Auth, CORS, rate limiting
│   │   ├── ocr/              # Tesseract integration
│   │   ├── scraper/          # Bestseller scraping pipeline
│   │   ├── storage/           # S3-compatible object storage
│   │   └── worker/            # Async job processors
│   └── migrations/       # SQL schema migrations
└── frontend/
    └── src/
        ├── api/            # React Query fetch clients
        ├── components/     # Reusable UI
        └── pages/          # Route views
```

## Security Notes

- **Cookie-only auth** — the API only accepts the `HttpOnly`, `SameSite=Lax` session cookie; `Authorization: Bearer` headers are explicitly rejected.
- **CSRF-protected OAuth** — the Google sign-in flow uses a cryptographically random `state` token to prevent CSRF during the handshake.
- **Instant token revocation** — JWTs carry a `token_version` claim checked against the database on every request. A password change or a "log out of all devices" action invalidates every previously issued token immediately.

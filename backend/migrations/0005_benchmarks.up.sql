CREATE TABLE benchmarks (
    id UUID PRIMARY KEY,
    style TEXT NOT NULL,
    title_height_percent DOUBLE PRECISION NOT NULL,
    contrast_ratio DOUBLE PRECISION NOT NULL,
    whitespace_percent DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_benchmarks_style ON benchmarks(style);

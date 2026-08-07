CREATE TABLE covers (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    image_width INTEGER NOT NULL,
    image_height INTEGER NOT NULL,

    title_text TEXT,
    title_height_percent DOUBLE PRECISION NOT NULL,
    title_height_percentile DOUBLE PRECISION NOT NULL,

    contrast_ratio DOUBLE PRECISION NOT NULL,
    contrast_percentile DOUBLE PRECISION NOT NULL,

    whitespace_percent DOUBLE PRECISION NOT NULL,
    whitespace_percentile DOUBLE PRECISION NOT NULL,

    overall_score DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

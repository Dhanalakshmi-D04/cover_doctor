CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_a_id UUID NOT NULL REFERENCES covers(id) ON DELETE CASCADE,
    cover_b_id UUID NOT NULL REFERENCES covers(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    votes_a INTEGER NOT NULL DEFAULT 0,
    votes_b INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ab_tests_user_id ON ab_tests(user_id);
CREATE INDEX idx_ab_tests_slug ON ab_tests(slug);

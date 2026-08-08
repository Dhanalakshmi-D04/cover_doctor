CREATE TABLE book_projects (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE covers ADD COLUMN book_project_id UUID REFERENCES book_projects(id);
ALTER TABLE covers ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;

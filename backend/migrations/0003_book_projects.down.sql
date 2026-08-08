ALTER TABLE covers DROP COLUMN IF EXISTS version_number;
ALTER TABLE covers DROP COLUMN IF EXISTS book_project_id;
DROP TABLE IF EXISTS book_projects;

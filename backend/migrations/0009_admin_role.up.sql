-- Add a boolean flag to the users table to distinguish admins from regular users.
-- Defaults to false so new signups are regular users.
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

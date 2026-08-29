-- Make password_hash nullable so Google-only users don't need one.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- google_id: the stable subject ("sub") from Google's ID token.
-- auth_provider: tracks how the account was created ('password' or 'google').
ALTER TABLE users
    ADD COLUMN google_id    TEXT UNIQUE,
    ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password';

-- Back-fill existing rows (they are all password accounts).
UPDATE users SET auth_provider = 'password' WHERE auth_provider IS NULL;

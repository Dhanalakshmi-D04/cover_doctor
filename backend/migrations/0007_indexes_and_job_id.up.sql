-- Speed up the two most common lookup patterns:
-- "give me all covers for this user" and "give me this user's subscription".
-- Without indexes, these are full table scans that get slower as rows accumulate.
CREATE INDEX idx_covers_user_id ON covers(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Store the Asynq background job ID on the cover so the API can report
-- real processing status (pending / complete / failed) when the frontend polls.
ALTER TABLE covers ADD COLUMN job_id TEXT;

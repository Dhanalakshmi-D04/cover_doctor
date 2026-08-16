ALTER TABLE covers DROP COLUMN IF EXISTS job_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_covers_user_id;

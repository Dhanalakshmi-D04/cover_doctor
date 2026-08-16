-- Stripe retries webhook deliveries if your server returns a non-2xx response
-- or times out. Without this table, a retried webhook could process a payment
-- event twice (e.g. upgrading a user to "paid" twice, or sending two emails).
-- Before processing any Stripe event, the webhook handler checks this table
-- first and skips the event if it was already handled.
CREATE TABLE processed_stripe_events (
    event_id     TEXT PRIMARY KEY,       -- Stripe event ID, e.g. "evt_1A2B3C..."
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

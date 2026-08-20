ALTER TABLE subscriptions 
  RENAME COLUMN stripe_customer_id TO polar_customer_id;

ALTER TABLE subscriptions 
  RENAME COLUMN stripe_subscription_id TO polar_subscription_id;

ALTER TABLE processed_stripe_events RENAME TO processed_polar_events;

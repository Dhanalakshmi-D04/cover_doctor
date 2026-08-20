ALTER TABLE subscriptions 
  RENAME COLUMN polar_customer_id TO stripe_customer_id;

ALTER TABLE subscriptions 
  RENAME COLUMN polar_subscription_id TO stripe_subscription_id;

ALTER TABLE processed_polar_events RENAME TO processed_stripe_events;

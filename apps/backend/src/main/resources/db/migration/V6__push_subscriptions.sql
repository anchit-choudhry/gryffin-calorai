-- Web Push subscription storage for VAPID-based off-tab reminder delivery.
CREATE TABLE push_subscriptions
(
  id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  timezone   VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions (user_id);

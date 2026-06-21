-- V3: Persistent refresh token store for single-use rotation.
-- Each refresh token's JTI is written on issue and deleted on use.
-- Attempting to reuse a JTI indicates potential token theft and is rejected.

CREATE TABLE refresh_tokens
(
  jti        UUID PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);

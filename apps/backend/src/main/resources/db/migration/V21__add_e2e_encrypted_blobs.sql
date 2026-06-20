CREATE TABLE user_e2e_config (
  user_id    UUID         PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  salt       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE encrypted_blobs (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  client_blob_id VARCHAR(255) NOT NULL,
  iv             VARCHAR(255) NOT NULL,
  ciphertext     TEXT         NOT NULL,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  is_deleted     BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_user_blob UNIQUE (user_id, client_blob_id)
);

CREATE INDEX idx_enc_blobs_user_updated ON encrypted_blobs(user_id, updated_at);

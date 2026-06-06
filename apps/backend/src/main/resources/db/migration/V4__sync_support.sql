-- V4: Cloud sync support - updated_at timestamps for delta sync, deleted_at for tombstones
-- All log tables now support GET /changes?since=<Instant> for incremental sync

ALTER TABLE food_items
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE water_logs
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE activity_logs
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE body_measurements
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE step_logs
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE fasting_sessions
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_food_user_updated ON food_items (user_id, updated_at);
CREATE INDEX idx_water_user_updated ON water_logs (user_id, updated_at);
CREATE INDEX idx_activity_user_updated ON activity_logs (user_id, updated_at);
CREATE INDEX idx_body_user_updated ON body_measurements (user_id, updated_at);
CREATE INDEX idx_steps_user_updated ON step_logs (user_id, updated_at);
CREATE INDEX idx_fasting_user_updated ON fasting_sessions (user_id, updated_at);

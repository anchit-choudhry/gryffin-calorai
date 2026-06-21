-- V1: Initial schema for Gryffin Calorai backend (mirrors IndexedDB schema v17+)

CREATE TABLE app_users
(
  id               UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
  display_name     VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE,
  provider         VARCHAR(50)  NOT NULL,
  provider_subject VARCHAR(255) UNIQUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE food_items
(
  id           UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  name         VARCHAR(255)  NOT NULL,
  calories     NUMERIC(7, 2) NOT NULL CHECK (calories >= 0 AND calories <= 9999),
  serving_size NUMERIC(6, 2) NOT NULL DEFAULT 1.0 CHECK (serving_size >= 0),
  protein      NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs        NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat          NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (fat >= 0),
  date_logged  DATE          NOT NULL,
  is_favorite  BOOLEAN       NOT NULL DEFAULT FALSE,
  meal_type    VARCHAR(20),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_user_date ON food_items (user_id, date_logged);
CREATE INDEX idx_food_user_fav ON food_items (user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE TABLE water_logs
(
  id          UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  amount      NUMERIC(7, 2) NOT NULL CHECK (amount >= 0),
  date_logged DATE          NOT NULL,
  logged_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_water_user_date ON water_logs (user_id, date_logged);

CREATE TABLE activity_logs
(
  id              UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  activity_type   VARCHAR(255)  NOT NULL,
  duration_min    INTEGER       NOT NULL CHECK (duration_min >= 0),
  calories_burned NUMERIC(7, 2) NOT NULL CHECK (calories_burned >= 0),
  date_logged     DATE          NOT NULL,
  logged_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_user_date ON activity_logs (user_id, date_logged);

CREATE TABLE fasting_sessions
(
  id           UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ,
  target_hours INTEGER     NOT NULL CHECK (target_hours > 0),
  date_logged  DATE        NOT NULL,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_fasting_user_date ON fasting_sessions (user_id, date_logged);

CREATE TABLE body_measurements
(
  id           UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  weight_kg    NUMERIC(6, 2) CHECK (weight_kg >= 0),
  body_fat_pct NUMERIC(5, 2) CHECK (body_fat_pct >= 0 AND body_fat_pct <= 100),
  date_logged  DATE        NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_body_user_date ON body_measurements (user_id, date_logged);

CREATE TABLE step_logs
(
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  steps       INTEGER NOT NULL CHECK (steps >= 0),
  date_logged DATE    NOT NULL,
  UNIQUE (user_id, date_logged)
);
CREATE INDEX idx_steps_user_date ON step_logs (user_id, date_logged);

CREATE TABLE tdee_profiles
(
  id             UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL UNIQUE REFERENCES app_users (id) ON DELETE CASCADE,
  age            INTEGER       NOT NULL CHECK (age BETWEEN 1 AND 120),
  sex            VARCHAR(10)   NOT NULL CHECK (sex IN ('male', 'female')),
  height_cm      NUMERIC(5, 2) NOT NULL CHECK (height_cm > 0),
  weight_kg      NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
  activity_level VARCHAR(20)   NOT NULL,
  goal           VARCHAR(20)   NOT NULL,
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

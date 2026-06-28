-- Recipes synced from client devices.
-- ingredients stored as JSONB: [{foodItemId, quantity, serving}]
CREATE TABLE IF NOT EXISTS recipes
(
  id
  UUID
  PRIMARY
  KEY,
  user_id
  UUID
  NOT
  NULL
  REFERENCES
  app_users
(
  id
) ON DELETE CASCADE,
  name VARCHAR
(
  255
) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER,
  total_protein DOUBLE PRECISION,
  total_carbs DOUBLE PRECISION,
  total_fat DOUBLE PRECISION,
  created_by VARCHAR
(
  255
) NOT NULL,
  date_created VARCHAR
(
  20
) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
  deleted_at TIMESTAMPTZ
  );

CREATE INDEX idx_recipes_user_updated ON recipes (user_id, updated_at);

-- Meal templates (saved meal combos) synced from client devices.
-- foods stored as JSONB: [{foodItemId, quantity, serving, nutritionData?}]
CREATE TABLE IF NOT EXISTS meal_templates
(
  id
  UUID
  PRIMARY
  KEY,
  user_id
  UUID
  NOT
  NULL
  REFERENCES
  app_users
(
  id
) ON DELETE CASCADE,
  name VARCHAR
(
  255
) NOT NULL,
  foods JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
  deleted_at TIMESTAMPTZ
  );

CREATE INDEX idx_meal_templates_user_updated ON meal_templates (user_id, updated_at);

-- User reminders (water, meal, step) synced from client devices.
CREATE TABLE IF NOT EXISTS user_reminders
(
  id
  UUID
  PRIMARY
  KEY,
  user_id
  UUID
  NOT
  NULL
  REFERENCES
  app_users
(
  id
) ON DELETE CASCADE,
  type VARCHAR
(
  50
) NOT NULL,
  time VARCHAR
(
  10
) NOT NULL,
  days_of_week INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
  deleted_at TIMESTAMPTZ
  );

CREATE INDEX idx_user_reminders_user_updated ON user_reminders (user_id, updated_at);

-- One diet profile per user (singleton, UNIQUE on user_id).
-- restrictions stored as JSONB text array: ["vegan", "gluten-free"]
CREATE TABLE IF NOT EXISTS user_diet_profiles
(
  id
  UUID
  PRIMARY
  KEY,
  user_id
  UUID
  NOT
  NULL
  UNIQUE
  REFERENCES
  app_users
(
  id
) ON DELETE CASCADE,
  preset VARCHAR
(
  50
) NOT NULL DEFAULT 'generic',
  restrictions JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
  deleted_at TIMESTAMPTZ
  );

CREATE INDEX idx_user_diet_profiles_user ON user_diet_profiles (user_id);

-- V2: Replace the single-column UNIQUE constraint on provider_subject with a
-- composite constraint on (provider, provider_subject) so that different OAuth
-- providers can independently assign the same sub value without colliding.

ALTER TABLE app_users
DROP
CONSTRAINT IF EXISTS app_users_provider_subject_key,
    ADD CONSTRAINT uq_app_users_provider_subject UNIQUE (provider, provider_subject);

-- Enforce valid meal types at the database level.
ALTER TABLE food_items
  ADD CONSTRAINT chk_food_items_meal_type
    CHECK (meal_type IS NULL OR meal_type IN ('Breakfast', 'Lunch', 'Snacks', 'Dinner'));

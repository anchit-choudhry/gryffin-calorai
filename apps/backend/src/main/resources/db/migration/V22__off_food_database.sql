-- V22: Open Food Facts product database + import audit log
-- Supports barcode lookup and full-text food search.
-- Populated by apps/backend/scripts/refresh-off-products.sh (monthly OFF Parquet refresh).

CREATE EXTENSION IF NOT EXISTS unaccent;

-- -----------------------------------------------------------------------
-- Main product table
-- -----------------------------------------------------------------------
CREATE TABLE off_products (
  -- identity
  code                     TEXT        NOT NULL,

  -- basic info
  product_name             TEXT,
  brands                   TEXT,
  serving_size             TEXT,
  serving_size_g           DOUBLE PRECISION,
  nutrition_grade          VARCHAR(1)  CHECK (nutrition_grade IN ('a','b','c','d','e')),
  main_category            TEXT,
  image_small_url          TEXT,
  allergens_tags           TEXT,
  traces_tags              TEXT,

  -- energy
  energy_kcal_100g         DOUBLE PRECISION CHECK (energy_kcal_100g     BETWEEN 0 AND 900),
  energy_kj_100g           DOUBLE PRECISION CHECK (energy_kj_100g       BETWEEN 0 AND 3800),

  -- macronutrients
  proteins_100g            DOUBLE PRECISION CHECK (proteins_100g        BETWEEN 0 AND 100),
  carbohydrates_100g       DOUBLE PRECISION CHECK (carbohydrates_100g   BETWEEN 0 AND 100),
  sugars_100g              DOUBLE PRECISION CHECK (sugars_100g          BETWEEN 0 AND 100),
  fat_100g                 DOUBLE PRECISION CHECK (fat_100g             BETWEEN 0 AND 100),
  saturated_fat_100g       DOUBLE PRECISION CHECK (saturated_fat_100g   BETWEEN 0 AND 100),
  trans_fat_100g           DOUBLE PRECISION CHECK (trans_fat_100g       BETWEEN 0 AND 100),
  monounsaturated_fat_100g DOUBLE PRECISION CHECK (monounsaturated_fat_100g BETWEEN 0 AND 100),
  polyunsaturated_fat_100g DOUBLE PRECISION CHECK (polyunsaturated_fat_100g BETWEEN 0 AND 100),
  omega_3_fat_100g         DOUBLE PRECISION CHECK (omega_3_fat_100g     BETWEEN 0 AND 100),
  cholesterol_100g         DOUBLE PRECISION CHECK (cholesterol_100g     BETWEEN 0 AND 5),
  fiber_100g               DOUBLE PRECISION CHECK (fiber_100g           BETWEEN 0 AND 100),

  -- minerals (g per 100g)
  sodium_100g              DOUBLE PRECISION CHECK (sodium_100g          BETWEEN 0 AND 100),
  calcium_100g             DOUBLE PRECISION CHECK (calcium_100g         BETWEEN 0 AND 10),
  iron_100g                DOUBLE PRECISION CHECK (iron_100g            BETWEEN 0 AND 1),
  potassium_100g           DOUBLE PRECISION CHECK (potassium_100g       BETWEEN 0 AND 10),
  magnesium_100g           DOUBLE PRECISION CHECK (magnesium_100g       BETWEEN 0 AND 5),
  phosphorus_100g          DOUBLE PRECISION CHECK (phosphorus_100g      BETWEEN 0 AND 5),
  zinc_100g                DOUBLE PRECISION CHECK (zinc_100g            BETWEEN 0 AND 1),
  selenium_100g            DOUBLE PRECISION CHECK (selenium_100g        BETWEEN 0 AND 0.01),
  copper_100g              DOUBLE PRECISION CHECK (copper_100g          BETWEEN 0 AND 0.1),
  manganese_100g           DOUBLE PRECISION CHECK (manganese_100g       BETWEEN 0 AND 1),
  iodine_100g              DOUBLE PRECISION CHECK (iodine_100g          BETWEEN 0 AND 0.01),

  -- vitamins (g per 100g)
  vitamin_a_100g           DOUBLE PRECISION CHECK (vitamin_a_100g       BETWEEN 0 AND 0.01),
  vitamin_b1_100g          DOUBLE PRECISION CHECK (vitamin_b1_100g      BETWEEN 0 AND 0.1),
  vitamin_b2_100g          DOUBLE PRECISION CHECK (vitamin_b2_100g      BETWEEN 0 AND 0.1),
  vitamin_b6_100g          DOUBLE PRECISION CHECK (vitamin_b6_100g      BETWEEN 0 AND 0.1),
  vitamin_b9_100g          DOUBLE PRECISION CHECK (vitamin_b9_100g      BETWEEN 0 AND 0.01),
  vitamin_b12_100g         DOUBLE PRECISION CHECK (vitamin_b12_100g     BETWEEN 0 AND 0.001),
  vitamin_c_100g           DOUBLE PRECISION CHECK (vitamin_c_100g       BETWEEN 0 AND 10),
  vitamin_d_100g           DOUBLE PRECISION CHECK (vitamin_d_100g       BETWEEN 0 AND 0.001),
  vitamin_e_100g           DOUBLE PRECISION CHECK (vitamin_e_100g       BETWEEN 0 AND 1),
  vitamin_k_100g           DOUBLE PRECISION CHECK (vitamin_k_100g       BETWEEN 0 AND 0.01),

  -- precomputed FTS vector (populated by trigger and import script)
  search_vec               TSVECTOR,

  -- import tracking
  off_last_modified_at     TIMESTAMPTZ,
  first_imported_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_imported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT off_products_pkey PRIMARY KEY (code)
);

-- -----------------------------------------------------------------------
-- FTS trigger: keeps search_vec current for ad-hoc upserts.
-- The bulk import script sets search_vec directly for performance.
-- unaccent() is STABLE (not IMMUTABLE), so it cannot appear in a functional
-- index expression - but it is perfectly legal inside a trigger body.
-- -----------------------------------------------------------------------
CREATE FUNCTION off_products_update_search_vec()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vec := to_tsvector('simple',
    unaccent(COALESCE(NEW.product_name, '')) || ' ' ||
    unaccent(COALESCE(NEW.brands, ''))
  );
  RETURN NEW;
END;
$$;

-- Fire only when product_name or brands change to avoid redundant work.
CREATE TRIGGER off_products_search_vec_trg
  BEFORE INSERT OR UPDATE OF product_name, brands
  ON off_products
  FOR EACH ROW EXECUTE FUNCTION off_products_update_search_vec();

-- GIN index on the stored tsvector column (no IMMUTABLE restriction applies
-- to plain column indexes - only to functional/expression indexes).
CREATE INDEX idx_off_products_fts ON off_products USING GIN (search_vec);

-- Supports filtering by import recency in monitoring queries.
CREATE INDEX idx_off_last_imported ON off_products (last_imported_at);

-- -----------------------------------------------------------------------
-- Import audit log
-- -----------------------------------------------------------------------
CREATE TABLE off_import_log (
  id            SERIAL      PRIMARY KEY,
  parquet_file  TEXT        NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  rows_staged   INTEGER,
  rows_total    INTEGER,
  status        TEXT        NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running', 'done', 'failed'))
);

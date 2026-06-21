#!/usr/bin/env bash
# refresh-off-products.sh - upsert a new OFF Parquet file into off_products
# Usage: bash refresh-off-products.sh path/to/off.parquet
# Reads DB connection from environment variables (same as apps/backend/.env)
# Safe to run on first import or any subsequent monthly refresh.
#
# Schema note: this script targets the v2 OFF Parquet format where all nutrients
# are in a nested `nutriments` struct array and product_name is multilingual.

set -euo pipefail

PARQUET_FILE="${1:?Usage: $0 path/to/off.parquet}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gcalorai}"
DB_USER="${DB_USER:-gcalorai}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD must be set}"
STAGING="off_products_staging_$$"   # unique name per run - safe for parallel invocations
STAGING_CSV="/tmp/off_staging_$$.csv"

export PGPASSWORD="$DB_PASSWORD"
# -X suppresses .psqlrc to avoid output formatting surprises
PSQL="psql -X -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

echo "[$(date -u +%FT%TZ)] Starting OFF refresh from: $PARQUET_FILE"

# --- prerequisites ---
if ! command -v duckdb &>/dev/null; then
  echo "ERROR: duckdb not found. Install with: brew install duckdb" && exit 1
fi
if ! command -v psql &>/dev/null; then
  echo "ERROR: psql not found. Install PostgreSQL client tools." && exit 1
fi
if [[ ! -f "$PARQUET_FILE" ]]; then
  echo "ERROR: Parquet file not found: $PARQUET_FILE" && exit 1
fi

# Require at least 5GB free on the filesystem where DuckDB writes its temp files.
# Staging + main table + GIN index peak at ~5-7GB for the full OFF dataset.
# Note: PostgreSQL data lives on the postgres_data volume - check that separately
# if running in Docker (docker system df shows volume usage).
AVAILABLE_KB=$(df -k /tmp | awk 'NR==2 {print $4}')
if [[ $AVAILABLE_KB -lt 5242880 ]]; then
  echo "ERROR: Less than 5GB free disk space in /tmp for staging CSV. Aborting." && exit 1
fi

# drop any staging tables left over from a previously killed run
$PSQL -c "
DO \$\$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables
           WHERE tablename LIKE 'off_products_staging_%'
           AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP TABLE ' || quote_ident(r.tablename);
    RAISE NOTICE 'Dropped orphaned staging table: %', r.tablename;
  END LOOP;
END \$\$;
" 2>/dev/null || true

cleanup() {
  echo "[$(date -u +%FT%TZ)] Cleaning up staging table if it exists..."
  $PSQL -c "DROP TABLE IF EXISTS $STAGING;" 2>/dev/null || true
  rm -f "${STAGING_CSV:-}" 2>/dev/null || true
  if [[ -n "${LOG_ID:-}" ]]; then
    $PSQL -c "UPDATE off_import_log SET status = 'failed', finished_at = NOW() WHERE id = $LOG_ID AND status = 'running';" 2>/dev/null || true
  fi
}
trap cleanup ERR

# --- 1. open audit log row ---
LOG_ID=$($PSQL -t -A -c "
  INSERT INTO off_import_log (parquet_file) VALUES ('$PARQUET_FILE') RETURNING id;
" | grep -E '^[0-9]+$' | tail -1)
echo "[$(date -u +%FT%TZ)] Import log id: $LOG_ID"

# --- 2. create staging table (no indexes - bulk load is faster without them) ---
$PSQL -c "CREATE UNLOGGED TABLE $STAGING (LIKE off_products INCLUDING DEFAULTS);"
echo "[$(date -u +%FT%TZ)] Staging table created: $STAGING"

# --- 3. stream DuckDB -> staging via COPY ---
#
# Schema differences in v2 OFF Parquet vs the flat format:
#   product_name     struct(lang, text)[] - extract English or first available
#   nutriments       struct(name, value, 100g, serving, unit)[] - all nutrients nested here
#   nutriscore_grade replaces nutrition_grade_fr
#   categories       replaces main_category
#   allergens_tags   varchar[] - convert to comma-separated text
#   traces_tags      varchar[] - convert to comma-separated text
#   image_small_url  not available in v2 - stored as NULL
#   obsolete         boolean - filter out discontinued products
#
# Nutrient name -> OFF struct name mapping (confirmed from DESCRIBE):
#   energy (kJ)      'energy'
#   energy (kcal)    'energy-kcal'  (separate entry, not a unit variant)
#   proteins         'proteins'
#   fat              'fat'
#   saturated fat    'saturated-fat'
#   trans fat        'trans-fat'
#   carbohydrates    'carbohydrates'
#   sugars           'sugars'
#   fiber            'fiber'
#   sodium           'sodium'
#   cholesterol      'cholesterol'
#   calcium          'calcium'
#   iron             'iron'
#   vitamins         'vitamin-a', 'vitamin-b1', ..., 'vitamin-k'
#   minerals         'potassium', 'magnesium', 'phosphorus', etc.
# DuckDB writes to a temp file rather than piping to STDOUT.
# COPY TO a file guarantees that fields containing embedded newlines are
# double-quoted; the streaming STDOUT path skips that quoting, which breaks
# PostgreSQL COPY when product names contain literal \n (e.g. Italian products).
# The explicit column list on the COPY command below excludes search_vec so
# positional matching is not sensitive to the staging table column order.
echo "[$(date -u +%FT%TZ)] Loading Parquet into staging CSV (${STAGING_CSV})..."
duckdb -c "
SET memory_limit='4GB';
SET threads=4;
-- NULL out values outside their physically-valid range (OFF dataset has encoding errors).
CREATE MACRO nut(v, hi) AS CASE WHEN v BETWEEN 0 AND hi THEN v END;
COPY (
  SELECT
    CASE
      WHEN TRY_CAST(trim(code) AS BIGINT) IS NOT NULL
       AND length(trim(code)) BETWEEN 8 AND 13
      THEN LPAD(trim(code), 13, '0')
      ELSE trim(code)
    END                                                                    AS code,

    replace(replace(replace(COALESCE(
      list_filter(product_name, lambda x: x.lang = 'en')[1].\"text\",
      product_name[1].\"text\"
    ), chr(0), ''), chr(10), ' '), chr(13), ' ')                           AS product_name,

    replace(replace(replace(COALESCE(brands,       ''), chr(0), ''), chr(10), ' '), chr(13), ' ') AS brands,
    replace(replace(replace(COALESCE(serving_size, ''), chr(0), ''), chr(10), ' '), chr(13), ' ') AS serving_size,

    TRY_CAST(
      regexp_extract(serving_size, '(\d+(?:\.\d+)?)\s*g', 1) AS DOUBLE
    )                                                                      AS serving_size_g,

    CASE WHEN lower(trim(nutriscore_grade)) IN ('a','b','c','d','e')
         THEN lower(trim(nutriscore_grade))
         ELSE NULL END                                                     AS nutrition_grade,

    replace(replace(replace(COALESCE(categories, ''), chr(0), ''), chr(10), ' '), chr(13), ' ') AS main_category,
    NULL                                                                   AS image_small_url,
    replace(replace(replace(array_to_string(allergens_tags, ','), chr(0), ''), chr(10), ' '), chr(13), ' ') AS allergens_tags,
    replace(replace(replace(array_to_string(traces_tags,   ','), chr(0), ''), chr(10), ' '), chr(13), ' ') AS traces_tags,

    nut(COALESCE(
      list_filter(nutriments, lambda x: x.\"name\" = 'energy-kcal')[1].\"100g\",
      list_filter(nutriments, lambda x: x.\"name\" = 'energy')[1].\"100g\" / 4.184
    ), 900)                                                                AS energy_kcal_100g,

    nut(list_filter(nutriments, lambda x: x.\"name\" = 'energy')[1].\"100g\",          3800) AS energy_kj_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'proteins')[1].\"100g\",         100) AS proteins_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'carbohydrates')[1].\"100g\",    100) AS carbohydrates_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'sugars')[1].\"100g\",           100) AS sugars_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'fat')[1].\"100g\",              100) AS fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'saturated-fat')[1].\"100g\",    100) AS saturated_fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'trans-fat')[1].\"100g\",        100) AS trans_fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'monounsaturated-fat')[1].\"100g\", 100) AS monounsaturated_fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'polyunsaturated-fat')[1].\"100g\", 100) AS polyunsaturated_fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'omega-3-fat')[1].\"100g\",      100) AS omega_3_fat_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'cholesterol')[1].\"100g\",        5) AS cholesterol_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'fiber')[1].\"100g\",            100) AS fiber_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'sodium')[1].\"100g\",           100) AS sodium_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'calcium')[1].\"100g\",           10) AS calcium_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'iron')[1].\"100g\",               1) AS iron_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'potassium')[1].\"100g\",         10) AS potassium_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'magnesium')[1].\"100g\",          5) AS magnesium_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'phosphorus')[1].\"100g\",         5) AS phosphorus_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'zinc')[1].\"100g\",               1) AS zinc_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'selenium')[1].\"100g\",        0.01) AS selenium_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'copper')[1].\"100g\",           0.1) AS copper_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'manganese')[1].\"100g\",          1) AS manganese_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'iodine')[1].\"100g\",          0.01) AS iodine_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-a')[1].\"100g\",       0.01) AS vitamin_a_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-b1')[1].\"100g\",       0.1) AS vitamin_b1_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-b2')[1].\"100g\",       0.1) AS vitamin_b2_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-b6')[1].\"100g\",       0.1) AS vitamin_b6_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-b9')[1].\"100g\",      0.01) AS vitamin_b9_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-b12')[1].\"100g\",    0.001) AS vitamin_b12_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-c')[1].\"100g\",         10) AS vitamin_c_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-d')[1].\"100g\",      0.001) AS vitamin_d_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-e')[1].\"100g\",          1) AS vitamin_e_100g,
    nut(list_filter(nutriments, lambda x: x.\"name\" = 'vitamin-k')[1].\"100g\",       0.01) AS vitamin_k_100g,

    to_timestamp(TRY_CAST(last_modified_t AS BIGINT))                     AS off_last_modified_at,
    NOW()                                                                  AS first_imported_at,
    NOW()                                                                  AS last_imported_at

  FROM read_parquet('$PARQUET_FILE')
  WHERE code IS NOT NULL AND trim(code) != ''
    AND (obsolete IS NULL OR obsolete = false)
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY code
    ORDER BY TRY_CAST(last_modified_t AS BIGINT) DESC NULLS LAST
  ) = 1
) TO '$STAGING_CSV' (FORMAT CSV, HEADER true);
"

echo "[$(date -u +%FT%TZ)] Loading staging CSV into PostgreSQL..."
$PSQL -c "\COPY $STAGING (code,product_name,brands,serving_size,serving_size_g,nutrition_grade,main_category,image_small_url,allergens_tags,traces_tags,energy_kcal_100g,energy_kj_100g,proteins_100g,carbohydrates_100g,sugars_100g,fat_100g,saturated_fat_100g,trans_fat_100g,monounsaturated_fat_100g,polyunsaturated_fat_100g,omega_3_fat_100g,cholesterol_100g,fiber_100g,sodium_100g,calcium_100g,iron_100g,potassium_100g,magnesium_100g,phosphorus_100g,zinc_100g,selenium_100g,copper_100g,manganese_100g,iodine_100g,vitamin_a_100g,vitamin_b1_100g,vitamin_b2_100g,vitamin_b6_100g,vitamin_b9_100g,vitamin_b12_100g,vitamin_c_100g,vitamin_d_100g,vitamin_e_100g,vitamin_k_100g,off_last_modified_at,first_imported_at,last_imported_at) FROM '$STAGING_CSV' CSV HEADER"
rm -f "$STAGING_CSV"

STAGED=$($PSQL -t -A -c "SELECT COUNT(*) FROM $STAGING;" | grep -E '^[0-9]+$' | tail -1)
echo "[$(date -u +%FT%TZ)] Staged rows: $STAGED"

# --- 4. upsert inside a transaction ---
# COALESCE ensures we never overwrite good existing data with NULL from the new file.
# first_imported_at is always preserved from the original insert.
# off_last_modified_at takes the new value - it reflects the latest OFF editor change.
# Wrapped in BEGIN/COMMIT so a crash mid-upsert rolls back cleanly.
echo "[$(date -u +%FT%TZ)] Upserting into off_products..."
$PSQL -c "
BEGIN;
INSERT INTO off_products
SELECT * FROM $STAGING
ON CONFLICT (code) DO UPDATE SET
  product_name              = EXCLUDED.product_name,
  brands                    = EXCLUDED.brands,
  serving_size              = COALESCE(EXCLUDED.serving_size,              off_products.serving_size),
  serving_size_g            = COALESCE(EXCLUDED.serving_size_g,            off_products.serving_size_g),
  nutrition_grade           = COALESCE(EXCLUDED.nutrition_grade,           off_products.nutrition_grade),
  main_category             = COALESCE(EXCLUDED.main_category,             off_products.main_category),
  image_small_url           = COALESCE(EXCLUDED.image_small_url,           off_products.image_small_url),
  allergens_tags            = COALESCE(EXCLUDED.allergens_tags,            off_products.allergens_tags),
  traces_tags               = COALESCE(EXCLUDED.traces_tags,               off_products.traces_tags),
  energy_kcal_100g          = COALESCE(EXCLUDED.energy_kcal_100g,          off_products.energy_kcal_100g),
  energy_kj_100g            = COALESCE(EXCLUDED.energy_kj_100g,            off_products.energy_kj_100g),
  proteins_100g             = COALESCE(EXCLUDED.proteins_100g,             off_products.proteins_100g),
  carbohydrates_100g        = COALESCE(EXCLUDED.carbohydrates_100g,        off_products.carbohydrates_100g),
  sugars_100g               = COALESCE(EXCLUDED.sugars_100g,               off_products.sugars_100g),
  fat_100g                  = COALESCE(EXCLUDED.fat_100g,                  off_products.fat_100g),
  saturated_fat_100g        = COALESCE(EXCLUDED.saturated_fat_100g,        off_products.saturated_fat_100g),
  trans_fat_100g            = COALESCE(EXCLUDED.trans_fat_100g,            off_products.trans_fat_100g),
  monounsaturated_fat_100g  = COALESCE(EXCLUDED.monounsaturated_fat_100g,  off_products.monounsaturated_fat_100g),
  polyunsaturated_fat_100g  = COALESCE(EXCLUDED.polyunsaturated_fat_100g,  off_products.polyunsaturated_fat_100g),
  omega_3_fat_100g          = COALESCE(EXCLUDED.omega_3_fat_100g,          off_products.omega_3_fat_100g),
  cholesterol_100g          = COALESCE(EXCLUDED.cholesterol_100g,          off_products.cholesterol_100g),
  fiber_100g                = COALESCE(EXCLUDED.fiber_100g,                off_products.fiber_100g),
  sodium_100g               = COALESCE(EXCLUDED.sodium_100g,               off_products.sodium_100g),
  calcium_100g              = COALESCE(EXCLUDED.calcium_100g,              off_products.calcium_100g),
  iron_100g                 = COALESCE(EXCLUDED.iron_100g,                 off_products.iron_100g),
  potassium_100g            = COALESCE(EXCLUDED.potassium_100g,            off_products.potassium_100g),
  magnesium_100g            = COALESCE(EXCLUDED.magnesium_100g,            off_products.magnesium_100g),
  phosphorus_100g           = COALESCE(EXCLUDED.phosphorus_100g,           off_products.phosphorus_100g),
  zinc_100g                 = COALESCE(EXCLUDED.zinc_100g,                 off_products.zinc_100g),
  selenium_100g             = COALESCE(EXCLUDED.selenium_100g,             off_products.selenium_100g),
  copper_100g               = COALESCE(EXCLUDED.copper_100g,               off_products.copper_100g),
  manganese_100g            = COALESCE(EXCLUDED.manganese_100g,            off_products.manganese_100g),
  iodine_100g               = COALESCE(EXCLUDED.iodine_100g,               off_products.iodine_100g),
  vitamin_a_100g            = COALESCE(EXCLUDED.vitamin_a_100g,            off_products.vitamin_a_100g),
  vitamin_b1_100g           = COALESCE(EXCLUDED.vitamin_b1_100g,           off_products.vitamin_b1_100g),
  vitamin_b2_100g           = COALESCE(EXCLUDED.vitamin_b2_100g,           off_products.vitamin_b2_100g),
  vitamin_b6_100g           = COALESCE(EXCLUDED.vitamin_b6_100g,           off_products.vitamin_b6_100g),
  vitamin_b9_100g           = COALESCE(EXCLUDED.vitamin_b9_100g,           off_products.vitamin_b9_100g),
  vitamin_b12_100g          = COALESCE(EXCLUDED.vitamin_b12_100g,          off_products.vitamin_b12_100g),
  vitamin_c_100g            = COALESCE(EXCLUDED.vitamin_c_100g,            off_products.vitamin_c_100g),
  vitamin_d_100g            = COALESCE(EXCLUDED.vitamin_d_100g,            off_products.vitamin_d_100g),
  vitamin_e_100g            = COALESCE(EXCLUDED.vitamin_e_100g,            off_products.vitamin_e_100g),
  vitamin_k_100g            = COALESCE(EXCLUDED.vitamin_k_100g,            off_products.vitamin_k_100g),
  off_last_modified_at      = EXCLUDED.off_last_modified_at,
  first_imported_at         = off_products.first_imported_at,
  last_imported_at          = NOW();
COMMIT;
"

# reclaim dead tuples created by the upsert (ON CONFLICT DO UPDATE marks old versions dead)
echo "[$(date -u +%FT%TZ)] Running VACUUM ANALYZE..."
$PSQL -c "VACUUM ANALYZE off_products;"

# --- 5. collect stats and close audit log ---
TOTAL=$($PSQL -t -A -c "SELECT COUNT(*) FROM off_products;" | grep -E '^[0-9]+$' | tail -1)
$PSQL -c "
UPDATE off_import_log SET
  finished_at   = NOW(),
  rows_total    = $TOTAL,
  rows_staged   = $STAGED,
  status        = 'done'
WHERE id = $LOG_ID;
"

# --- 6. drop staging ---
$PSQL -c "DROP TABLE $STAGING;"

echo "[$(date -u +%FT%TZ)] Done. Total rows: $TOTAL. Log id: $LOG_ID"

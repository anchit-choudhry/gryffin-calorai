# Open Food Facts Import

Runbook for loading the OFF Parquet dataset into PostgreSQL and keeping it current.
The database table, REST endpoints, and frontend integration are already implemented -
this document covers data operations only.

---

## First-time setup

Follow these steps once on a fresh environment. After that, see [Monthly refresh].

### Step 1 - Install DuckDB

The import script uses DuckDB to transform the Parquet file before loading PostgreSQL.

```bash
brew install duckdb   # macOS
duckdb --version      # verify
```

On Linux, download the CLI binary from the [DuckDB releases page].

[DuckDB releases page]: https://github.com/duckdb/duckdb/releases/latest

### Step 2 - Download the OFF Parquet file

Get the latest Open Food Facts export from the OFF data exports page. The file is
roughly 3-4 GB compressed. The script targets the **v2 format** where nutrients are
in a nested `nutriments` struct array.

To verify the file format before importing:

```bash
duckdb -c "SELECT column_name, column_type \
  FROM (DESCRIBE SELECT * FROM read_parquet('path/to/off.parquet') LIMIT 0) \
  ORDER BY column_name;"
```

You should see a `nutriments` column of struct array type and a `product_name` column
of struct array type (multilingual). If you see flat columns like `energy-kcal_100g`,
you have a v1 file - download a newer export.

### Step 3 - Start PostgreSQL

From `apps/backend/`:

```bash
docker compose up -d postgres
docker compose ps   # wait until postgres shows "healthy"
```

### Step 4 - Apply the database migration

Start the backend once so Flyway applies `V22__off_food_database.sql` automatically:

```bash
docker compose up -d backend
docker compose logs -f backend   # watch for "Started GryffinCaloraiApplication"
```

The migration creates the `off_products` table, FTS trigger, GIN index, and
`off_import_log` audit table. Stop here if you see migration errors - they must
be resolved before importing data.

### Step 5 - Run the first import

Source `.env` so the DB credentials are available, then run the import script:

```bash
set -a && source .env && set +a
bash scripts/refresh-off-products.sh /path/to/off.parquet
```

Expected duration: **5-15 minutes** for ~4.5M rows, depending on disk speed.

The script prints timestamped progress. A successful run ends with:

```
[...Z] Done. Total rows: 4XXXXXX. Log id: 1
```

### Step 6 - Verify the import

```bash
# Row count (expect 3-5M)
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT COUNT(*) FROM off_products;"

# Spot-check a known barcode
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT code, product_name, energy_kcal_100g, proteins_100g, fat_100g \
      FROM off_products WHERE code = '0048151623426';"

# Confirm full-text search works
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT code, product_name, brands FROM off_products \
      WHERE search_vec @@ plainto_tsquery('simple', unaccent('greek yogurt')) \
      LIMIT 5;"

# Table size on disk
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT pg_size_pretty(pg_total_relation_size('off_products'));"

# Import audit log
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT id, started_at, finished_at, rows_staged, rows_total, status \
      FROM off_import_log ORDER BY id DESC LIMIT 5;"
```

---

## Monthly refresh

OFF publishes updated exports monthly. The refresh is identical to the first import -
the same script runs an upsert, so no rows are deleted and existing good data is
preserved when the new file has NULLs.

### Option A - Run manually

```bash
# from apps/backend/
set -a && source .env && set +a
bash scripts/refresh-off-products.sh /path/to/new-off.parquet
```

### Option B - Automate with cron

Use `scripts/cron-refresh-off.sh`, which sources `.env` automatically and writes
timestamped output to a rolling monthly log file.

```bash
crontab -e

# Run on the 1st of every month at 02:00 UTC
0 2 1 * * /absolute/path/to/apps/backend/scripts/cron-refresh-off.sh \
  /data/off/off-latest.parquet >> /var/log/off-refresh/cron.log 2>&1
```

Override the log directory by setting `OFF_LOG_DIR` in the environment or in `.env`.

The script is idempotent - running it twice on the same file is safe.

### After a refresh - check for stale rows

Products removed from the OFF dataset are not deleted; their `last_imported_at` stops
updating. Use this to find rows not seen in the latest file:

```bash
psql -h localhost -p 5432 -U gcalorai -d gcalorai \
  -c "SELECT COUNT(*) FROM off_products \
      WHERE last_imported_at < NOW() - INTERVAL '60 days';"
```

---

## Reference

### What the import script does

`scripts/refresh-off-products.sh` runs the full Parquet-to-PostgreSQL pipeline:

1. Checks prerequisites (DuckDB, psql, Parquet file, 5GB free in `/tmp`)
2. Drops any orphaned staging tables from previously killed runs
3. Opens an audit row in `off_import_log`
4. Runs DuckDB to transform the Parquet file into a staging CSV:
  - Deduplicates by `code` (latest `last_modified_t` wins)
  - Zero-pads numeric EAN-8/13 codes to 13 digits
  - Extracts English product name from the multilingual struct
  - Extracts nutrient values from the nested `nutriments` struct array
  - Null-outs values outside physically valid ranges
  - Strips NUL bytes, embedded newlines, carriage returns from text fields
5. Loads the CSV into an unlogged staging table (no WAL = ~30% faster)
6. Upserts staging into `off_products` inside `BEGIN/COMMIT`
7. Runs `VACUUM ANALYZE`
8. Closes the audit row as `done`
9. Drops the staging table

On any error, `trap cleanup ERR` marks the audit row `failed`, drops staging, and
exits non-zero.

### COALESCE upsert strategy

| Scenario                                      | Behavior                                     |
|-----------------------------------------------|----------------------------------------------|
| Product exists; new file has a value          | New value overwrites                         |
| Product exists; new file has NULL for a field | Existing value is kept                       |
| Product is new in this file                   | Inserted; `first_imported_at` set to `NOW()` |
| Product absent from this file                 | Row stays; `last_imported_at` unchanged      |

`product_name` and `brands` always take the new value (no COALESCE) because these are
the most likely fields to be corrected by the OFF community.

### Schema decisions

- **`code TEXT PRIMARY KEY`** - no length cap; some OFF codes exceed 20 characters
- **`DOUBLE PRECISION`** for all nutrients - matches the Parquet `DOUBLE` type; avoids
  `NUMERIC` cast overhead across 35+ columns per row
- **Stored `search_vec TSVECTOR`** updated by a `BEFORE INSERT OR UPDATE` trigger; the
  GIN index targets the column directly, sidestepping the `unaccent()` STABLE/IMMUTABLE
  restriction that applies to functional expression indexes
- **Per-column CHECK constraints** cap each nutrient to its physically valid range,
  rejecting the encoding errors common in OFF community data before they reach the
  application layer

### API endpoints

All endpoints require a valid JWT (`Authorization: Bearer <token>`).

| Method | Path                                      | Description                              |
|--------|-------------------------------------------|------------------------------------------|
| `GET`  | `/v1/off-products/barcode/{code}`         | Exact barcode lookup; code is normalized |
| `GET`  | `/v1/off-products/search?q=...&limit=...` | FTS by name/brand; limit 1-50            |

The barcode endpoint applies the same normalization as the import script (numeric
EAN-8/13 codes are zero-padded to 13 digits) so a raw scanner result always matches.

Test with Swagger UI at `http://localhost:8080/gryffin/calorai/api/swagger-ui/index.html`
under the "OFF Products" tag (requires `SWAGGER_ENABLED=true` in `.env`).

---

**Last Updated:** June 20, 2026 | Feature: Food DB + Barcode Lookup (v0.17.0)

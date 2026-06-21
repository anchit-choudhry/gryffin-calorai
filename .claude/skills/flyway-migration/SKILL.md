---
name: flyway-migration
description: Scaffold a new Flyway SQL migration for the Gryffin Calorai backend.
  Pass a short snake_case description as the argument (e.g. "add_reminder_table").
  Reads the current highest V-number from db/migration/, generates the correctly
  named .sql file following V21/V22 conventions, and optionally scaffolds the
  matching Spring Boot entity, repository, service, controller, and DTO stubs.
disable-model-invocation: true
---

# Flyway Migration Scaffolder

You are scaffolding a new Flyway SQL migration for the Gryffin Calorai Spring Boot backend.

**STOP before starting:** Flyway migrations are irreversible once applied to a database. A
migration file's name and content should never change after it has been run in any environment.

## Step 1 - Determine the next V-number

Run:

```bash
ls apps/backend/src/main/resources/db/migration/V*.sql | \
  grep -oP 'V\K[0-9]+' | sort -n | tail -1
```

The new migration version is that number + 1. If the argument already contains a V-number
(e.g. the user said "V23"), use that; otherwise compute it.

Form the filename: `V{N}__{arg}.sql` where `{arg}` is the snake_case description the user
passed. Example: `V23__add_reminder_table.sql`

## Step 2 - Ask clarifying questions

Ask the user:

1. **What tables are being created or altered?** (new table / add column / add index / drop)
2. **For new tables:** What are the key columns and their types?
  - Text fields: use `TEXT` (not `VARCHAR(n)` unless a length limit is meaningful)
  - Timestamps: use `TIMESTAMPTZ NOT NULL DEFAULT NOW()` for audit columns
  - Numeric nutrients/measurements: use `DOUBLE PRECISION` (not `NUMERIC`) - matches Parquet
    DOUBLE, avoids cast overhead
  - IDs referencing `app_users(id)`: `UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE`
  - Auto-generated PKs: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
3. **Full-text search needed?** If yes, use the stored tsvector + trigger pattern (see V22), NOT
   a functional expression index (unaccent() is STABLE, not IMMUTABLE).
4. **Will any existing data rows be affected?** If yes, warn the user and ask how to handle
   backfill (UPDATE statement in the migration, or leave nullable and backfill later).
5. **Does a Spring Boot entity/repo/service/controller/DTO need to be created?** (yes/no)

## Step 3 - Generate the SQL migration file

Place the file at:
`apps/backend/src/main/resources/db/migration/V{N}__{description}.sql`

Follow the V21/V22 style exactly:

```sql
-- V{N}: <one-line description of what this migration does>
-- <Optional: second line explaining motivation or related feature>

-- -----------------------------------------------------------------------
-- <Table or section name>
-- -----------------------------------------------------------------------
CREATE TABLE <table_name> (
  -- identity
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

  -- <group name>
  <column>   TEXT,
  <column>   DOUBLE PRECISION CHECK (<column> >= 0),

  -- audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT uq_<table>_<unique_col> UNIQUE (user_id, <unique_col>)
);

CREATE INDEX idx_<table>_user_updated ON <table_name>(user_id, updated_at);
```

**If full-text search is needed**, add the stored tsvector pattern from V22:

```sql
-- Stored tsvector (unaccent() is STABLE not IMMUTABLE, so a functional
-- expression index is not possible - stored column + trigger sidesteps this)
ALTER TABLE <table_name> ADD COLUMN search_vec TSVECTOR;

CREATE OR REPLACE FUNCTION <table_name>_search_vec_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vec := to_tsvector('simple',
    unaccent(COALESCE(NEW.<name_col>, '')) || ' ' ||
    unaccent(COALESCE(NEW.<secondary_col>, ''))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER <table_name>_search_vec_trigger
  BEFORE INSERT OR UPDATE ON <table_name>
  FOR EACH ROW EXECUTE FUNCTION <table_name>_search_vec_update();

CREATE INDEX idx_<table_name>_search_vec ON <table_name> USING GIN (search_vec);
```

**If altering an existing table**, prefer adding nullable columns (safe for live data) over
`ALTER COLUMN` type changes (dangerous). Always add `CONCURRENTLY` to index creation on large
tables:

```sql
CREATE INDEX CONCURRENTLY idx_<table>_<col> ON <table>(<col>);
```

Note: `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. Flyway runs migrations
in transactions by default - set `spring.flyway.mixed=true` or use a separate non-transactional
migration file if needed.

## Step 4 - Scaffold Spring Boot files (if requested)

Use package `com.gryffin.calorai` and 2-space indentation throughout (Google Java Style).

### Entity (`entity/<EntityName>.java`)

```java
package com.gryffin.calorai.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable; // only if read-only like OffProduct

/** <One-sentence Javadoc describing the entity.> */
@Entity
@Table(name = "<table_name>")
public class <EntityName> {

  /** Primary key. */
  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  /** Foreign key to app_users. */
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  // ... other columns ...

  /** Audit timestamp set by DB default. */
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  /** Updated by @PreUpdate. */
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PreUpdate
  void touch() {
    this.updatedAt = Instant.now();
  }

  // getters/setters or use Lombok @Getter @Setter
}
```

### Repository (`repository/<EntityName>Repository.java`)

```java
package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.<EntityName>;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository for {@link <EntityName>}. */
public interface <EntityName>Repository extends JpaRepository<<EntityName>, UUID> {

  /**
   * Find all <entity> records for a user.
   *
   * @param userId the user ID
   * @return list of matching records
   */
  List<<EntityName>> findByUserId(UUID userId);
}
```

### DTO (`dto/<EntityName>Dto.java`) - Java record with @Schema

Follow the OffProductDto pattern: one blank line between logical groups, `@Schema` on every
field, full Javadoc on the record itself.

### Service and Controller

Follow the `OffProductService` / `OffProductController` pattern:

- Service: Javadoc on class and all public methods; returns `Optional<Dto>` for single lookups
- Controller: `@RestController`, `@RequestMapping`, `@Validated`; `@Operation` on each endpoint;
  JWT auth assumed via SecurityConfig (no per-method `@PreAuthorize` needed unless role-based)

## Step 5 - Verify Checkstyle compliance before finishing

Remind the user to run:

```bash
cd apps/backend
mvn checkstyle:checkstyle
```

Common traps:

- Record parameters need 4-space indent (2 levels x 2 spaces)
- Method bodies need 4-space indent for first level
- Continuation/builder chains need 6-space indent
- All public classes, records, interfaces, and methods need Javadoc
- Lines must be <= 100 characters; break `@Schema` annotations across multiple lines

## Step 6 - Confirm summary

Tell the user:

- Migration filename and V-number assigned
- Tables created or altered
- Whether FTS trigger was included
- Whether Spring Boot files were scaffolded and their paths
- Reminder: run `docker compose up -d` (or `mvn spring-boot:run`) to apply the migration;
  Flyway runs automatically on startup
- Reminder: if the OFF import or other external data pipeline is affected, update
  `apps/backend/OFF-IMPORT.md` to reflect schema changes

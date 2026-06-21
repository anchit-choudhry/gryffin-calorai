# Flyway Migration Skill

> Full migration instructions: `.claude/skills/flyway-migration/SKILL.md`

Follow the scaffold process documented in that file when adding a new Flyway SQL migration for
the Spring Boot backend.

**STOP before starting:** Flyway migrations are irreversible once applied. A migration file's
name and content must never change after it has run in any environment.

## Current state

- Migrations directory: `apps/backend/src/main/resources/db/migration/`
- Current highest version: **V22** (OFF products full-text search baseline)

## Determine next version

```bash
ls apps/backend/src/main/resources/db/migration/V*.sql | \
  grep -oE 'V[0-9]+' | sort -t V -k2 -n | tail -1
```

New filename: `V{N+1}__{snake_case_description}.sql`

## Checklist

- [ ] Confirm version number is one higher than current max
- [ ] Use `IF NOT EXISTS` / `IF EXISTS` guards for all DDL
- [ ] Add indices for every foreign key column
- [ ] For large tables: use `CONCURRENTLY` on new indices to avoid table locks
- [ ] Run `mvn clean install` after creating the file; Checkstyle + Flyway validate at build time

## Quick commands

```bash
cd apps/backend
mvn clean install      # validates migration + runs Checkstyle
docker compose up -d   # apply migration against local PostgreSQL
```

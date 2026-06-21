# Dexie Migration Skill

> Full migration instructions: `.claude/skills/dexie-migration/SKILL.md`

Follow the migration process documented in that file when bumping the Dexie IndexedDB schema
version in `apps/web/src/db/dbService.ts`.

**STOP before starting:** IndexedDB migrations are irreversible in production. A version number
that has shipped can never be reused.

## Current schema

- File: `apps/web/src/db/dbService.ts`
- Current version: **v20** (cloud sync + photos baseline)
- Version constant: `DB_SCHEMA_VERSION`

## Checklist

- [ ] Read `dbService.ts` to find the current highest `db.version(N)` call
- [ ] Determine if an upgrade callback is needed (required when backfilling existing rows)
- [ ] Add new `db.version(N+1).stores({...})` block - copy ALL previous stores, not just the
  changed one
- [ ] Update TypeScript interface for any new fields
- [ ] Update `DB_SCHEMA_VERSION` constant
- [ ] Add a paired test covering the new schema path

## Quick commands

```bash
pnpm test --watch   # verify migration tests pass
pnpm build          # confirm build succeeds with new schema
```

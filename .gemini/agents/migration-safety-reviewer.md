---
name: migration-safety-reviewer
description: Review new Flyway SQL migrations and Dexie schema changes for data
  safety. Checks for breaking column changes, missing indices on FK columns,
  ALTER TABLE on large tables without CONCURRENTLY, unsafe COALESCE patterns,
  and missing Dexie upgrade callbacks. Use before committing any
  db/migration/*.sql or dbService.ts change.
---

> Full agent instructions: `.claude/agents/migration-safety-reviewer.md`

Follow the complete checklist and instructions documented in that file.

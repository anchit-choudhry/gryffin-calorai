---
name: flyway-migration
description: Scaffold a new Flyway SQL migration for the Gryffin Calorai backend.
  Pass a short snake_case description as the argument (e.g. "add_reminder_table").
  Reads the current highest V-number from db/migration/, generates the correctly
  named .sql file following V21/V22 conventions, and optionally scaffolds the
  matching Spring Boot entity, repository, service, controller, and DTO stubs.
disable-model-invocation: true
---

> Full skill instructions: `.claude/skills/flyway-migration/SKILL.md`

Follow the complete instructions documented in that file.

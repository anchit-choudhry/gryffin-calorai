---
name: backend-code-reviewer
description: Review recently changed Java files in apps/backend/ for Checkstyle
  compliance, Javadoc completeness, Spring Boot patterns (missing @Validated,
  unvalidated query params, @Immutable misuse), and DTO @Schema coverage.
  Use after implementing a new backend endpoint, entity, or DTO. Reports issues
  grouped by severity - does not modify any files.
---

> Full agent instructions: `.claude/agents/backend-code-reviewer.md`

Follow the complete checklist and instructions documented in that file.

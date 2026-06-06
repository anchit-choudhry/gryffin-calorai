---
applyTo: "apps/backend/src/**/*.java"
---

# Backend Instructions

> Full Checkstyle rules and examples: `.claude/rules/backend.md`

Apply the Google Java Style rules documented in that file to all Java files in `apps/backend/`.

Key rules:

- **Javadoc** on all public classes, records, interfaces, and public methods
- **2-space indentation** per level (4 spaces = class members, 6 spaces = continuations)
- **Line length** max 100 characters; break long `@Schema` annotations across lines
- **camelCase** method names; no underscores in test method names
- Run `make be-build` (or `mvn clean install`) before committing - Checkstyle runs at validate phase
- Run `make be-check` for a report-only check without failing the build

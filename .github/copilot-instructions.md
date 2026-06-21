# Gryffin Calorai - Copilot Instructions

> **Full project context, stack, conventions, and critical file locations:** `CLAUDE.md`
> **Roadmap and DB schema history:** `ROADMAP.md`

This file contains the non-negotiable rules Copilot must apply at all times. Read `CLAUDE.md`
for architecture details, the full file location table, and quick commands.

---

## Stack (quick ref)

React 19 + Vite 8 + TypeScript 6 (strict) | Zustand 5 | Dexie.js 4 (schema v20) | Tailwind CSS 4
(dark mode: class-based) | shadcn/ui (Radix UI) | react-hook-form 7 + zod/v3 | Vitest 4 + jsdom |
Recharts 3 | motion 12 (`motion/react`) | sonner | lucide-react | Spring Boot 4.0 + PostgreSQL 18

---

## Non-negotiable rules

- **Tailwind only** - no inline styles, no CSS modules
- **Branded TypeScript IDs** for all entity keys: `UserId`, `FoodItemId`, `RecipeId`,
  `WaterLogId`, `BodyMeasurementId`, `UserAchievementId`, `StepLogId`, `ActivityLogId`,
  `FastingSessionId`, `ISODate` (from `src/types/index.ts`)
- **All state in Zustand** (`src/state/AppState.ts`) - no local component state except forms
- **IndexedDB queries must use indices** - never full-table scans; use `[userId+dateLogged]` pattern
- **No router library** - hash-based navigation via `window.location.hash` + `React.lazy` +
  `Suspense`
- **Never `import React from "react"`** - use named imports (`import { useState } from "react"`)
  and `import type` for type-only imports
- **Heavy components must be lazy-loaded** with `React.lazy` + `Suspense`
- **Never add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`** - fix the underlying issue
- **Every new feature needs a `.test.ts` file** targeting >80% coverage
- **`EDITORIAL_INPUT_CLS`** from `src/lib/utils.ts` on all `<Input>` components
- **Run `pnpm lint:fix` before commits**; commit format: `<type>(<scope>): <subject>`
- **Do NOT suggest or make git commits** - the user manages commits themselves

## Naming conventions

| Kind            | Convention       | Example              |
|-----------------|------------------|----------------------|
| Components      | PascalCase       | `FoodLogger.tsx`     |
| Hooks/functions | camelCase        | `useFoodForm()`      |
| Types           | PascalCase       | `FoodItem`, `UserId` |
| Constants       | UPPER_SNAKE_CASE | `DB_SCHEMA_VERSION`  |
| Folders         | kebab-case       | `src/hooks/`         |

---

## Specialized instructions

| Topic                        | File                                                        |
|------------------------------|-------------------------------------------------------------|
| React / frontend             | `.github/instructions/frontend.instructions.md`             |
| TypeScript                   | `.github/instructions/typescript.instructions.md`           |
| Testing / TDD                | `.github/instructions/testing.instructions.md`              |
| Backend (Java/Spring)        | `.github/instructions/backend.instructions.md`              |
| UX and design system         | `.github/instructions/ux-principles.instructions.md`        |
| HTML/CSS style               | `.github/instructions/html-css.instructions.md`             |
| Markdown style               | `.github/instructions/markdown.instructions.md`             |
| Security review              | `.github/agents/security-reviewer.agent.md`                 |
| React expert agent           | `.github/agents/react-expert.agent.md`                      |
| Generate tests skill         | `.github/skills/generate-tests/SKILL.md`                    |
| Webapp testing skill         | `.github/skills/webapp-testing/SKILL.md`                    |
| Update dependencies          | `.github/skills/update-dependencies/SKILL.md`               |
| Scaffold React component     | `.github/skills/scaffold-new-react-component/SKILL.md`      |
| Scaffold React hook          | `.github/skills/scaffold-new-react-hook/SKILL.md`           |
| Scaffold Zustand slice       | `.github/skills/scaffold-zustand-slice/SKILL.md`            |
| Scaffold backend endpoint    | `.github/skills/scaffold-backend/SKILL.md`                  |
| Dexie schema migration       | `.github/skills/dexie-migration/SKILL.md`                   |
| Flyway SQL migration         | `.github/skills/flyway-migration/SKILL.md`                  |
| Extract specifications       | `.github/prompts/extract-specifications/PROMPT.md`          |
| Code review                  | `.github/prompts/code-review/PROMPT.md`                     |

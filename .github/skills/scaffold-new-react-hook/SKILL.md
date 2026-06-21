# Scaffold New React Hook Skill

> Full scaffold instructions: `.claude/skills/scaffold-new-react-hook/SKILL.md`
> React standards: `.claude/skills/reactjs-standards/SKILL.md`

Follow the scaffold process documented in those files to generate a new custom hook and its paired
test file.

## Two hook variants

| Variant | Use when | Examples |
|---|---|---|
| **Form hook** | Wraps a user-facing form with submission and validation | `useWaterForm`, `useFoodForm` |
| **Data hook** | Reads/transforms Zustand or Dexie state for a component | `useProgressData`, `useWeeklyHarvest` |

## Placement and naming

- File: `apps/web/src/hooks/use<Name>.ts`
- Test: `apps/web/src/hooks/use<Name>.test.ts`
- Hook name must start with `use` in camelCase

## Required conventions

- Named export only
- No local component state - read from Zustand via `useAppState` or Dexie via `dbService`
- Form hooks: use `react-hook-form` + zod schema from `src/forms/schemas.ts`
- Data hooks: return memoized derived values; avoid re-deriving on every render

## Quick commands

```bash
pnpm test --watch   # run tests in watch mode while building
pnpm lint:fix       # run after generating
```

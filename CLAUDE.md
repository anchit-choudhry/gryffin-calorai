# Gryffin Calorai — System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai  
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and visualizing calorie progress.  
**Context:** MVP v0.0.2 (April 2026), client-side only, no backend dependency. Health-focused personal tool.

---

## Technical Stack & Conventions

**Tech Stack:**

- Frontend: React 19 + Vite 8 + TypeScript 6 (strict mode)
- State: Zustand 5 (single store)
- Database: IndexedDB via Dexie.js 4 (no backend)
- Styling: Tailwind CSS 4 (dark mode: class-based)
- Testing: Vitest 4 + jsdom + fake-indexeddb
- Charts: Chart.js 4 + react-chartjs-2

**Strict Rules:**

- ✅ Always use **Tailwind only** for styling; no inline styles or CSS modules
- ✅ Use **branded TypeScript types** for IDs (UserId, FoodItemId, RecipeId) to prevent mix-ups
- ✅ All state goes in **Zustand store** (`src/state/AppState.ts`); no local component state except forms
- ✅ **IndexedDB queries must use indices**; never scan full tables (`[userId+dateLogged]` pattern)
- ✅ Components must have **accompanying `.test.ts` files** with >80% coverage target
- ✅ All async operations include loading/error states in Zustand
- ✅ **No custom routing**; App.tsx uses conditional rendering for pages

**Naming Conventions:**

- Components: PascalCase (`FoodLogger.tsx`)
- Functions/hooks: camelCase (`useFoodForm()`)
- Types: PascalCase (`FoodItem`, `UserId`)
- Constants: UPPER_SNAKE_CASE (`DB_SCHEMA_VERSION`)
- Folders: kebab-case (`src/hooks/`, `src/db/`)

**Architecture:**

- **Entry:** `index.html` → `src/main.tsx` (ErrorBoundary wrapper) → `src/App.tsx` (conditional page rendering)
- **Folders:** `src/{pages,components,hooks,state,db,types,assets}`
- **Pages:** Dashboard, Recipes, Progress (in `src/pages/`)
- **Store:** Single Zustand instance with actions (`initUser`, `addFoodItem`, `createRecipe`, etc.)
- **DB:** Dexie.js tables (users, foodItems, recipes) with compound indices

---

## Workflow & Behavior Rules

**Testing (REQUIRED):**

- Write failing test first when fixing bugs; use Vitest with jsdom
- Run `pnpm test` before every commit; all tests must pass
- New features: add `.test.ts` alongside implementation
- Target: >80% coverage for state/db layer; component tests planned for v0.0.3

**Git & Commits:**

- Run `pnpm lint:fix` before every commit (ESLint + Prettier)
- Commit format: `<type>(<scope>): <subject>` (e.g., `feat(FoodLogger): add calorie validation`)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Atomic commits only; one logical change per commit
- Never force-push to main unless explicitly authorized

**Safety & Confirmation:**

- Ask for confirmation before deleting files, branches, or running destructive commands
- Ask before making breaking changes to types or database schema
- Error handling: Use ErrorBoundary for React errors; try/catch for async operations

**Communication:**

- Be concise; focus on code, not explanation
- In ambiguous situations, follow patterns in `src/state/AppState.ts` and `src/db/dbService.ts`
- When stuck, check existing tests for usage examples

---

## Key Documentation (Progressive Disclosure)

For architecture details, see @@specifications/gryffin-calorai-specifications.md  
For React patterns & best practices, see @@docs/REACT_STANDARDS_REVIEW.md  
For security guidelines, see @@docs/SECURITY_AUDIT.md and @@.claude/skills/owasp-security-audit/SKILL.md  
For release history & changes, see @@release-notes/0.0.2.md  
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category   | File                                                       | Key Info                                     |
|------------|------------------------------------------------------------|----------------------------------------------|
| **State**  | `src/state/AppState.ts`                                    | Single Zustand store; all mutations here     |
| **DB**     | `src/db/dbService.ts`                                      | Dexie schema, CRUD, indices                  |
| **Types**  | `src/types/index.ts`                                       | Branded types, type guards                   |
| **Pages**  | `src/pages/{Dashboard,Recipes,Progress}.tsx`               | Main views                                   |
| **Hooks**  | `src/hooks/{useFoodForm,useRecipeForm,useProgressData}.ts` | Form & data logic                            |
| **Tests**  | `src/**/*.test.ts`                                         | Vitest suites (14 total, 100% on core logic) |
| **Config** | `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`      | Build & test setup                           |

---

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm test             # Run all tests (once)
pnpm test --watch     # Watch mode
pnpm test --ui        # Interactive UI
pnpm lint:fix         # ESLint + Prettier
pnpm build            # Production build
```

---

## Known Constraints & Roadmap

**Implemented:** Database, food logging, recipe manager, progress charts, dark mode, ErrorBoundary, 14 tests, 11 CI/CD workflows  
**Placeholders:** Barcode scanner (needs camera API), multi-user auth, PWA, macro breakdown  
**Technical Debt:** Minimal component tests, no optimistic updates, recipe descriptions need sanitization

See @@release-notes/0.0.2.md for full v0.0.2 changelog.

---

**Last Updated:** April 26, 2026  
**Maintainer:** Anchit Choudhry

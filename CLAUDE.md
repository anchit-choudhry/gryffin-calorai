# Gryffin Calorai - System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai  
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and
visualizing calorie progress.  
**Context:** v0.1.0 (May 2026), client-side only, no backend dependency. Health-focused personal
tool.

---

## Technical Stack & Conventions

**Tech Stack:**

- Frontend: React 19 + Vite 8 + TypeScript 6 (strict mode)
- State: Zustand 5 (single store)
- Database: IndexedDB via Dexie.js 4 (no backend)
- Styling: Tailwind CSS 4 (dark mode: class-based) + shadcn/ui primitives (Radix UI)
- Forms: react-hook-form 7 + zod (imported via `zod/v3`) + @hookform/resolvers
- Testing: Vitest 4 + jsdom + fake-indexeddb
- Charts: Recharts 2
- Animation: motion 12 (`motion/react`)
- Toast: sonner (via `<Toaster />` in App.tsx)
- Icons: lucide-react

**Strict Rules:**

- ✅ Always use **Tailwind only** for styling; no inline styles or CSS modules
- ✅ Use **branded TypeScript types** for IDs (UserId, FoodItemId, RecipeId, WaterLogId,
  BodyMeasurementId, UserAchievementId, StepLogId, ISODate) to prevent mix-ups
- ✅ All state goes in **Zustand store** (`src/state/AppState.ts`); no local component state except
  forms
- ✅ **IndexedDB queries must use indices**; never scan full tables (`[userId+dateLogged]` pattern)
- ✅ Components must have **accompanying `.test.ts` files** with >80% coverage target
- ✅ All async operations include loading/error states in Zustand
- ✅ **No router library**; App.tsx uses hash-based navigation (`window.location.hash`) with
  `React.lazy` + `Suspense`
- ✅ **Never use `import React from "react"`**; use named imports (
  `import { useState } from "react"`) and `import type` for type-only imports (
  `import type { FC } from "react"`) - the automatic JSX transform makes the default import
  unnecessary
- ✅ **Heavy components must be lazy-loaded** with `React.lazy` + `Suspense`; `BarcodeScanner` (pulls
  in `@zxing`) is the primary example - wrapping it in `<Suspense>` keeps it out of the initial
  bundle
- ✅ **Never add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` comments**; fix the underlying
  type or lint issue properly instead

**Naming Conventions:**

- Components: PascalCase (`FoodLogger.tsx`)
- Functions/hooks: camelCase (`useFoodForm()`)
- Types: PascalCase (`FoodItem`, `UserId`)
- Constants: UPPER_SNAKE_CASE (`DB_SCHEMA_VERSION`)
- Folders: kebab-case (`src/hooks/`, `src/db/`)

**Architecture:**

- **Entry:** `index.html` → `src/main.tsx` (ErrorBoundary wrapper) → `src/App.tsx` (hash-based
  navigation + Suspense)
- **Folders:** `src/{pages,components,hooks,state,db,types}`
- **Pages:** Dashboard, Recipes, Progress (in `src/pages/`) - lazy-loaded via `React.lazy` +
  `Suspense`
- **Navigation:** Hash-based (`window.location.hash`); no router library; `PageLoading` used as
  Suspense fallback
- **Chunking:** `vite.config.ts` uses `build.rollupOptions.output.manualChunks` (function form,
  required by Rolldown/Vite 8) to split vendors - `vendor-react`, `vendor-charts` (recharts + d3),
  `vendor-barcode`, `vendor-db`, `vendor-icons`, `vendor-state`, `vendor-form` (rhf + zod),
  `vendor-motion`, `vendor-ui` (shadcn/Radix)
- **Store:** Single Zustand instance with actions for food logs, recipes, water logs, and body
  measurements.
- **DB:** Dexie.js tables with compound indices; currently at **schema version 9**
- **FoodItem fields:** `name`, `calories`, `servingSize`, `protein`, `carbs`, `fat`, `dateLogged`,
  `userId`, `isFavorite`, `mealType`
- **MealType:** `"Breakfast" | "Lunch" | "Snacks" | "Dinner"` (defined in `src/types/index.ts`)
- **Constants:** `DAILY_WATER_GOAL_ML = 2000`, `DAILY_STEP_GOAL = 10000` in `src/types/index.ts`
- **Unit helpers:** `kgToLb`, `lbToKg`, `cmToIn`, `inToCm`, `WEIGHT_UNITS`, `LENGTH_UNITS` in
  `src/types/index.ts`

---

## Workflow & Behavior Rules

**Testing (REQUIRED):**

- Write failing test first when fixing bugs; use Vitest with jsdom
- Run `pnpm test` before every commit; all tests must pass (includes coverage report)
- New features: add `.test.ts` alongside implementation
- Target: >80% coverage for state/db layer and UI components

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
- **Do NOT suggest or make git commits** - the user manages commits themselves

**Communication:**

- Be concise; focus on code, not explanation
- In ambiguous situations, follow patterns in `src/state/AppState.ts` and `src/db/dbService.ts`
- When stuck, check existing tests for usage examples
- Never use em-dashes (—); use a regular dash (-) instead

---

## Key Documentation (Progressive Disclosure)

For architecture details, see @@specifications/gryffin-calorai-specifications.md  
For React patterns & best practices, see @@docs/REACT_STANDARDS_REVIEW.md  
For security guidelines, see @@docs/SECURITY_AUDIT.md and
@@.claude/skills/owasp-security-audit/SKILL.md  
For release history & changes, see @@release-notes/0.1.0.md (current), @@release-notes/0.0.8.md,
@@release-notes/0.0.4.md, @@release-notes/0.0.3.md, and @@release-notes/0.0.2.md  
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category       | File                                                                                                                                                            | Key Info                                                |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| **State**      | `src/state/AppState.ts`                                                                                                                                         | Single Zustand store; all mutations here                |
| **DB**         | `src/db/dbService.ts`                                                                                                                                           | Dexie schema v9, CRUD, compound indices                 |
| **Types**      | `src/types/index.ts`                                                                                                                                            | Branded types, type guards, sanitizers, fuzzy match     |
| **Pages**      | `src/pages/{Dashboard,Recipes,Progress}.tsx`                                                                                                                    | Main views (lazy-loaded)                                |
| **Components** | `src/components/{ErrorBoundary,FoodLogger,VoiceFoodLogger,WaterTracker,StepTracker,BodyMeasurements,StreakCard,WeeklySummary}.tsx`                              | UI components; Voice, Water, Step, Body, Streak, Weekly |
| **Dashboard**  | `src/components/dashboard/{DashboardHero,DateKicker,EditorialFrame,LogEntry,MacroStat,SectionHeader}.tsx`                                                       | Dashboard sub-components                                |
| **Charts**     | `src/components/charts/{ChartLegend,ChartTooltip,EditorialChartCard}.tsx`                                                                                       | Shared chart primitives                                 |
| **Progress**   | `src/components/progress/ProgressHero.tsx`                                                                                                                      | Progress page hero section                              |
| **Recipes**    | `src/components/recipes/{IngredientRow,RecipeForm,RecipeList,RecipeRow,RecipesHero}.tsx`                                                                        | Recipe sub-components                                   |
| **Hooks**      | `src/hooks/{useFoodForm,useVoiceCapture,useWaterForm,useWaterHistoryData,useStepForm,useBodyForm,useStreaks,useProgressData,useRecipeForm,useWeeklySummary}.ts` | Core logic for logging, tracking, and chart data        |
| **Forms**      | `src/forms/schemas.ts`                                                                                                                                          | Zod schemas shared across form hooks                    |
| **Motion**     | `src/lib/motionVariants.ts`                                                                                                                                     | Shared `pageVariants` + `sectionVariants` for motion    |
| **Charts lib** | `src/lib/chartTheme.ts`                                                                                                                                         | Shared chart color theme / palette                      |
| **Tests**      | `src/**/*.test.{ts,tsx}` (24 test files)                                                                                                                        | Vitest + jsdom + fake-indexeddb + coverage              |
| **Config**     | `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`                                                                                                           | Build (with CSP) & test setup                           |

---

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm test             # Run all tests with coverage
pnpm test --watch     # Watch mode
pnpm test --ui        # Interactive UI
pnpm lint:fix         # ESLint + Prettier
pnpm build            # Production build
```

---

## Known Constraints & Roadmap

**Implemented (v0.0.1–v0.0.8):**

- Database (Dexie v4 schema v9), food logging with macros, recipe manager, water tracker, body measurements
- Voice food logging (Web Speech API) with fuzzy matching, barcode scanner + manual barcode entry
- Dark mode (class-based), ErrorBoundary, lazy-loading with Suspense, HTTP security headers (CSP)
- Code-split vendor chunks (react, charts, barcode, db, icons, state, form, motion, ui)
- shadcn/ui Dialog, Tabs, Form, Input, Button, Card, Tooltip primitives; all overlays use Dialog
  with focus trap + Esc close
- react-hook-form 7 + zod v3 validation on all form hooks; field-level errors via `<FormMessage />`
- motion 12 layout animations on log list with stagger; shared `pageVariants`/`sectionVariants` in
  `src/lib/motionVariants.ts`; sonner toasts; lucide-react icons
- Editorial design system (oklch color palette, @fontsource-variable typography, responsive grid
  layout)
- Refactored Dashboard with 5-section layout (Hero, Week, Pantry, Add to Log, Today's Log);
  logs grouped by meal type via `groupLogsByMeal()`
- 17 GitHub Actions workflows (including 6 Gemini workflows); OWASP/Security skills

**Implemented (v0.1.0 - New Major Features):**

- Step tracking (manual); `StepLog` entity, DB v9, `StepTracker` component, `useStepForm` hook
- Gamification achievement system; `UserAchievement` entity, DB v9, `evaluateAchievements` engine;
  20 achievements across streak, calorie, hydration, milestone, body, recipe categories
- `StreakCard` and `WeeklySummary` components with full hook implementations (`useStreaks`,
  `useWeeklySummary`) and comprehensive tests
- Complete Progress page overhaul: 7 sections with charts (calorie, macros, water, measurements, meal
  distribution, achievements, daily performance); 7/30-day toggle via ProgressHero
- Chart component library: ChartLegend, ChartTooltip, EditorialChartCard with centralized `chartTheme.ts`
  color palette and styling
- Mobile-first responsive navigation: bottom nav for mobile devices with icon-based UI
- Recipe sub-components extracted to `src/components/recipes/`; dashboard sub-components in
  `src/components/dashboard/`; progress components in `src/components/progress/`
- Comprehensive test coverage: 24+ test files, 9,000+ test lines; >80% coverage for state/db/components
- Enhanced hooks with full test coverage: `useBodyForm`, `useProgressData`, `useStreaks`,
  `useWaterHistoryData`, `useWaterForm`, `useWeeklySummary`, `useRecipeForm`
- Test files for schemas, utilities, types, achievements, and major components
- `src/lib/chartTheme.ts` for centralized chart theming; color constants for all visualizations
- Database schema v9 with compound indices for step and achievement lookups

**Still Pending / Placeholders:**

- Barcode → food lookup API integration (scanning + manual entry work; lookup not implemented)
- Body Measurements UI refresh (charts done, edit/delete UI pending)
- Achievement unlock animations and celebratory notifications
- Macro breakdown display for recipes (visual on recipe card + log entry)
- Multi-user auth, PWA / offline sync, data import/export
- Advanced filtering and search (date range, meal type, achievement filters)

**Technical Debt:** No optimistic updates, recipe descriptions need sanitization, WCAG 2.1 AAA
compliance pending, achievement animations/confetti placeholders

**v0.1.0 Roadmap (Completed):**

- [x] Step Tracking (Feature 5 - `StepLog` entity, `StepTracker` component, `useStepForm` hook)
- [x] Gamification achievement system (Feature 8 - `UserAchievement` entity, 20 achievements)
- [x] `StreakCard` + `WeeklySummary` components with complete hooks and full test coverage
- [x] Recipe sub-components extracted into `src/components/recipes/`
- [x] Progress page complete overhaul with 7 sections and ProgressHero component
- [x] Shared chart primitives in `src/components/charts/`; `chartTheme.ts` color palette
- [x] Mobile bottom navigation with responsive design
- [x] Comprehensive test coverage: 24+ test files, >80% for state/db/components

**v0.1.1+ Roadmap:**

- [ ] Macro nutrient breakdown display for recipes (visual on recipe card + log entry)
- [ ] Component test coverage >80% for remaining components (FoodLogger, WaterTracker, BodyMeasurements)
- [ ] Achievement unlock animations and celebratory notifications
- [ ] Advanced filtering and search (date range, meal type, achievement filters)
- [ ] Barcode → food lookup API integration (Open Food Facts or equivalent)
- [ ] Weekly/monthly data export functionality (PDF, CSV)
- [ ] Body Measurements UI refresh and enhanced visualization
- [ ] WCAG 2.1 AAA compliance audit and fixes
- [ ] Multi-user auth, PWA / offline sync, data import/export

---

**Last Updated:** May 17, 2026 (v0.1.0 release)  
**Maintainer:** Anchit Choudhry  
**Release:** v0.1.0 - Step Tracking, Gamification, Progress Overhaul, Test Infrastructure

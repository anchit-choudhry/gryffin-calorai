# Gryffin Calorai - System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai  
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and
visualizing calorie progress.  
**Context:** v0.6.0 (May 2026), client-side only, no backend dependency. Health-focused personal
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
  BodyMeasurementId, UserAchievementId, StepLogId, ActivityLogId, FastingSessionId, ISODate) to
  prevent mix-ups
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
- **DB:** Dexie.js tables with compound indices; currently at **schema version 17**
- **FoodItem fields:** `name`, `calories`, `servingSize`, `protein`, `carbs`, `fat`, `dateLogged`,
  `userId`, `isFavorite`, `mealType`
- **MealType:** `"Breakfast" | "Lunch" | "Snacks" | "Dinner"` (defined in `src/types/index.ts`)
- **Constants:** `DAILY_WATER_GOAL_ML = 2000`, `DAILY_STEP_GOAL = 10000`, `BACKUP_VERSION = 1` in
  `src/types/index.ts` / `src/db/dbService.ts`
- **Unit helpers:** `kgToLb`, `lbToKg`, `cmToIn`, `inToCm`, `WEIGHT_UNITS`, `LENGTH_UNITS` in
  `src/types/index.ts`
- **TDEE formula:** Mifflin-St Jeor BMR x activity factor = TDEE; goal offsets: -500 kcal (lose),
  0 (maintain), +300 kcal (gain). See `src/lib/tdee.ts`.
- **MET calorie formula:** `MET x weightKg x (durationMin / 60)` = kcal burned. ~60 activities in
  `src/lib/metTable.ts`.
- **Fasting presets:** 5 presets (12:12, 14:10, 16:8, 18:6, OMAD 20h) defined as `FASTING_PRESETS`
  in `src/types/index.ts`.
- **Domain types:** `Sex`, `ActivityLevel`, `GoalType` defined in `src/types/index.ts`.
- **Form input class:** Use `EDITORIAL_INPUT_CLS` from `src/lib/utils.ts` on all `<Input>`
  components for consistent styling.

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
- Never use en-dashes (–) or em-dashes (—); always use a regular dash (-) instead

---

## Key Documentation (Progressive Disclosure)

For architecture details, see @@specifications/gryffin-calorai-specifications.md  
For React patterns & best practices, see @@docs/REACT_STANDARDS_REVIEW.md  
For security guidelines, see @@docs/SECURITY_AUDIT.md and
@@.claude/skills/owasp-security-audit/SKILL.md  
For release history & changes, see @@release-notes/0.3.0.md (current), @@release-notes/0.2.0.md,
@@release-notes/0.1.0.md, @@release-notes/0.0.9.md,
@@release-notes/0.0.8.md, @@release-notes/0.0.4.md, @@release-notes/0.0.3.md, and
@@release-notes/0.0.2.md  
For roadmap, implemented history, and DB schema versions, see @@ROADMAP.md  
For pending TDD test plans (FoodLogger, WaterTracker, useKeyboardShortcuts, etc.), see @@new-tdd.md  
For UX/design system guidelines (color, spacing, motion, interaction, responsive), see @@UX-principles.md  
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category       | File                                                                                                                                                                                                                                                                           | Key Info                                                                     |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **State**      | `src/state/AppState.ts`                                                                                                                                                                                                                                                        | Single Zustand store; all mutations here                                     |
| **DB**         | `src/db/dbService.ts`                                                                                                                                                                                                                                                          | Dexie schema v17, CRUD, compound indices                                     |
| **Types**      | `src/types/index.ts`                                                                                                                                                                                                                                                           | Branded types, type guards, sanitizers, fuzzy match, FASTING_PRESETS, DietPreset, RestrictionFlag, getTodayDayIndex, checkFoodNameRestrictions, ReminderId, REMINDER_LABELS |
| **Pages**      | `src/pages/{Dashboard,Recipes,Progress,Settings}.tsx`                                                                                                                                                                                                                          | Main views (lazy-loaded); Settings at `#/settings`                           |
| **Components** | `src/components/{ErrorBoundary,FoodLogger,VoiceFoodLogger,WaterTracker,StepTracker,BodyMeasurements,StreakCard,WeeklySummary,KeyboardShortcutsOverlay,FastingTimer,ActivityLogger,ActivityTracker,OnboardingModal,OnboardingBanner,DataExportPanel,DietProfileEditor,RecurringMeals,RemindersSettings,MealTemplates}.tsx` | UI components incl. v0.6.0 additions                                  |
| **Settings**   | `src/components/settings/{TdeeProfilePanel,GoalSettings}.tsx`                                                                                                                                                                                                                  | Settings sub-components; TdeeProfilePanel is lazy-loaded                     |
| **Dashboard**  | `src/components/dashboard/{DashboardHero,DateKicker,EditorialFrame,LogEntry,MacroStat,SectionHeader}.tsx`                                                                                                                                                                      | Dashboard sub-components                                                     |
| **Tour**       | `src/components/tour/{ProductTourOverlay,CoachmarkCard,tourSteps,useSpotlightRect}.tsx/.ts`                                                                                                                                                                                    | Product tour system with spotlight and coachmarks                            |
| **Charts**     | `src/components/charts/{ChartLegend,ChartTooltip,EditorialChartCard}.tsx`                                                                                                                                                                                                      | Shared chart primitives                                                      |
| **Progress**   | `src/components/progress/ProgressHero.tsx`                                                                                                                                                                                                                                     | Progress page hero section                                                   |
| **Recipes**    | `src/components/recipes/{IngredientRow,RecipeForm,RecipeList,RecipeRow,RecipesHero}.tsx`                                                                                                                                                                                       | Recipe sub-components                                                        |
| **Hooks**      | `src/hooks/{useFoodForm,useVoiceCapture,useWaterForm,useWaterHistoryData,useStepForm,useBodyForm,useStreaks,useProgressData,useRecipeForm,useWeeklySummary,useKeyboardShortcuts,useFastingTimer,useActivityForm,useOnboarding,useDataExport,useDataImport,useRecipeImport,useDietProfile,useRecurringMealForm,useReminders}.ts` | Core logic; useFastingTimer uses date-fns differenceInSeconds + setInterval; useReminders schedules browser Notifications via setTimeout |
| **Forms**      | `src/forms/schemas.ts`                                                                                                                                                                                                                                                         | Zod schemas: food, recipe, water, step, body, TDEE profile, activity, backup, diet profile, recurring meal |
| **Motion**     | `src/lib/motionVariants.ts`                                                                                                                                                                                                                                                    | Shared page, section, coachmark, spotlight, arrow variants                   |
| **Charts lib** | `src/lib/chartTheme.ts`                                                                                                                                                                                                                                                        | Shared chart color theme / palette                                           |
| **TDEE lib**   | `src/lib/tdee.ts`                                                                                                                                                                                                                                                              | mifflinStJeorBMR, computeTDEE, computeCalorieGoal, computeMacroTargets       |
| **MET lib**    | `src/lib/metTable.ts`                                                                                                                                                                                                                                                          | ~60 activities with ACSM MET values for calorie burn calculation             |
| **Tests**      | `src/**/*.test.{ts,tsx}` (60+ test files, 1271+ tests)                                                                                                                                                                                                                         | Vitest + jsdom + fake-indexeddb + coverage                                   |
| **Config**     | `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`                                                                                                                                                                                                                          | Build (with CSP) & test setup                                                |

---

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm test             # Run all tests with coverage
pnpm test --watch     # Watch mode
pnpm test --ui        # Interactive UI
pnpm lint:fix         # ESLint + Prettier
pnpm audit            # Check for known CVEs (fails on high/critical)
pnpm build            # Production build
```

---

**Last Updated:** May 25, 2026 | **Current release:** v0.6.0 | **In progress:** v0.6.x (Features 12, 14)  
**Maintainer:** Anchit Choudhry

# Gryffin Calorai - System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai  
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and
visualizing calorie progress.  
**Context:** v0.7.0 (May 2026), full-stack: React frontend + Spring Boot backend (auth + PostgreSQL).
Health-focused personal tool. Database schema v18. Target: v1.0.0 with cloud sync and native mobile
apps (v0.8-v1.0).

---

## Technical Stack & Conventions

**Tech Stack:**

- Frontend: React 19 + Vite 8 + TypeScript 6 (strict mode)
- State: Zustand 5 (single store)
- Database: IndexedDB via Dexie.js 4 (frontend) + PostgreSQL 18 via Flyway (backend)
- Styling: Tailwind CSS 4 (dark mode: class-based) + shadcn/ui primitives (Radix UI)
- Forms: react-hook-form 7 + zod (imported via `zod/v3`) + @hookform/resolvers
- Testing: Vitest 4 + jsdom + fake-indexeddb
- Charts: Recharts 3
- Animation: motion 12 (`motion/react`)
- Toast: sonner (via `<Toaster />` in App.tsx)
- Icons: lucide-react

**Strict Rules:**

- ✅ Always use **Tailwind only** for styling; no inline styles or CSS modules
- ✅ Use **branded TypeScript types** for IDs (UserId, FoodItemId, RecipeId, WaterLogId,
  BodyMeasurementId, UserAchievementId, StepLogId, ActivityLogId, FastingSessionId, ISODate) to
  prevent mix-ups
- ✅ All state goes in **Zustand store** (`apps/web/src/state/AppState.ts`, composed from slices in
  `apps/web/src/state/slices/`); no local component state except forms
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
- Folders: kebab-case (`apps/web/src/hooks/`, `apps/web/src/db/`)

**Architecture:**

- **Entry:** `apps/web/index.html` → `apps/web/src/main.tsx` (ErrorBoundary wrapper) → `apps/web/src/App.tsx` (hash-based
  navigation + Suspense)
- **Folders:** `apps/web/src/{pages,components,hooks,state,db,types}`
- **Pages:** Dashboard, Recipes, Progress (in `apps/web/src/pages/`) - lazy-loaded via `React.lazy` +
  `Suspense`
- **Navigation:** Hash-based (`window.location.hash`); no router library; `PageLoading` used as
  Suspense fallback
- **Chunking:** `apps/web/vite.config.ts` uses `build.rollupOptions.output.manualChunks` (function form,
  required by Rolldown/Vite 8) to split vendors - `vendor-react`, `vendor-charts` (recharts + d3),
  `vendor-barcode`, `vendor-db`, `vendor-icons`, `vendor-state`, `vendor-form` (rhf + zod),
  `vendor-motion`, `vendor-ui` (shadcn/Radix)
- **Store:** Zustand store composed from 7 slices (`foodSlice`, `recipeSlice`, `bodySlice`,
  `activitySlice`, `trackerSlice`, `settingsSlice`, `coreSlice`) unified in `AppState.ts`.
- **DB:** Dexie.js tables with compound indices; currently at **schema version 18**
- **FoodItem fields:** `name`, `calories`, `servingSize`, `protein`, `carbs`, `fat`, `dateLogged`,
  `userId`, `isFavorite`, `mealType`
- **MealType:** `"Breakfast" | "Lunch" | "Snacks" | "Dinner"` (defined in `apps/web/src/types/index.ts`)
- **Constants:** `DAILY_WATER_GOAL_ML = 2000`, `DAILY_STEP_GOAL = 10000`, `BACKUP_VERSION = 1` in
  `apps/web/src/types/index.ts` / `apps/web/src/db/dbService.ts`
- **Unit helpers:** `kgToLb`, `lbToKg`, `cmToIn`, `inToCm`, `WEIGHT_UNITS`, `LENGTH_UNITS` in
  `apps/web/src/types/index.ts`
- **TDEE formula:** Mifflin-St Jeor BMR x activity factor = TDEE; goal offsets: -500 kcal (lose),
  0 (maintain), +300 kcal (gain). See `apps/web/src/lib/tdee.ts`.
- **MET calorie formula:** `MET x weightKg x (durationMin / 60)` = kcal burned. ~60 activities in
  `apps/web/src/lib/metTable.ts`.
- **Fasting presets:** 5 presets (12:12, 14:10, 16:8, 18:6, OMAD 20h) defined as `FASTING_PRESETS`
  in `apps/web/src/types/index.ts`.
- **Domain types:** `Sex`, `ActivityLevel`, `GoalType` defined in `apps/web/src/types/index.ts`.
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
- **Never add personal information to any files** - no email addresses, phone numbers, physical
  addresses, or PII

**Communication:**

- Be concise; focus on code, not explanation
- In ambiguous situations, follow patterns in `apps/web/src/state/AppState.ts` and `apps/web/src/db/dbService.ts`
- When stuck, check existing tests for usage examples
- Never use en-dashes (–) or em-dashes (—); always use a regular dash (-) instead

---

## Key Documentation (Progressive Disclosure)

For architecture details, see @@specifications/gryffin-calorai-specifications.md  
For React patterns & best practices, see @@docs/REACT_STANDARDS_REVIEW.md  
For security guidelines, see @@docs/SECURITY_AUDIT.md and
@@.claude/skills/owasp-security-audit/SKILL.md  
For release history & changes, see @@release-notes/0.7.0.md (current), @@release-notes/0.6.0.md,
@@release-notes/0.5.0.md, @@release-notes/0.4.0.md, @@release-notes/0.3.0.md,
@@release-notes/0.2.0.md, @@release-notes/0.1.0.md, and @@release-notes/0.0.9.md  
For roadmap, implemented history, and DB schema versions, see @@ROADMAP.md  
For pending TDD test plans (FoodLogger, WaterTracker, useKeyboardShortcuts, etc.), see
@@new-tdd.md  
For UX/design system guidelines (color, spacing, motion, interaction, responsive), see
@@UX-principles.md  
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category       | File                                                                                                                                                                                                                                                                                                                            | Key Info                                                                                                                                                                    |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **State**      | `apps/web/src/state/AppState.ts`                                                                                                                                                                                                                                                                                                | Single Zustand store; all mutations here                                                                                                                                    |
| **DB**         | `apps/web/src/db/dbService.ts`                                                                                                                                                                                                                                                                                                  | Dexie schema v18, CRUD, compound indices                                                                                                                                    |
| **Types**      | `apps/web/src/types/index.ts`                                                                                                                                                                                                                                                                                                   | Branded types, type guards, sanitizers, fuzzy match, FASTING_PRESETS, DietPreset, RestrictionFlag, getTodayDayIndex, checkFoodNameRestrictions, ReminderId, REMINDER_LABELS |
| **Pages**      | `apps/web/src/pages/{Dashboard,Recipes,Progress,Settings}.tsx`                                                                                                                                                                                                                                                                  | Main views (lazy-loaded); Settings at `#/settings`                                                                                                                          |
| **Components** | `apps/web/src/components/{ErrorBoundary,FoodLogger,VoiceFoodLogger,WaterTracker,StepTracker,BodyMeasurements,StreakCard,WeeklySummary,KeyboardShortcutsOverlay,FastingTimer,ActivityLogger,ActivityTracker,OnboardingModal,OnboardingBanner,DataExportPanel,DataImportConflictModal,DietProfileEditor,RecurringMeals,RemindersSettings,MealTemplates}.tsx` | UI components incl. v0.7.0 additions                                                                                                                                        |
| **Settings**   | `apps/web/src/components/settings/{TdeeProfilePanel,GoalSettings}.tsx`                                                                                                                                                                                                                                                          | Settings sub-components; TdeeProfilePanel is lazy-loaded                                                                                                                    |
| **Dashboard**  | `apps/web/src/components/dashboard/{DashboardHero,DateKicker,EditorialFrame,LogEntry,MacroStat,SectionHeader}.tsx`                                                                                                                                                                                                              | Dashboard sub-components                                                                                                                                                    |
| **Tour**       | `apps/web/src/components/tour/{ProductTourOverlay,CoachmarkCard,tourSteps,useSpotlightRect}.tsx/.ts`                                                                                                                                                                                                                            | Product tour system with spotlight and coachmarks                                                                                                                           |
| **Charts**     | `apps/web/src/components/charts/{ChartLegend,ChartTooltip,EditorialChartCard}.tsx`                                                                                                                                                                                                                                              | Shared chart primitives                                                                                                                                                     |
| **Progress**   | `apps/web/src/components/progress/{ProgressHero,MicronutrientPanel}.tsx`                                                                                                                                                                                                                                                        | Progress page hero + micronutrient panel                                                                                                                                    |
| **Recipes**    | `apps/web/src/components/recipes/{IngredientRow,RecipeForm,RecipeList,RecipeRow,RecipesHero}.tsx`                                                                                                                                                                                                                               | Recipe sub-components                                                                                                                                                       |
| **Hooks**      | `apps/web/src/hooks/{useFoodForm,useVoiceCapture,useWaterForm,useWaterHistoryData,useStepForm,useBodyForm,useStreaks,useProgressData,useRecipeForm,useWeeklySummary,useKeyboardShortcuts,useFastingTimer,useActivityForm,useOnboarding,useDataExport,useDataImport,useRecipeImport,useDietProfile,useRecurringMealForm,useReminders,useMicronutrientData}.ts` | Core logic; useFastingTimer uses date-fns differenceInSeconds + setInterval; useReminders schedules browser Notifications via setTimeout; useMicronutrientData queries nutrition DB |
| **Forms**      | `apps/web/src/forms/schemas.ts`                                                                                                                                                                                                                                                                                                 | Zod schemas: food, recipe, water, step, body, TDEE profile, activity, backup, diet profile, recurring meal                                                                  |
| **Motion**     | `apps/web/src/lib/motionVariants.ts`                                                                                                                                                                                                                                                                                            | Shared page, section, coachmark, spotlight, arrow variants                                                                                                                  |
| **Charts lib** | `apps/web/src/lib/chartTheme.ts`                                                                                                                                                                                                                                                                                                | Shared chart color theme / palette                                                                                                                                          |
| **TDEE lib**   | `apps/web/src/lib/tdee.ts`                                                                                                                                                                                                                                                                                                      | mifflinStJeorBMR, computeTDEE, computeCalorieGoal, computeMacroTargets                                                                                                      |
| **MET lib**    | `apps/web/src/lib/metTable.ts`                                                                                                                                                                                                                                                                                                  | ~60 activities with ACSM MET values for calorie burn calculation                                                                                                            |
| **Tests**      | `apps/web/src/**/*.test.{ts,tsx}` (76+ test files, 1600+ tests)                                                                                                                                                                                                                                                                 | Vitest + jsdom + fake-indexeddb + coverage                                                                                                                                  |
| **Config**     | `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/tsconfig.json`                                                                                                                                                                                                                                               | Build (with CSP) & test setup                                                                                                                                               |
| **Backend**    | `apps/backend/src/main/java/com/gryffin/calorai/`                                                                                                                                                                                                                                                                               | Spring Boot 4.0 + Java 25; entities, controllers, services, security                                                                                                        |
| **DB migrate** | `apps/backend/src/main/resources/db/migration/`                                                                                                                                                                                                                                                                                 | Flyway SQL migrations                                                                                                                                                        |
| **Codegen**    | `apps/backend/openapi-codegen/`                                                                                                                                                                                                                                                                                                  | OpenAPI generator configs + generate.sh for TS/Kotlin/Swift SDKs                                                                                                            |

---

## Quick Commands

### Frontend (run from repo root or `apps/web/`)

```bash
pnpm dev              # Start dev server at http://localhost:5173
pnpm test             # Run all tests with coverage
pnpm test --watch     # Watch mode
pnpm test --ui        # Interactive UI
pnpm lint:fix         # ESLint + Prettier
pnpm audit            # Check for known CVEs (fails on high/critical)
pnpm build            # Production build (outputs to apps/web/dist/)
```

### Backend (run from `apps/backend/`)

**Secret management (backend):** `apps/backend/.env` is gitignored - never commit it. All other
config files (`application.yml`, `docker-compose.yml`, `application-test.yml`) are safe to commit;
they contain no real secrets and read everything from environment variables via `${ENV_VAR}`
substitution. `docker compose up` fails with a clear error if `JWT_SECRET` is missing from `.env`.
The backend startup also rejects any known-placeholder JWT secret value.

**Option A - Docker Compose (recommended, includes PostgreSQL + PgAdmin):**

```bash
cd apps/backend
cp .env.example .env
# Set JWT_SECRET in .env: openssl rand -hex 32
# Set SWAGGER_ENABLED=true in .env to enable Swagger UI at /swagger-ui.html
docker compose up -d          # starts postgres:5432, pgadmin:5050, backend:8080
docker compose logs -f backend  # tail backend logs
docker compose down           # stop all services
```

**Option B - Maven only (requires a running PostgreSQL on port 5432):**

```bash
cd apps/backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/gcalorai
export DATABASE_USER=gcalorai
export DATABASE_PASSWORD=<your-password>
export JWT_SECRET=$(openssl rand -hex 32)   # must be a real random value
export GOOGLE_CLIENT_ID=your-google-client-id   # optional for auth
export CORS_ALLOWED_ORIGINS=http://localhost:5173
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui.html`
Health check: `http://localhost:8080/actuator/health`

### OpenAPI codegen (run from `apps/backend/openapi-codegen/`)

```bash
# 1. Ensure backend is running, then export the live spec:
curl http://localhost:8080/api-docs > ../api-docs/openapi.json

# 2. Regenerate all SDK clients:
cd apps/backend/openapi-codegen
npm i -g @openapitools/openapi-generator-cli   # one-time install
bash generate.sh
# Outputs:
#   TypeScript (axios): packages/api-sdk/typescript/
#   Kotlin (retrofit2): packages/api-sdk/kotlin/
#   Swift 5:            packages/api-sdk/swift/
```

---

**Last Updated:** May 25, 2026 | **Current release:** v0.7.0 | **In progress:** v0.8.0 (B4 Cloud Sync, B5 AI Photo Logging)  
**Maintainer:** Anchit Choudhry  
**GitHub:** https://github.com/anchit-choudhry/gryffin-calorai

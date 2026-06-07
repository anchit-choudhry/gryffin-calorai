# Gryffin Calorai - System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai  
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and
visualizing calorie progress.  
**Context:** v0.9.0 in progress (June 2026); v0.8.0 released June 7, 2026. Full-stack: React
frontend + Spring Boot backend (auth + PostgreSQL).
Health-focused personal tool. Database schema v20. Target: v1.0.0 with cloud sync and native mobile
apps (v0.9-v1.0).

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
  BodyMeasurementId, UserAchievementId, StepLogId, ActivityLogId, FastingSessionId, ISODate,
  FoodPhotoId) to prevent mix-ups
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

- **Entry:** `apps/web/index.html` → `apps/web/src/main.tsx` (ErrorBoundary wrapper) →
  `apps/web/src/App.tsx` (hash-based
  navigation + Suspense)
- **Folders:** `apps/web/src/{pages,components,hooks,state,db,types}`
- **Pages:** Dashboard, Recipes, Progress (in `apps/web/src/pages/`) - lazy-loaded via
  `React.lazy` +
  `Suspense`
- **Navigation:** Hash-based (`window.location.hash`); no router library; `PageLoading` used as
  Suspense fallback
- **Chunking:** `apps/web/vite.config.ts` uses `build.rollupOptions.output.manualChunks` (function
  form,
  required by Rolldown/Vite 8) to split vendors - `vendor-react`, `vendor-charts` (recharts + d3),
  `vendor-barcode`, `vendor-db`, `vendor-icons`, `vendor-state`, `vendor-form` (rhf + zod),
  `vendor-motion`, `vendor-ui` (shadcn/Radix)
- **Store:** Zustand store composed from 9 slices (`foodSlice`, `recipeSlice`, `bodySlice`,
  `activitySlice`, `trackerSlice`, `settingsSlice`, `coreSlice`, `syncSlice`, `uiSlice`) unified in
  `AppState.ts`.
- **DB:** Dexie.js tables with compound indices; currently at **schema version 20**
- **FoodItem fields:** `name`, `calories`, `servingSize`, `protein?`, `carbs?`, `fat?`,
  `dateLogged`, `userId`, `isFavorite`, `mealType`, `photoId?` (macros optional since WS E;
  render unset macros as "---" not "0"; photoId added WS F)
- **MealType:** `"Breakfast" | "Lunch" | "Snacks" | "Dinner"` (defined in
  `apps/web/src/types/index.ts`)
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
  components for consistent styling. Use `SERIF_TITLE_CLS` for section headings (three-voice
  typography: Spectral serif display, Manrope body, JetBrains Mono micro-labels).

---

## Workflow & Behavior Rules

**Testing (REQUIRED):**

- Write failing test first when fixing bugs; use Vitest with jsdom
- Run `pnpm test` before every commit; all tests must pass (includes coverage report)
- New features: add `.test.ts` alongside implementation
- Target: >80% coverage for state/db layer and UI components

**Git & Commits:**

- Run `pnpm lint:fix` before every commit (ESLint + Prettier)
- Run `pnpm build` after `pnpm lint:fix` before every commit; build must succeed with no errors
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
- In ambiguous situations, follow patterns in `apps/web/src/state/AppState.ts` and
  `apps/web/src/db/dbService.ts`
- When stuck, check existing tests for usage examples
- Never use en-dashes (–) or em-dashes (—); always use a regular dash (-) instead

**TypeScript Code Style - REQUIRED:**

- See @@.claude/rules/typescript.md for complete rules (Google TypeScript Style Guide)
- Named exports only; `import type` for type-only imports; no `any` (use `unknown`)
- Prefer string union types over enums; use `interface` for object shapes
- `const`/`let` only; arrow functions for callbacks; async/await over raw Promises

**HTML/CSS Code Style - REQUIRED:**

- See @@.claude/rules/html-css.md for complete rules (Google HTML/CSS Style Guide)
- Semantic HTML elements; `type="button"` on all non-submit buttons
- Tailwind only - no inline styles; use `cn()` for conditional classes; mobile-first
- All images need `alt`; icon-only buttons need `aria-label` or `sr-only` text

**Markdown Style - REQUIRED:**

- See @@.claude/rules/markdown.md for complete rules (Google Markdown Style Guide)
- 80-char line limit for prose; ATX headings only; fenced code blocks with language declared
- No HTML in Markdown; informative link titles; reference links for long URLs in tables

**Backend Code Style (Java) - REQUIRED:**

- See @@.claude/rules/backend.md for complete Checkstyle (Google Java Style) rules
- **Javadoc:** All public classes, records, and methods must have documentation (
  MissingJavadocType/Method)
- **Indentation:** 2 spaces = 1 indentation level (`.editorconfig: indent_size=2`,
  `google_checks.xml: basicOffset=2`); record parameters = 4 spaces, method bodies = 4+ spaces,
  continuations = 6+ spaces
- **Line Length:** Max 100 characters; break long annotations and method signatures across lines
- **Method Names:** No underscores in test method names; use camelCase throughout (pattern:
  `[a-z][a-z0-9]*(?:_[0-9]+)*`)
- **Before every backend commit:** Run `mvn clean install` to validate Checkstyle; **build fails**
  with violations (Google Java Style pass applied June 2026; run `make be-check` for current count)
- Remaining violation categories: indentation, Javadoc @param tags on records,
  LineLength, MethodName
- Checkstyle plugin (`maven-checkstyle-plugin` 3.6.0) runs at `validate` phase; no build without
  passing checks

---

## Key Documentation (Progressive Disclosure)

For persistent cross-session context (architecture decisions, preferences, plans, incidents), read
@@project-knowledge/AGENTS.md first, then @@project-knowledge/index.md - this wiki is the
canonical session-start artifact; update it at session end per the checklist in AGENTS.md.  
For architecture details, see @@docs/gryffin-calorai-specifications.md  
For security guidelines, see @@.claude/skills/owasp-security-audit/SKILL.md  
For release history & changes, see @@release-notes/0.8.0.md (released June 7, 2026),
@@release-notes/0.7.0.md (current stable), @@release-notes/0.6.0.md,
@@release-notes/0.5.0.md, @@release-notes/0.4.0.md, @@release-notes/0.3.0.md,
@@release-notes/0.2.0.md, @@release-notes/0.1.0.md, and @@release-notes/0.0.9.md  
For roadmap, implemented history, and DB schema versions, see @@ROADMAP.md  
For UX/design system guidelines (color, spacing, motion, interaction, responsive), see
@@UX-principles.md  
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category              | File                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Key Info                                                                                                                                                                                                        |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **State**             | `apps/web/src/state/AppState.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Single Zustand store; all mutations here                                                                                                                                                                        |
| **DB**                | `apps/web/src/db/dbService.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dexie schema v20, CRUD, compound indices; `syncQueue` table + `SyncQueueEntry`; `syncId` on 6 entity interfaces; `photos` table (`++id, userId, createdAt`) + `FoodPhotoId` branded type                        |
| **Types**             | `apps/web/src/types/index.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Branded types (incl. FoodPhotoId), type guards, sanitizers, fuzzy match, FASTING_PRESETS, DietPreset, RestrictionFlag, getTodayDayIndex, checkFoodNameRestrictions, ReminderId, REMINDER_LABELS                 |
| **Pages**             | `apps/web/src/pages/{Dashboard,Recipes,Progress,Settings}.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                               | Main views (lazy-loaded); Settings at `#/settings`                                                                                                                                                              |
| **Components**        | `apps/web/src/components/{ErrorBoundary,FoodLogger,VoiceFoodLogger,WaterTracker,StepTracker,BodyMeasurements,StreakCard,WeeklySummary,KeyboardShortcutsOverlay,FastingTimer,ActivityLogger,ActivityTracker,OnboardingModal,OnboardingBanner,DataExportPanel,DataImportConflictModal,DietProfileEditor,RecurringMeals,RemindersSettings,MealTemplates,CloudSyncPanel,SyncStatusChip,HarvestStamp,EmptyState,QuickAddModal,FoodSearchCombobox,PhotoFoodLogger,ProvenanceBadge,PhotoStrip}.tsx` | UI components incl. v0.7.0 + B4 + UI v2 + UX uplift WS A-F                                                                                                                                                      |
| **Illustrations**     | `apps/web/src/components/illustrations/{EmptyPlate,EmptyCup,BodyScale,Footsteps,RecipeBook,HarvestBasket}.tsx` + `index.ts`                                                                                                                                                                                                                                                                                                                                                                  | Stroke-only SVG React components for empty states; tree-shakeable                                                                                                                                               |
| **Almanac icons**     | `apps/web/src/components/icons/almanac/{WheatSprig,MoonPhase,SunRay,RuleCorner,SeasonalFlourish}.tsx` + `index.ts`                                                                                                                                                                                                                                                                                                                                                                           | SVG ornaments for section dividers and empty-state subjects                                                                                                                                                     |
| **Settings**          | `apps/web/src/components/settings/{TdeeProfilePanel,GoalSettings}.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                       | Settings sub-components; TdeeProfilePanel is lazy-loaded                                                                                                                                                        |
| **Dashboard**         | `apps/web/src/components/dashboard/{DashboardHero,DateKicker,EditorialFrame,LogEntry,MacroStat,SectionHeader,DailyVitalsStrip,RuleTicks}.tsx`                                                                                                                                                                                                                                                                                                                                                | Dashboard sub-components                                                                                                                                                                                        |
| **Tour**              | `apps/web/src/components/tour/{ProductTourOverlay,CoachmarkCard,tourSteps,useSpotlightRect}.tsx/.ts`                                                                                                                                                                                                                                                                                                                                                                                         | Product tour system with spotlight and coachmarks                                                                                                                                                               |
| **Charts**            | `apps/web/src/components/charts/{ChartLegend,ChartTooltip,EditorialChartCard}.tsx`                                                                                                                                                                                                                                                                                                                                                                                                           | Shared chart primitives                                                                                                                                                                                         |
| **Progress**          | `apps/web/src/components/progress/{ProgressHero,MicronutrientPanel}.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                     | Progress page hero + micronutrient panel                                                                                                                                                                        |
| **Recipes**           | `apps/web/src/components/recipes/{IngredientRow,RecipeForm,RecipeList,RecipeRow,RecipesHero}.tsx`                                                                                                                                                                                                                                                                                                                                                                                            | Recipe sub-components                                                                                                                                                                                           |
| **Hooks**             | `apps/web/src/hooks/{useFoodForm,useVoiceCapture,useWaterForm,useWaterHistoryData,useStepForm,useBodyForm,useStreaks,useProgressData,useRecipeForm,useWeeklySummary,useKeyboardShortcuts,useFastingTimer,useActivityForm,useOnboarding,useDataExport,useDataImport,useRecipeImport,useDietProfile,useRecurringMealForm,useReminders,useMicronutrientData,useMealTemplates,useBarcodeScanner,useSyncService}.ts`                                                                              | Core logic; useSyncService drives B4 bidirectional sync (pull + push queue flush); useFastingTimer uses date-fns differenceInSeconds + setInterval; useReminders schedules browser Notifications via setTimeout |
| **Forms**             | `apps/web/src/forms/schemas.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Zod schemas: food, recipe, water, step, body, TDEE profile, activity, backup, diet profile, recurring meal                                                                                                      |
| **Motion**            | `apps/web/src/lib/motionVariants.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Shared page, section, coachmark, spotlight, arrow variants; `useSectionMotion()` returns crossfade under reduced-motion                                                                                         |
| **a11y lib**          | `apps/web/src/lib/a11y.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `MAIN_CONTENT_ID`, `liveRegionProps`, `assertiveRegionProps`, `visuallyHiddenProps`, `useReducedMotion` re-export, `useMotionPreset(name)` for named crossfade alternatives                                     |
| **Anchor lib**        | `apps/web/src/lib/anchor.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | CSS anchor positioning helpers (`anchorName`, `positionAnchor`, `supportsAnchorPositioning`); Chrome 125+ forward-adoption pattern                                                                              |
| **Imagery lib**       | `apps/web/src/lib/imagery.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Typed Unsplash photo catalog by category; `ImageEntry` type with id, alt, crop                                                                                                                                  |
| **Charts lib**        | `apps/web/src/lib/chartTheme.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 7-stop semantic chart palette; domain color mapping (water, protein, carbs, fat, fiber)                                                                                                                         |
| **API client**        | `apps/web/src/lib/apiClient.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | JWT-aware HTTP client; token storage in localStorage; auto-refresh 60s before expiry; `ApiError`; `api.get/post/put/delete`; `api.auth.exchangeToken/logout`; `isAuthenticated()`                               |
| **TDEE lib**          | `apps/web/src/lib/tdee.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | mifflinStJeorBMR, computeTDEE, computeCalorieGoal, computeMacroTargets                                                                                                                                          |
| **MET lib**           | `apps/web/src/lib/metTable.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ~60 activities with ACSM MET values for calorie burn calculation                                                                                                                                                |
| **Achievements lib**  | `apps/web/src/lib/achievements.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Achievement definitions and unlock logic                                                                                                                                                                        |
| **Micronutrient RDA** | `apps/web/src/lib/micronutrientRDA.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `getPersonalizedRDA()` - RDA values by sex/age; powers MicronutrientPanel + useMicronutrientData                                                                                                                |
| **Tests**             | `apps/web/src/**/*.test.{ts,tsx}` (100 test files, 1900 tests)                                                                                                                                                                                                                                                                                                                                                                                                                               | Vitest + jsdom + fake-indexeddb + coverage                                                                                                                                                                      |
| **Config**            | `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/tsconfig.json`                                                                                                                                                                                                                                                                                                                                                                                                             | Build (with CSP) & test setup                                                                                                                                                                                   |
| **Backend**           | `apps/backend/src/main/java/com/gryffin/calorai/`                                                                                                                                                                                                                                                                                                                                                                                                                                            | Spring Boot 4.0 + Java 25; entities, controllers, services, security                                                                                                                                            |
| **DB migrate**        | `apps/backend/src/main/resources/db/migration/`                                                                                                                                                                                                                                                                                                                                                                                                                                              | Flyway SQL migrations                                                                                                                                                                                           |
| **Codegen**           | `apps/backend/openapi-codegen/`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | OpenAPI generator configs + generate.sh for TS/Kotlin/Swift SDKs                                                                                                                                                |

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
# Set SWAGGER_ENABLED=true in .env to enable Swagger UI at /gryffin/calorai/api/swagger-ui/index.html
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
Swagger UI: `http://localhost:8080/gryffin/calorai/api/swagger-ui/index.html`
Health check: `http://localhost:8080/gryffin/calorai/api/actuator/health`

### OpenAPI codegen (run from `apps/backend/openapi-codegen/`)

```bash
# 1. Ensure backend is running, then export the live spec:
curl http://localhost:8080/gryffin/calorai/api/api-docs > ../api-docs/openapi.json

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

**Last Updated:** June 7, 2026 | **Current release:** v0.8.0 (released June 7, 2026) | **In
progress:** v0.9.0 - UX uplift WS A-F complete (uncommitted); B5 AI Photo Logging backend; UX
uplift WS G-M; B6 social; TC1-TC4 test debt

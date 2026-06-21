# Gryffin Calorai - System Prompt for AI Agents

## Project Identity & Goal

**Project Name:** Gryffin Calorai
**Purpose:** Offline-first React app for tracking daily food intake, managing recipes, and
visualizing calorie progress.
**Context:** v0.17.0 released (June 2026); v0.18.0 in progress (June 2026). Full-stack: React
frontend + Spring Boot backend (auth + PostgreSQL). Health-focused personal tool. Database schema
v20 (frontend) + Flyway V22 (backend). Target: v1.0.0 with native mobile apps (E2E encrypted cloud
sync shipped in v0.16.0; Food DB + Barcode Lookup shipped in v0.17.0).

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
- ✅ All state goes in **Zustand store** (`apps/web/src/state/AppState.ts`, composed from slices
  in `apps/web/src/state/slices/`); no local component state except forms
- ✅ **IndexedDB queries must use indices**; never scan full tables (`[userId+dateLogged]` pattern)
- ✅ Components must have **accompanying `.test.ts` files** with >80% coverage target
- ✅ All async operations include loading/error states in Zustand
- ✅ **No router library**; App.tsx uses hash-based navigation (`window.location.hash`) with
  `React.lazy` + `Suspense`
- ✅ **Never use `import React from "react"`**; use named imports (`import { useState } from
  "react"`) and `import type` for type-only imports - automatic JSX transform makes the default
  import unnecessary
- ✅ **Heavy components must be lazy-loaded** with `React.lazy` + `Suspense`; `BarcodeScanner`
  (pulls in `@zxing`) is the primary example
- ✅ **Never add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` comments**; fix the
  underlying type or lint issue properly instead

**Naming Conventions:**

- Components: PascalCase (`FoodLogger.tsx`)
- Functions/hooks: camelCase (`useFoodForm()`)
- Types: PascalCase (`FoodItem`, `UserId`)
- Constants: UPPER_SNAKE_CASE (`DB_SCHEMA_VERSION`)
- Folders: kebab-case (`apps/web/src/hooks/`, `apps/web/src/db/`)

**Architecture:**

- **Entry:** `apps/web/index.html` -> `apps/web/src/main.tsx` (ErrorBoundary wrapper) ->
  `apps/web/src/App.tsx` (hash-based navigation + Suspense)
- **Folders:** `apps/web/src/{pages,components,hooks,state,db,types}`
- **Pages:** Dashboard, Recipes, Progress (in `apps/web/src/pages/`) - lazy-loaded; Settings at
  `#/settings`; `PageLoading` used as Suspense fallback
- **Chunking:** `apps/web/vite.config.ts` `manualChunks` (function form, required by Rolldown/
  Vite 8): `vendor-react`, `vendor-charts`, `vendor-barcode`, `vendor-db`, `vendor-icons`,
  `vendor-state`, `vendor-form`, `vendor-motion`, `vendor-ui`
- **Store:** 9 Zustand slices (`foodSlice`, `recipeSlice`, `bodySlice`, `activitySlice`,
  `trackerSlice`, `settingsSlice`, `coreSlice`, `syncSlice`, `uiSlice`) in `AppState.ts`.
  `coreSlice.selectedDate` drives date nav; `syncSlice` has `e2eEnabled` (persisted as
  `gc_e2e_enabled`) and `e2eKeyReady` (in-memory only, never persisted); `uiSlice` persists
  `density` (`gc_density`),
  `hapticsEnabled` (`gc_haptics`), `accentTheme` (`gc_accent`; persimmon/sage/indigo/amber/rose),
  `trainingDays` (`gc_training_days`), `broadsheet` (`gc_broadsheet`; two-column dashboard
  grid on lg screens), `almanacLocation` (`gc_almanac_loc`; JSON `{lat, lng, label}` for
  AlmanacPanel sunrise/sunset), `edition` (`gc_edition`;
  `standard/lamplight/sepia/large-print` paper editions);
  `settingsSlice.customMacroGoals` (`gc_custom_macros`)
  overrides periodized macro targets.
- **DB:** Dexie.js tables with compound indices; schema version 20
- **FoodItem fields:** `apps/web/src/types/index.ts`; render unset macros as "---" not "0";
  `photoId?` added v0.9.0
- **MealType:** `"Breakfast" | "Lunch" | "Snacks" | "Dinner"`
- **Constants:** `DAILY_WATER_GOAL_ML = 2000`, `DAILY_STEP_GOAL = 10000`, `BACKUP_VERSION = 1`
- **TDEE formula:** Mifflin-St Jeor BMR x activity factor = TDEE; goal offsets: -500 kcal
  (lose), 0 (maintain), +300 kcal (gain). See `apps/web/src/lib/tdee.ts`.
- **Earned-calorie model:** `earnedGoal = calorieGoal + totalActivityBurned`; use `earnedGoal`
  for progress ring and surplus/deficit display. See `activitySlice.ts`.
- **MET formula:** `MET x weightKg x (durationMin / 60)` = kcal burned. ~60 activities in
  `apps/web/src/lib/metTable.ts`.
- **Fasting presets:** 5 presets (12:12, 14:10, 16:8, 18:6, OMAD 20h) as `FASTING_PRESETS` in
  `apps/web/src/types/index.ts`.
- **Form input class:** Use `EDITORIAL_INPUT_CLS` from `src/lib/utils.ts`; `SERIF_TITLE_CLS` for
  section headings (Spectral serif / Manrope body / JetBrains Mono micro-labels).

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
- Never use en-dashes (-) or em-dashes (-); always use a regular dash (-) instead

**TypeScript Code Style - REQUIRED:**

- See @@.gemini/rules/typescript.md for complete rules (Google TypeScript Style Guide)
- Named exports only; `import type` for type-only imports; no `any` (use `unknown`)
- Prefer string union types over enums; use `interface` for object shapes
- `const`/`let` only; arrow functions for callbacks; async/await over raw Promises

**HTML/CSS Code Style - REQUIRED:**

- See @@.gemini/rules/html-css.md for complete rules (Google HTML/CSS Style Guide)
- Semantic HTML elements; `type="button"` on all non-submit buttons
- Tailwind only - no inline styles; use `cn()` for conditional classes; mobile-first
- All images need `alt`; icon-only buttons need `aria-label` or `sr-only` text

**UX & Design Principles - REQUIRED:**

- See @@.gemini/rules/ux-principles.md for complete rules
- OKLCH color only (no HSL); tinted neutrals (chroma 0.005-0.015); never pure black
- All 8 interactive states must be designed (default, hover, focus, active, disabled, loading,
  error, success)
- Destructive actions use undo-toast pattern, NOT confirmation dialogs (already in the app)
- Reduced motion: all animated components must respect `prefers-reduced-motion`
- Mobile-first, `pointer: coarse` detection for touch targets (44px minimum)
- Brand identity: Almanac / Field Journal - squared corners, hairline rules, serif display, mono
  labels, persimmon accent; never rounded-card generic health-tech aesthetic

**Markdown Style - REQUIRED:**

- See @@.gemini/rules/markdown.md for complete rules (Google Markdown Style Guide)
- 80-char line limit for prose; ATX headings only; fenced code blocks with language declared
- No HTML in Markdown; informative link titles; reference links for long URLs in tables

**Backend Code Style (Java) - REQUIRED:**

- See @@.gemini/rules/backend.md for complete Checkstyle (Google Java Style) rules
- **Javadoc:** All public classes, records, and methods must have documentation
  (MissingJavadocType/Method)
- **Indentation:** 2 spaces = 1 level; record parameters = 4 spaces, method bodies = 4+ spaces,
  continuations = 6+ spaces
- **Line Length:** Max 100 characters; break long annotations and method signatures across lines
- **Method Names:** No underscores in test method names; camelCase throughout
- **Before every backend commit:** Run `mvn clean install`; Checkstyle runs at `validate` phase
  and fails the build on violations (`maven-checkstyle-plugin` 3.6.0)

---

## Key Documentation (Progressive Disclosure)

For persistent cross-session context, read @@project-knowledge/AGENTS.md first, then
@@project-knowledge/index.md (canonical session-start artifact; update at session end).
For automation, check `.gemini/agents/` (migration-safety-reviewer, backend-code-reviewer,
a11y-reviewer, web-bundle-analysis, web-dead-code-finder, web-test-coverage-gap-finder) and
`.gemini/skills/` (dexie-migration, flyway-migration, scaffold-backend,
scaffold-new-react-component,
scaffold-new-react-hook, scaffold-zustand-slice, generate-vitest) before implementing manually.
For architecture details, see @@docs/gryffin-calorai-specifications.md
For security guidelines, see @@.gemini/skills/owasp-security-audit/SKILL.md
For release history, see @@release-notes/0.15.0.md (latest), @@release-notes/0.14.0.md, and
older files in `release-notes/`
For roadmap, implemented history, and DB schema versions, see @@ROADMAP.md
For UX/design system guidelines, see @@.gemini/rules/ux-principles.md (auto-loaded for
.tsx/.html/.css files)
For quick dev commands, see @@README.md

---

## Critical File Locations

| Category          | File                                                           | Key Info                                                                                                                                                                                                                               |
|-------------------|----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **State**         | `apps/web/src/state/AppState.ts`                               | Single Zustand store; all mutations here                                                                                                                                                                                               |
| **DB**            | `apps/web/src/db/dbService.ts`                                 | Dexie schema v20, CRUD, compound indices; `syncQueue` + `SyncQueueEntry`; `syncId` on 6 entities; `photos` table + `FoodPhotoId` branded type                                                                                          |
| **Types**         | `apps/web/src/types/index.ts`                                  | Branded types, type guards, sanitizers, fuzzy match, FASTING_PRESETS, DietPreset, RestrictionFlag, ReminderId, REMINDER_LABELS, `shiftISODate(date, n)` - always use for date arithmetic                                               |
| **Pages**         | `apps/web/src/pages/{Dashboard,Recipes,Progress,Settings}.tsx` | Main views (lazy-loaded); Settings at `#/settings`                                                                                                                                                                                     |
| **Components**    | `apps/web/src/components/`                                     | Sub-folders: `dashboard/`, `illustrations/`, `icons/almanac/`, `settings/`, `progress/`, `recipes/`, `charts/`, `tour/`                                                                                                                |
| **Dashboard**     | `apps/web/src/components/dashboard/`                           | AlmanacPanel (lazy), DashboardHero, DateKicker, EditorialFrame, LogEntry, MacroStat, SectionHeader, DailyVitalsStrip, RuleTicks; `SeasonalOrnament` (in `icons/almanac/`) is reused in App.tsx nav head - do not inline seasonal logic |
| **Progress**      | `apps/web/src/components/progress/`                            | AdaptiveTdeePanel, CorrelationInsightsPanel, EnergyForecastCard, ProjectedWeightCard, MicronutrientPanel, MicronutrientHeatmap, PhenologyWheel (polar SVG), ProgressHero, SpecimenPlate (HarvestStamp seal)                            |
| **Settings**      | `apps/web/src/components/settings/`                            | TdeeProfilePanel (lazy-loaded), GoalSettings, CsvImportPanel, AppleHealthImportPanel, CustomMacroGoalsPanel                                                                                                                            |
| **Tour**          | `apps/web/src/components/tour/`                                | ProductTourOverlay, CoachmarkCard, tourSteps, useSpotlightRect                                                                                                                                                                         |
| **Hooks**         | `apps/web/src/hooks/`                                          | `useSyncService` (cloud sync), `useProgressData` (7-day avg), `useWeeklyHarvestTrigger`, `useFastingTimer`, `useReminders`                                                                                                             |
| **Forms**         | `apps/web/src/forms/schemas.ts`                                | Zod schemas: food, recipe, water, step, body, TDEE profile, activity, backup, diet profile, recurring meal                                                                                                                             |
| **Motion**        | `apps/web/src/lib/motionVariants.ts`                           | `counterPopVariants` (spring pop), `useSectionMotion()` (crossfade), `easeSpring`                                                                                                                                                      |
| **a11y lib**      | `apps/web/src/lib/a11y.ts`                                     | `MAIN_CONTENT_ID`, `liveRegionProps`, `assertiveRegionProps`, `visuallyHiddenProps`, `useMotionPreset(name)`                                                                                                                           |
| **E2E crypto**    | `apps/web/src/lib/e2eEncryption.ts`                            | PBKDF2 (600k iterations) + AES-GCM-256: `deriveKey`, `encryptData`, `decryptData`, `exportSalt` pure async functions                                                                                                                   |
| **E2E key store** | `apps/web/src/lib/e2eKeyStore.ts`                              | In-memory `CryptoKey` singleton; never persisted; `setKey`, `getKey`, `clearKey`                                                                                                                                                       |
| **OFF API**       | `apps/web/src/lib/offProductApi.ts`                            | `searchOff(q)` FTS search + `lookupBarcode(code)` exact match; converts g/100g nutrients to `FoodItem` prefill; 300ms debounce fallback in FoodSearchCombobox                                                                          |
| **API client**    | `apps/web/src/lib/apiClient.ts`                                | JWT-aware HTTP; auto-refresh 60s before expiry; `api.get/post/put/delete`; `api.auth.exchangeToken/logout`; `isAuthenticated()`                                                                                                        |
| **TDEE lib**      | `apps/web/src/lib/tdee.ts`                                     | `mifflinStJeorBMR`, `computeTDEE`, `computeCalorieGoal`, `computeMacroTargets`, `applyPeriodization`                                                                                                                                   |
| **Adaptive TDEE** | `apps/web/src/lib/adaptiveTdee.ts`                             | `computeAdaptiveTdee`, `detectPlateau`, `computeWeeklyForecast`; EMA smoothing; uses `FoodLogEntry` structural type (not full `FoodItem`)                                                                                              |
| **Correlations**  | `apps/web/src/lib/correlations.ts`                             | Pearson-r insights: sodium/weight, training/adherence, fasting/intake                                                                                                                                                                  |
| **Meal patterns** | `apps/web/src/lib/mealPatterns.ts`                             | `analyzeMealPatterns()` - timing and consistency suggestions                                                                                                                                                                           |
| **Importers**     | `apps/web/src/lib/importers/`                                  | MFP, Cronometer, Lose It CSV + Apple Health XML parsers; `isISODate()` type guard in `utils.ts` validates dates before DB write                                                                                                        |
| **Haptics lib**   | `apps/web/src/lib/haptics.ts`                                  | `triggerHaptic(pattern)` - Vibration API; patterns: `"success"`, `"achievement"`, `"error"`                                                                                                                                            |
| **Solar lib**     | `apps/web/src/lib/solar.ts`                                    | `getDayOfYear`, `getSeason`, `getMoonPhase` (JDN), `getSunTimes` (NOAA); powers AlmanacPanel                                                                                                                                           |
| **Charts lib**    | `apps/web/src/lib/chartTheme.ts`                               | 7-stop semantic palette; domain colors (water, protein, carbs, fat, fiber)                                                                                                                                                             |
| **Micronutrient** | `apps/web/src/lib/micronutrientRDA.ts`                         | `getPersonalizedRDA()` - RDA by sex/age; powers MicronutrientPanel                                                                                                                                                                     |
| **Tests**         | `apps/web/src/**/*.test.{ts,tsx}` (139+ files, 2594+ tests)    | Vitest + jsdom + fake-indexeddb + coverage                                                                                                                                                                                             |
| **Config**        | `apps/web/vite.config.ts`, `vitest.config.ts`, `tsconfig.json` | Build (with CSP) & test setup                                                                                                                                                                                                          |
| **Backend**       | `apps/backend/src/main/java/com/gryffin/calorai/`              | Spring Boot 4.0 + Java 25                                                                                                                                                                                                              |
| **DB migrate**    | `apps/backend/src/main/resources/db/migration/`                | Flyway SQL migrations                                                                                                                                                                                                                  |
| **Codegen**       | `apps/backend/openapi-codegen/`                                | OpenAPI generator configs + `generate.sh` for TS/Kotlin/Swift SDKs                                                                                                                                                                     |
| **OFF ops**       | `apps/backend/OFF-IMPORT.md`                                   | Runbook: initial import + monthly refresh for 4.5M-row `off_products` table                                                                                                                                                            |

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

**Secret management:** `apps/backend/.env` is gitignored - never commit it. `docker compose up`
fails without `JWT_SECRET`; backend rejects known-placeholder values.

**Option A - Docker Compose (recommended):**

```bash
cd apps/backend
cp .env.example .env  # set JWT_SECRET: openssl rand -hex 32
# set SWAGGER_ENABLED=true to enable Swagger UI
docker compose up -d           # postgres:5432, pgadmin:5050, backend:8080
docker compose logs -f backend
docker compose down
```

**Option B - Maven only (requires PostgreSQL on port 5432):**

```bash
cd apps/backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/gcalorai
export DATABASE_USER=gcalorai
export DATABASE_PASSWORD=<your-password>
export JWT_SECRET=$(openssl rand -hex 32)
export CORS_ALLOWED_ORIGINS=http://localhost:5173
mvn spring-boot:run
```

Backend base: `http://localhost:8080/gryffin/calorai/api` | Swagger:
`.../swagger-ui/index.html` | Health: `http://localhost:8080/actuator/health`
(Note: actuator is at root, not under the context path)

### OpenAPI codegen

```bash
curl http://localhost:8080/gryffin/calorai/api/api-docs > apps/backend/api-docs/openapi.json
bash apps/backend/openapi-codegen/generate.sh
# Outputs: TS (axios), Kotlin (retrofit2), Swift 5 under packages/api-sdk/
```

---

**Last Updated:** June 20, 2026 | **Current release:** v0.17.0 (released June 2026) | **In
progress:** v0.18.0 (139+ test files, 2594+ tests)

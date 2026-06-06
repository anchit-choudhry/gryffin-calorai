# Project Documentation: Gryffin Calorai (v0.8.0 - Cloud Sync & AI Features)

## Architectural Overview

Gryffin Calorai is a full-stack, offline-first health management platform. It features a React
single-page application (SPA) for the frontend and a Spring Boot service for the backend. The system
is designed for privacy and speed, persisting data locally via IndexedDB (Dexie.js) and
synchronizing with a PostgreSQL database.

- **Monorepo Structure:** Managed with `pnpm` workspaces, separating `apps/web`, `apps/backend`,
  `apps/android`, `apps/ios`, and `packages/api-sdk`.
- **Frontend Routing:** Hash-based navigation (`window.location.hash`) using `React.lazy` and
  `Suspense` for code-splitting.
- **State Management:** Global state is managed by a single Zustand store
  (`apps/web/src/state/AppState.ts`), composed from functional slices.
- **Persistence:**
  - **Client:** IndexedDB via Dexie.js 4 (currently **schema version 19**) with compound
    indices for performance.
  - **Server:** PostgreSQL 18 with migrations managed by Flyway.
- **Cloud Sync (B4):** Bidirectional push-then-pull sync via delta changes endpoints (
  `GET /changes?since=`)
  and client-generated UUID `syncId`s. Supported by a secure, single-use refresh token rotation
  backed by DB.
- **Styling:** Tailwind CSS v4 using modern CSS-only `@import` directives and shadcn/ui.
- **Security:** Strict Content Security Policy (CSP), HSTS, COOP/COEP, JWT-based authentication
  with JWKS Google OIDC Verification, and Valkey-backed rate limiting.

## Technical Stack

### Frontend (`apps/web`)

- **Core:** React 19 + Vite 8 + TypeScript 6 (strict mode)
- **State:** Zustand 5 (composed slices)
- **Database:** IndexedDB via Dexie.js 4 (v19 schema)
- **Styling:** Tailwind CSS 4 + shadcn/ui primitives (Radix UI)
- **Forms:** react-hook-form 7 + zod (via `zod/v3` or zod 4) + @hookform/resolvers
- **Testing:** Vitest 4 + jsdom + fake-indexeddb
- **Charts:** Recharts 3
- **Animation:** motion 12 (`motion/react`)
- **Toast:** sonner
- **Icons:** lucide-react
- **Libraries:** date-fns 4.3.0, fflate 0.8 (ZIP), @zxing/library (barcode)

### Backend (`apps/backend`)

- **Core:** Spring Boot 4.0 + Java 25
- **Database:** PostgreSQL 18 + Flyway (migrations)
- **Rate Limiting:** Valkey 9.1.0-alpine + bucket4j_jdk17 (8.19.0)
- **Security:** Spring Security + JJWT (Google OIDC via JWKS, refresh token rotation)
- **API:** OpenAPI 3 (docs) + generated SDKs (TypeScript, Kotlin, Swift)

## Core File Documentation

### Configuration & Tooling

- `pnpm-workspace.yaml`: Defines the monorepo workspace structure.
- `apps/web/package.json`: Frontend dependencies and scripts.
- `apps/web/vite.config.ts`: Build system with Tailwind v4, CSP headers, and Rollup manual chunks.
- `apps/web/tsconfig.json`: TypeScript configuration with strict mode and path mappings.
- `apps/web/vitest.config.ts`: Vitest configuration with `jsdom` and coverage.
- `.github/workflows/`: CI/CD pipeline (17+ workflows) including CodeQL, OSV-Scanner, and
  Super-Linter.
- `.github/instructions/`: Instructions for backend, frontend, testing, and typescript developers.
- `.claude/rules/`: Rigid development rulebooks for backend, frontend, typescript, markdown, and
  testing.

### Frontend Logic & State (`apps/web/src`)

- `main.tsx`: Entry point. Wraps the app in an `ErrorBoundary`.
- `App.tsx`: Orchestrator. Manages hash-based routing and provides `Suspense` boundaries.
- `state/AppState.ts`: Central Zustand store. Composed from `foodSlice`, `recipeSlice`, `bodySlice`,
  `activitySlice`, `trackerSlice`, `settingsSlice`, `coreSlice`, and `syncSlice`.
- `db/dbService.ts`: Dexie.js service layer. Defines schema v19, compound indices, and CRUD
  abstractions.
- `types/index.ts`: Domain models and branded types (UserId, FoodItemId, RecipeId, etc.). Includes
  sanitizers, constants (TDEE, Fasting Presets), and unit helpers.

### UI Components (`apps/web/src/components`)

- `dashboard/`: Sub-components (`DashboardHero`, `DateKicker`, `LogEntry`, `MacroStat`,
  `EditorialFrame`, `SectionHeader`).
- `recipes/`: Recipe management (`RecipesHero`, `RecipeForm`, `RecipeList`, `RecipeRow`,
  `IngredientRow`).
- `progress/`: Visualization components (`ProgressHero`, `MicronutrientPanel`).
- `charts/`: Shared primitives (`ChartLegend`, `ChartTooltip`, `EditorialChartCard`).
- `tour/`: Product tour system (`ProductTourOverlay`, `CoachmarkCard`, `tourSteps`).
- `settings/`: Settings sub-components (`TdeeProfilePanel`, `GoalSettings`).
- `illustrations/`: Stroke-only SVG components (`EmptyPlate`, `EmptyCup`, `BodyScale`, etc.).
- `icons/almanac/`: SVG ornaments (`WheatSprig`, `MoonPhase`, `SunRay`, etc.).
- `ui/`: shadcn/ui primitives, `Skeleton` loaders, and `QuickAddSheet`.
- `FoodLogger.tsx`, `VoiceFoodLogger.tsx`, `BarcodeScanner.tsx`: Nutrition logging tools.
- `WaterTracker.tsx`, `StepTracker.tsx`, `FastingTimer.tsx`: Activity and habit tracking.
- `ActivityLogger.tsx`, `ActivityTracker.tsx`: MET-based exercise logging.
- `BodyMeasurements.tsx`, `StreakCard.tsx`, `WeeklySummary.tsx`: Progress and gamification.
- `OnboardingModal.tsx`, `OnboardingBanner.tsx`: TDEE goal engine and onboarding.
- `DataExportPanel.tsx`, `DataImportConflictModal.tsx`: Backup and recovery logic.
- `DietProfileEditor.tsx`, `RecurringMeals.tsx`, `RemindersSettings.tsx`, `MealTemplates.tsx`:
  Personalized diet and notification settings.
- `SyncStatusChip.tsx`, `CloudSyncPanel.tsx`, `HarvestStamp.tsx`, `EmptyState.tsx`: Sync,
  achievements, and UX.

### Hooks (`apps/web/src/hooks`)

- `useKeyboardShortcuts.ts`: Global keyboard event listener.
- `useFoodForm.ts`, `useRecipeForm.ts`, `useWaterForm.ts`, `useStepForm.ts`, `useBodyForm.ts`,
  `useActivityForm.ts`, `useRecurringMealForm.ts`: Form-specific logic.
- `useFastingTimer.ts`, `useOnboarding.ts`, `useDietProfile.ts`, `useReminders.ts`: Core features.
- `useDataExport.ts`, `useDataImport.ts`, `useRecipeImport.ts`: Integration hooks.
- `useProgressData.ts`, `useWeeklySummary.ts`, `useStreaks.ts`, `useMicronutrientData.ts`: Data
  aggregation.
- `useSyncService.ts`, `useBarcodeScanner.ts`, `useMotionPreset.ts`: Service and UX hooks.

### Utility & Library Logic (`apps/web/src/lib`)

- `achievements.ts`: Gamification engine (20+ milestones).
- `tdee.ts`: Mifflin-St Jeor BMR and calorie goal calculations.
- `metTable.ts`: Static MET lookup for ~60 activities.
- `chartTheme.ts`: Centralized Recharts palette (7-stop semantic).
- `motionVariants.ts`, `a11y.ts`, `imagery.ts`: Shared variants, accessibility, and photo catalog.
- `apiClient.ts`, `micronutrientRDA.ts`: JWT client and RDA reference data.
- `utils.ts`: Utility functions (cn, date formatting, log grouping).

### Page Components (`apps/web/src/pages`)

- `Dashboard.tsx`: Main overview with editorial layout.
- `Recipes.tsx`: Recipe management interface.
- `Progress.tsx`: Data-driven visualizations (Calorie Trend, Macros, Micronutrients, etc.).
- `Settings.tsx`: User profile, TDEE management, and data settings.

## Operational Standards

- **Strict Development Rules:**
  - **Tailwind Only:** No inline styles or CSS modules. Use `cn()` for conditional classes and
    `EDITORIAL_INPUT_CLS` on inputs.
  - **Branded Types:** Use branded types for all IDs (UserId, FoodItemId, RecipeId, WaterLogId,
    BodyMeasurementId, UserAchievementId, StepLogId, FastingSessionId, ActivityLogId, ISODate) to
    prevent ID mix-ups.
  - **Zustand Store:** Composed slices in `apps/web/src/state/slices/`. No local component state
    except forms. Async operations must include loading/error states in Zustand.
  - **IndexedDB Indices:** Use compound indices (e.g., `[userId+dateLogged]`) for all queries. Never
    scan full tables.
  - **Test-Driven:** Every component/logic file must have a `.test.ts/tsx` file with >80% coverage (
    TDD approach: write failing tests first).
  - **Navigation:** Hash-based only; no router library. Lazy-loaded pages with `React.lazy` +
    `Suspense` and `PageLoading` fallback.
  - **Named Imports:** Never use `import React from "react"`; use named imports (e.g.,
    `import { useState } from "react"`) and `import type` for type-only imports.
  - **Lazy Loading:** Heavy components (e.g., `BarcodeScanner`, `TdeeProfilePanel`) must be
    lazy-loaded.
  - **No Suppressing Warnings:** Never add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`
    comments; fix the underlying type/lint issue properly.
  - **HTML/CSS Conventions:** Semantic HTML, `type="button"` on non-submit buttons, alt text on all
    images, `aria-label`/`sr-only` text on icon-only buttons.
- **Backend Standards (Java/Spring Boot):**
  - **Javadoc:** Required on all public classes, records, interfaces, and public methods.
  - **Indentation:** Strict 2-space basic offset, 4 spaces class members, 6+ spaces continuations.
  - **Line Length:** Max 100 characters; break annotations and signatures across lines where needed.
  - **Naming:** camelCase throughout; no underscores in test method names.
  - **Build Failures:** Checkstyle plugin runs at the validate phase; the build will fail on any
    style violation. Run `mvn clean install` to check.
- **Security:** Strict CSP (Google Sign-In integration), HSTS, Valkey rate limiting, JWT type claim
  validation, JTI-based refresh token rotation, unverified Google email checking, and 5 MB URL
  recipe response size caps.
- **Git:** Commit format `<type>(<scope>): <subject>`. Atomic commits only.

### Development Guidelines for Gemini CLI

- **Primary Source of Truth:** Refer to the `.claude/` directory and `.github/instructions/` for
  detailed agent-specific rules.
- **Frontend Rules:** See `src/GEMINI.md` (subdirectory) for detailed UI conventions.
- **Testing Principles:**
  - **Framework:** Vitest + @testing-library/react + jsdom + fake-indexeddb.
  - **TDD:** Write failing tests first.
  - **Assertions:** Prefer `toStrictEqual` for deep equality.

### Architectural Baseline (Adding New Features)

1. `apps/web/src/types/index.ts`: Branded ID + domain constants.
2. `apps/web/src/db/dbService.ts`: Schema update + CRUD helpers.
3. `apps/web/src/state/slices/`: New state slice unified in `AppState.ts`.
4. `apps/web/src/hooks/use<Feature>Form.ts`: Form logic + validation.
5. `apps/web/src/components/<Feature>.tsx`: Component implementation.
6. `apps/web/src/**/*.test.ts`: Comprehensive verification.

## Roadmap (v0.8.0+)

- [x] Micronutrient Tracking (~25 nutrients: fiber, sodium, vitamins/minerals)
- [x] PWA + Service Worker (Install-to-home, better offline)
- [x] Recipe Import from URL (CORS proxy + JSON-LD parsing)
- [x] Spring Boot Backend Scaffold (v0.7.0 milestone)
- [x] UI v2 Almanac Refresh (Pillars 1-4: brand, charts, illustrations, mobile UX)
- [x] Cloud Sync (Backend B4 milestone) - **Web and Backend Complete**
- [x] Backend Security Hardening (OWASP + Google Java Style, Javadoc, Rate limiting)
- [ ] AI Photo Logging (Backend B5 milestone) - **Planned**
- [ ] Native iOS/Android apps (v0.9.0-v1.0.0 milestone) - **Planned**

---
**Last Updated:** June 6, 2026 (v0.8.0 Cloud Sync Complete)

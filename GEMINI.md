# Project Documentation: Gryffin Calorai (v0.7.0)

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
    - **Client:** IndexedDB via Dexie.js 4 (currently **schema version 18**) with compound
      indices for performance.
    - **Server:** PostgreSQL 18 with migrations managed by Flyway.
- **Styling:** Tailwind CSS v4 using modern CSS-only `@import` directives and shadcn/ui.
- **Security:** Strict Content Security Policy (CSP), HSTS, COOP/COEP, and JWT-based authentication
  for the backend.

## Technical Stack

### Frontend (`apps/web`)
- **Core:** React 19 + Vite 8 + TypeScript 6 (strict mode)
- **State:** Zustand 5 (composed slices)
- **Database:** IndexedDB via Dexie.js 4
- **Styling:** Tailwind CSS 4 + shadcn/ui primitives (Radix UI)
- **Forms:** react-hook-form 7 + zod 4 (via `zod/v3`) + @hookform/resolvers
- **Testing:** Vitest 4 + jsdom + fake-indexeddb
- **Charts:** Recharts 3
- **Animation:** motion 12 (`motion/react`)
- **Toast:** sonner
- **Icons:** lucide-react
- **Libraries:** date-fns 4, fflate 0.8 (ZIP), @zxing/library (barcode)

### Backend (`apps/backend`)
- **Core:** Spring Boot 4.0 + Java 25
- **Database:** PostgreSQL 18 + Flyway (migrations)
- **Security:** Spring Security + JJWT
- **API:** OpenAPI 3 (docs) + generated SDKs

## Core File Documentation

### Configuration & Tooling

- `pnpm-workspace.yaml`: Defines the monorepo workspace structure.
- `apps/web/package.json`: Frontend dependencies and scripts.
- `apps/web/vite.config.ts`: Build system with Tailwind v4, CSP headers, and Rollup manual chunks.
- `apps/web/tsconfig.json`: TypeScript configuration with strict mode and path mappings.
- `apps/web/vitest.config.ts`: Vitest configuration with `jsdom` and coverage.
- `.github/workflows/`: CI/CD pipeline (17+ workflows) including CodeQL, OSV-Scanner, and Super-Linter.

### Frontend Logic & State (`apps/web/src`)

- `main.tsx`: Entry point. Wraps the app in an `ErrorBoundary`.
- `App.tsx`: Orchestrator. Manages hash-based routing and provides `Suspense` boundaries.
- `state/AppState.ts`: Central Zustand store. Composed from `foodSlice`, `recipeSlice`, `bodySlice`,
  `activitySlice`, `trackerSlice`, `settingsSlice`, and `coreSlice`.
- `db/dbService.ts`: Dexie.js service layer. Defines schema v18 and CRUD abstractions.
- `types/index.ts`: Domain models and branded types (UserId, FoodItemId, RecipeId, etc.). Includes
  sanitizers, constants (TDEE, Fasting Presets), and unit helpers.

### UI Components (`apps/web/src/components`)

- `dashboard/`: Sub-components (`DashboardHero`, `DateKicker`, `LogEntry`, `MacroStat`, `EditorialFrame`).
- `recipes/`: Recipe management (`RecipesHero`, `RecipeForm`, `RecipeList`, `RecipeRow`, `IngredientRow`).
- `progress/`: Visualization components (`ProgressHero`, `MicronutrientPanel`).
- `charts/`: Shared primitives (`ChartLegend`, `ChartTooltip`, `EditorialChartCard`).
- `tour/`: Product tour system (`ProductTourOverlay`, `CoachmarkCard`, `tourSteps`).
- `settings/`: Settings sub-components (`TdeeProfilePanel`, `GoalSettings`).
- `ui/`: shadcn/ui primitives and `Skeleton` loaders.
- `FoodLogger.tsx`, `VoiceFoodLogger.tsx`, `BarcodeScanner.tsx`: Nutrition logging tools.
- `WaterTracker.tsx`, `StepTracker.tsx`, `FastingTimer.tsx`: Activity and habit tracking.
- `ActivityLogger.tsx`, `ActivityTracker.tsx`: MET-based exercise logging.
- `BodyMeasurements.tsx`, `StreakCard.tsx`, `WeeklySummary.tsx`: Progress and gamification.
- `OnboardingModal.tsx`, `OnboardingBanner.tsx`: TDEE goal engine and onboarding.
- `DataExportPanel.tsx`, `DataImportConflictModal.tsx`: Backup and recovery logic.
- `DietProfileEditor.tsx`, `RecurringMeals.tsx`, `RemindersSettings.tsx`, `MealTemplates.tsx`:
  Personalized diet and notification settings.
- `KeyboardShortcutsOverlay.tsx`: Global shortcut registry.

### Hooks (`apps/web/src/hooks`)

- `useKeyboardShortcuts.ts`: Global keyboard event listener.
- `useFoodForm.ts`, `useRecipeForm.ts`, `useWaterForm.ts`, `useStepForm.ts`, `useBodyForm.ts`,
  `useActivityForm.ts`, `useRecurringMealForm.ts`: Form-specific logic.
- `useFastingTimer.ts`, `useOnboarding.ts`, `useDietProfile.ts`, `useReminders.ts`: Core features.
- `useDataExport.ts`, `useDataImport.ts`, `useRecipeImport.ts`: Integration hooks.
- `useProgressData.ts`, `useWeeklySummary.ts`, `useStreaks.ts`, `useMicronutrientData.ts`: Data aggregation.

### Utility & Library Logic (`apps/web/src/lib`)

- `achievements.ts`: Gamification engine (20+ milestones).
- `tdee.ts`: Mifflin-St Jeor BMR and calorie goal calculations.
- `metTable.ts`: Static MET lookup for ~60 activities.
- `chartTheme.ts`: Centralized Recharts palette.
- `motionVariants.ts`: Shared Framer Motion variants.
- `utils.ts`: Utility functions (cn, date formatting, log grouping).

### Page Components (`apps/web/src/pages`)

- `Dashboard.tsx`: Main overview with editorial layout.
- `Recipes.tsx`: Recipe management interface.
- `Progress.tsx`: Data-driven visualizations (Calorie Trend, Macros, Micronutrients, etc.).
- `Settings.tsx`: User profile, TDEE management, and data settings.

## Operational Standards

- **Strict Development Rules:**
  - **Tailwind Only:** No inline styles or CSS modules.
  - **Branded Types:** Use branded types for all IDs to prevent mix-ups.
  - **Zustand Store:** Composed slices in `apps/web/src/state/slices/`.
  - **IndexedDB Indices:** Use compound indices (e.g., `[userId+dateLogged]`) for all queries.
  - **Test-Driven:** Every component/logic file must have a `.test.ts/tsx` file with >80% coverage.
  - **Navigation:** Hash-based only; no router library.
  - **Named Imports:** Never use `import React from "react"`; use named imports.
  - **Lazy Loading:** Heavy components (e.g., `BarcodeScanner`, `TdeeProfilePanel`) must be lazy-loaded.
- **Security:** Strict CSP, HSTS, and JWT-based sync security.
- **Git:** Commit format `<type>(<scope>): <subject>`. Run `pnpm lint:fix` and `pnpm test` before commits.

### Development Guidelines for Gemini CLI

- **Primary Source of Truth:** Refer to the `.claude/` directory for detailed agent-specific rules.
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

## Roadmap (v0.7.0+)

- [x] Micronutrient Tracking (~25 nutrients: fiber, sodium, vitamins/minerals)
- [x] PWA + Service Worker (Install-to-home, better offline)
- [x] Recipe Import from URL (CORS proxy + JSON-LD parsing)
- [x] Spring Boot Backend (v0.7.0 milestone)
- [ ] Cloud Sync (Backend B4 milestone) - **In Progress**
- [ ] AI Photo Logging (Backend B5 milestone) - **Planned**
- [ ] Native iOS/Android apps (v0.8.0-v1.0.0 milestone) - **Planned**

---
**Last Updated:** May 25, 2026 (v0.7.0 release)

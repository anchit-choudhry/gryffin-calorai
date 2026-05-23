# Project Documentation: Gryffin Calorai (v0.3.0)

## Architectural Overview

Gryffin Calorai is a client-side, offline-first React single-page application (SPA). It is designed
for privacy and speed, persisting all data locally via IndexedDB (Dexie.js) without a backend
dependency.

- **Routing:** Hash-based navigation (`window.location.hash`) using `React.lazy` and `Suspense` for
  code-splitting.
- **State Management:** Global state is managed by a single Zustand store (`src/state/AppState.ts`).
- **Persistence:** Local storage via Dexie.js (currently **schema version 13**) with compound
  indices
  for performance.
- **Styling:** Tailwind CSS v4 using modern CSS-only `@import` directives.
- **Security:** Strict Content Security Policy (CSP) and HTTP security headers (HSTS, COOP, COEP)
  configured in
  `vite.config.ts`.

## Technical Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6 (strict mode)
- **State:** Zustand 5 (single store)
- **Database:** IndexedDB via Dexie.js 4 (no backend)
- **Styling:** Tailwind CSS 4 (dark mode: class-based) + shadcn/ui primitives (Radix UI)
- **Forms:** react-hook-form 7 + zod 4 (imported via `zod/v3`) + @hookform/resolvers
- **Testing:** Vitest 4 + jsdom + fake-indexeddb
- **Charts:** Recharts 3
- **Animation:** motion 12 (`motion/react`)
- **Toast:** sonner
- **Icons:** lucide-react
- **Libraries:** date-fns 4 (time manipulation), fflate 0.8 (ZIP compression for CSV exports)

## Core File Documentation

### Configuration & Tooling

- `package.json`: Project dependencies and scripts. Pinned `pnpm` workspace standards.
- `vite.config.ts`: Configures the build system, Tailwind v4 plugin, and defines production security
  headers (CSP, X-Frame-Options, HSTS, etc.).
- `tsconfig.json`: TypeScript configuration with strict mode and path mappings.
- `vitest.config.ts`: Configured for Vitest with `jsdom` and code coverage reporting.
- `.github/workflows/`: CI/CD pipeline with 17+ workflows including linting, testing, and security
  scanning (CodeQL, OSV).

### Application Logic & State (`/src`)

- `main.tsx`: Entry point. Wraps the app in an `ErrorBoundary`.
- `App.tsx`: Orchestrator component. Manages hash-based routing, theme persistence, and provides the
  `Suspense` boundary for lazy-loaded pages.
- `state/AppState.ts`: Central Zustand store. Manages state and async actions for food logs,
  recipes, water intake, body measurements, step logs, user achievements, activity logs, fasting
  sessions, and tour state.
- `db/dbService.ts`: Dexie.js service layer. Defines schema v13 (adds activityLogs, fastingSessions,
  tdeeProfiles) and provides CRUD abstractions and data export/import logic.
- `types/index.ts`: Domain models and branded types (UserId, FoodItemId, RecipeId, WaterLogId,
  BodyMeasurementId, StepLogId, UserAchievementId, ActivityLogId, FastingSessionId, ISODate).
  Includes sanitizers, unit conversions, and constants.

### UI Components (`/src/components`)

- `dashboard/`: Sub-components for main overview (`DashboardHero`, `DateKicker`, `LogEntry`,
  `MacroStat`, `SectionHeader`, `EditorialFrame`).
- `recipes/`: Recipe management system (`RecipesHero`, `RecipeForm`, `RecipeList`, `RecipeRow`,
  `IngredientRow`).
- `progress/`: Visualization components (`ProgressHero`).
- `charts/`: Shared chart primitives (`ChartLegend`, `ChartTooltip`, `EditorialChartCard`).
- `tour/`: Product tour system (`ProductTourOverlay`, `CoachmarkCard`, `tourSteps`,
  `useSpotlightRect`).
- `settings/`: Settings sub-components (`TdeeProfilePanel`, `GoalSettings`).
- `ui/`: shadcn/ui primitives (Button, Dialog, Tabs, etc.) and `Skeleton` loaders.
- `FoodLogger.tsx`: Nutrition logging form (text, barcode, voice).
- `VoiceFoodLogger.tsx`: Web Speech API logging.
- `BarcodeScanner.tsx`: ZXing-based barcode interface (lazy-loaded).
- `WaterTracker.tsx` & `StepTracker.tsx`: Hydration and movement tracking.
- `FastingTimer.tsx`: Intermittent fasting dashboard widget with protocols and notifications.
- `ActivityLogger.tsx` & `ActivityTracker.tsx`: MET-based activity logging and summaries.
- `BodyMeasurements.tsx`: Physical metric tracking.
- `StreakCard.tsx` & `WeeklySummary.tsx`: Gamification and history visualization.
- `OnboardingModal.tsx` & `OnboardingBanner.tsx`: TDEE goal engine and onboarding flow.
- `DataExportPanel.tsx`: JSON backup and CSV ZIP export/import UI.
- `KeyboardShortcutsOverlay.tsx`: Global shortcut command registry.
- `PageLoading.tsx`: Suspense fallback.

### Hooks (`/src/hooks`)

- `useKeyboardShortcuts.ts`: Global keyboard event listener and command registry.
- `useFoodForm.ts`, `useRecipeForm.ts`, `useWaterForm.ts`, `useStepForm.ts`, `useBodyForm.ts`,
  `useActivityForm.ts`: Form-specific logic and validation.
- `useFastingTimer.ts`: Fasting state management with Notification API integration.
- `useOnboarding.ts`: Multi-step onboarding and TDEE profile management.
- `useDataExport.ts` & `useDataImport.ts`: JSON/CSV backup and recovery logic.
- `useProgressData.ts`, `useWeeklySummary.ts`, `useStreaks.ts`, `useWaterHistoryData.ts`: Data
  aggregation for charts/stats.

### Utility & Library Logic (`/src/lib`)

- `achievements.ts`: Evaluation engine for 20+ gamification milestones.
- `tdee.ts`: Mifflin-St Jeor BMR and activity-based calorie goal calculations.
- `metTable.ts`: Static MET lookup table for ~60 activities.
- `chartTheme.ts`: Centralized color palette and styling for Recharts.
- `motionVariants.ts`: Shared animation variants (page, section, spotlight, coachmark).
- `utils.ts`: Class merging (`cn`), date formatting, and log grouping.

### Page Components (`/src/pages`)

- `Dashboard.tsx`: Main overview with editorial layout and grouped logs.
- `Recipes.tsx`: User-defined recipe management.
- `Progress.tsx`: Comprehensive visualizations (7 sections: Calorie Trend, Macro Breakdown, Meal
  Distribution, Water Intake, Body Measurements, Measurement History, Achievements).
- `Settings.tsx`: User profile, personalized goal management (TDEE), and data export/import.

## Operational Standards

- **Strict Development Rules:**
  - **Tailwind Only:** No inline styles or CSS modules.
  - **Branded Types:** Use branded types for all IDs (UserId, FoodItemId, etc.) to prevent mix-ups.
  - **Zustand Store:** All shared state must reside in `src/state/AppState.ts`.
  - **IndexedDB Indices:** Always use compound indices (e.g., `[userId+dateLogged]`) for queries.
  - **Test-Driven:** Every component and logic file must have a `.test.ts/tsx` file with >80%
    coverage.
  - **Navigation:** Hash-based only; no router library allowed.
  - **Named Imports:** Never use `import React from "react"`; use named imports.
  - **Lazy Loading:** Heavy components (e.g., `BarcodeScanner`) must be lazy-loaded with `Suspense`.
- **Database Safety:** `clearDatabase()` disabled in production.
- **Security:** Strict CSP restricts hardware to `self` and disables geolocation. HSTS and COOP/COEP
  enabled.
- **Accessibility:** Global keyboard shortcuts (`?`); Guided product tour for onboarding.

### Architectural Baseline (Adding New Features)

1. `src/types/index.ts`: Branded ID + domain constants.
2. `src/db/dbService.ts`: New table/schema version + CRUD helpers.
3. `src/state/AppState.ts`: State fields + actions (using aliases for DB functions).
4. `src/hooks/use<Feature>Form.ts`: react-hook-form + zod + toast feedback.
5. `src/components/<Feature>.tsx`: Consume hook + store; use shadcn/ui + Tailwind.
6. `src/pages/`: Integration + motion/react stagger animations.
7. `src/**/*.test.ts`: Comprehensive tests for DB, state, and hooks.

## Roadmap (v0.4.0+)

- [ ] Recurring Meal Logging (copy yesterday, daily bitmasks)
- [ ] Micronutrient Tracking (~25 nutrients: fiber, sodium, vitamins/minerals)
- [ ] Diet Profiles & Restriction Flags (Keto, Vegan, etc. + allergen warnings)
- [ ] PWA + Service Worker (Install-to-home, better offline)
- [ ] Reminders & Web Push Notifications
- [ ] Recipe Import from URL (CORS proxy + JSON-LD parsing)
- [ ] Spring Boot Backend (v0.6.0 milestone for sync/auth)
- [ ] Native iOS/Android apps (v0.8.0+ milestone)

---
**Last Updated:** May 23, 2026 (v0.3.0 release)

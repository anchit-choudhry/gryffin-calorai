# Project Documentation: Gryffin Calorai (v0.0.7)

## Architectural Overview

Gryffin Calorai is a client-side, offline-first React single-page application (SPA). It is designed
for privacy and speed, persisting all data locally via IndexedDB (Dexie.js) without a backend
dependency.

- **Routing:** Hash-based navigation (`window.location.hash`) using `React.lazy` and `Suspense` for
  code-splitting.
- **State Management:** Global state is managed by a single Zustand store (`src/state/AppState.ts`).
- **Persistence:** Local storage via Dexie.js (currently **schema version 7**) with compound indices
  for performance.
- **Styling:** Tailwind CSS v4 using modern CSS-only `@import` directives.
- **Security:** Strict Content Security Policy (CSP) and HTTP security headers configured in
  `vite.config.ts`.

## Technical Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6 (strict mode)
- **State:** Zustand 5 (single store)
- **Database:** IndexedDB via Dexie.js 4 (no backend)
- **Styling:** Tailwind CSS 4 (dark mode: class-based) + shadcn/ui primitives (Radix UI)
- **Forms:** react-hook-form 7 + zod (v3) + @hookform/resolvers
- **Testing:** Vitest 4 + jsdom + fake-indexeddb
- **Charts:** Recharts 2
- **Animation:** motion 12 (`motion/react`)
- **Toast:** sonner
- **Icons:** lucide-react

## Core File Documentation

### Configuration & Tooling

- `package.json`: Project dependencies and scripts. Pinned `pnpm` workspace standards.
- `vite.config.ts`: Configures the build system, Tailwind v4 plugin, and defines production security
  headers (CSP, X-Frame-Options, etc.).
- `tsconfig.json`: TypeScript configuration with strict mode and path mappings.
- `vitest.config.ts`: Configured for Vitest with `jsdom` and code coverage reporting.

### Application Logic & State (`/src`)

- `main.tsx`: Entry point. Wraps the app in an `ErrorBoundary`.
- `App.tsx`: Orchestrator component. Manages hash-based routing, dark/light theme persistence, and
  provides the `Suspense` boundary for lazy-loaded pages.
- `state/AppState.ts`: Central Zustand store. Manages state and async actions for food logs,
  recipes, water intake, body measurements, and user goals.
- `db/dbService.ts`: Dexie.js service layer. Defines schema v7 (adding `waterLogs` and
  `bodyMeasurements`) and provides CRUD abstractions with compound index queries.
- `types/index.ts`: Domain models and branded types (UserId, FoodItemId, RecipeId, WaterLogId,
  BodyMeasurementId, ISODate). Includes sanitizers for barcode/voice inputs and utility functions
  like `computeStreaks` and `fuzzyMatchFoodName`.

### UI Components (`/src/components`)

- `FoodLogger.tsx`: Standard form for logging nutrition data.
- `VoiceFoodLogger.tsx`: Hands-free logging using Web Speech API with fuzzy matching.
- `BarcodeScanner.tsx`: Interface for camera-based barcode scanning (ZXing).
- `WaterTracker.tsx`: Daily hydration tracking against a 2000ml goal.
- `BodyMeasurements.tsx`: Tracker for weight, body fat, and dimensions with unit conversions.
- `StreakCard.tsx`: Displays current and longest logging streaks.
- `PageLoading.tsx`: Minimal spinner used as a Suspense fallback.

### Page Components (`/src/pages`)

- `Dashboard.tsx`: Main overview. Integrates food logging (manual/barcode/voice), hydration
  tracking, and streaks. Refactored with 5-section editorial layout.
- `Recipes.tsx`: User-defined recipe management system.
- `Progress.tsx`: Data visualizations (Recharts) and body measurement history.

## Operational Standards

- **Theme Management:** class-based dark mode toggled via `App.tsx` and persisted in `localStorage`.
- **Database Safety:** `clearDatabase()` is disabled in production. Schema recovery is restricted to
  development environments.
- **Testing:** Every component and logic file must have a `.test.ts/tsx` counterpart. Target
  coverage is >80%.
- **Validation:** User input is sanitized (e.g., `sanitizeVoiceTranscript`) before reaching the
  store or database.
- **Security:** CSP restricts hardware (camera/mic) to `self` and disables geolocation.

## Roadmap (v0.0.8)

- [ ] Step Tracking (Feature 5 - follows useWaterForm pattern; `StepLog` entity, `StepTracker`
  component)
- [ ] Macro nutrient breakdown display for recipes (on recipe card + log entry)
- [ ] Component test coverage >80% (targeting all Dashboard sub-components)
- [ ] Advanced filtering and search (date range, meal type filters)

---
**Last Updated:** May 9, 2026

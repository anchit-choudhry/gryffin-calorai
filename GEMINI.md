# Project Documentation: Gryffin Calorai (v0.2.0)

## Architectural Overview

Gryffin Calorai is a client-side, offline-first React single-page application (SPA). It is designed
for privacy and speed, persisting all data locally via IndexedDB (Dexie.js) without a backend
dependency.

- **Routing:** Hash-based navigation (`window.location.hash`) using `React.lazy` and `Suspense` for
  code-splitting.
- **State Management:** Global state is managed by a single Zustand store (`src/state/AppState.ts`).
- **Persistence:** Local storage via Dexie.js (currently **schema version 9**) with compound indices
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
  recipes, water intake, body measurements, step logs, user achievements, and tour state.
- `db/dbService.ts`: Dexie.js service layer. Defines schema v9 (waterLogs, bodyMeasurements,
  stepLogs, userAchievements) and provides CRUD abstractions.
- `types/index.ts`: Domain models and branded types (UserId, FoodItemId, RecipeId, WaterLogId,
  BodyMeasurementId, StepLogId, UserAchievementId, ISODate). Includes sanitizers for inputs and
  utility functions for streaks, fuzzy matching, and unit conversions. **Note: All ID-based
  interactions require numeric factory-function wrappers.**

### UI Components (`/src/components`)

- `Dashboard/`: Sub-components for the main overview (Hero, DateKicker, LogEntry, MacroStat).
- `Recipes/`: Recipe management system (Form, List, Row, IngredientRow).
- `Progress/`: Visualization components (ProgressHero).
- `Charts/`: Shared chart primitives (Legend, Tooltip, EditorialChartCard).
- `Tour/`: Product tour system (Overlay, CoachmarkCard, spotlight logic).
- `FoodLogger.tsx`: Nutrition logging form.
- `VoiceFoodLogger.tsx`: Web Speech API logging.
- `BarcodeScanner.tsx`: ZXing-based barcode interface.
- `WaterTracker.tsx`: Hydration tracking.
- `StepTracker.tsx`: Daily step logging.
- `BodyMeasurements.tsx`: Physical metric tracking.
- `StreakCard.tsx`: Streak visualization.
- `KeyboardShortcutsOverlay.tsx`: Command visibility.
- `PageLoading.tsx`: Suspense fallback.

### Page Components (`/src/pages`)

- `Dashboard.tsx`: Main overview with editorial layout.
- `Recipes.tsx`: User-defined recipe management.
- `Progress.tsx`: Data visualizations and history tracking.

## Operational Standards

- **Theme Management:** class-based dark mode toggled via `App.tsx`.
- **Database Safety:** `clearDatabase()` disabled in production.
- **Testing:** Every component/logic file must have a `.test.ts/tsx` counterpart. Coverage target >80%.
- **Validation:** Input sanitization (e.g., `sanitizeVoiceTranscript`) required.
- **Security:** CSP restricts hardware to `self` and disables geolocation.

## Testing & Mocking Standards

- **Mocking**: Use `vi.mocked()` for DB services. `vi.spyOn()` for read-only properties.
- **Factory Functions**: Use numeric wrappers for test data to ensure type safety.
- **Isolation**: Use `vi.resetModules()` for IIFE-initialized state (e.g., `AppState.ts`).

## Development Lifecycle

- **Pre-Commit**: Run `pnpm lint:fix` and `pnpm build`.
- **Testing**: Run `pnpm test` for coverage verification.

## Roadmap (v0.2.1+)

- [ ] Macro nutrient breakdown for recipes (visual on recipe card + log entry)
- [ ] Component test coverage >80% for remaining UI components
- [ ] Barcode → food lookup API integration
- [ ] Weekly/monthly data export (PDF, CSV)
- [ ] Body Measurements UI refresh/enhanced viz
- [ ] Multi-user auth, PWA / offline sync

---
**Last Updated:** May 17, 2026 (v0.2.0 release)

# Project Documentation: Gryffin Calorai

## Architectural Overview

The application is a client-side, state-persistent React single-page application (SPA). It utilizes a hash-based routing mechanism to manage navigation between views without server-side routing. Data persistence is handled locally via IndexedDB (Dexie.js), and global state management is facilitated by Zustand.

## Core File Documentation

### Configuration & Tooling

- `package.json`: Manages dependencies and defines project scripts (`dev`, `build`, `preview`). Uses `pnpm` workspace standards.
- `vite.config.ts`: Configures the build system and plugins, notably `@tailwindcss/vite` for optimized Tailwind v4 processing.
- `tsconfig.json`: TypeScript configuration, strict-mode enabled with path mappings for module resolution.
- `postcss.config.js`: PostCSS configuration for styling post-processing, primarily supporting `@tailwindcss/postcss`.
- `tailwind.config.js`: Legacy configuration retained for compatibility; v4 transitions now favor CSS-level `@import "tailwindcss";` directives.

### Application Logic & State (`/src`)

- `main.tsx`: Application entry point; mounts the React root and renders the `App` component.
- `App.tsx`: Orchestrator component. Manages global hash-based routing, dark/light theme state, and initialization of services (database, global store).
- `style.css`: Global entry point for styles. Implements Tailwind v4 via `@import "tailwindcss";`.
- `state/AppState.ts`: Zustand store definition. Holds the application's global business logic and state for caloric data, recipe collections, and progress tracking.
- `db/dbService.ts`: Dexie.js database schema definition and CRUD operation abstractions for local persistent storage.

### UI Components (`/src/components`)

- `BarcodeScanner.tsx`: Interface for scanning product barcodes.
- `FoodLogger.tsx`: Form-based component for logging caloric intake data into the persistent store.

### Page Components (`/src/pages`)

- `Dashboard.tsx`: Main overview page. Displays data visualizations using `react-chartjs-2`.
- `Recipes.tsx`: Interface for browsing and searching user-defined recipes.
- `Progress.tsx`: Data visualization page tracking dietary patterns over time.

## Operational Paradigms

- **Theme Management:** Logic resides in `App.tsx` (using `localStorage` + `document.documentElement` class manipulation).
- **Navigation:** Managed via `window.location.hash` observers inside the `App` component.
- **Database:** Dexie.js is treated as an asynchronous service layer (`dbService.ts`).

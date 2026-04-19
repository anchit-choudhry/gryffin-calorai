# Gryffin Calorai Application Project Documentation

## Project Overview

A React/Vite-based calorie counter application designed for MVP-level functionality. The app uses Zustand for state management and IndexedDB (Dexie.js) for local data persistence.

## Current State

- **Architecture:** React/Vite with Tailwind CSS (PostCSS) for styling.
- **Entry Point:** Properly configured `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- **Database:** IndexedDB (Dexie.js) configured with tables for `users`, `foodItems`, and `recipes`. Schema uses compound indices (`[userId+dateLogged]`) for query optimization.
- **Features Implemented:**
  - Database initialization.
  - User profile creation/retrieval.
  - Logging food items.
  - Basic dashboard view.
  - Recipe manager placeholder.
  - Dark Mode support (class-based).
  - Modernized navigation header.

## Technical Configuration

- **Styling:** Tailwind CSS (configured with `@tailwindcss/postcss`).
- **TypeScript:** Strict configuration with `jsx: 'react-jsx'` and type-only imports (`verbatimModuleSyntax`).
- **Testing:** `vitest` with `jsdom`.

## Key Files

- `src/App.tsx`: Main application component, handles routing layout and dark mode theme.
- `src/db/dbService.ts`: Dexie.js database schema definition and data access layer.
- `src/state/AppState.ts`: Zustand store for application-wide state.
- `tailwind.config.js`: Tailwind configuration (using `darkMode: 'class'`).

## Known Issues / Next Steps

- [ ] **Polishing:** The UI remains functional but requires further styling (e.g., dashboard data visualization, recipe list layout).
- [ ] **Navigation:** Integrate a full routing solution (e.g., `react-router-dom`).
- [ ] **Testing:** Expand unit test coverage for `dbService` and `AppState`.
- [ ] **Features:** Implement Barcode Scanning and User Account/Data Synchronization features.

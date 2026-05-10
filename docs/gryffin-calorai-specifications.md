# Gryffin Calorai: Complete Application Specification

**Project:** Gryffin Calorai
**Version:** 0.0.4 (current)
**Type:** Single-Page Application (React/Vite SPA)
**Status:** Active Development
**Last Updated:** May 9, 2026
**Analysis Scope:** src/ folder reverse-engineering + release-notes/ 0.0.1 - 0.0.4

---

## 1. Executive Summary

Gryffin Calorai is a privacy-first calorie tracking application that runs entirely in the browser
using IndexedDB for local data persistence. No backend server is used. Users log daily food intake
with macronutrients and meal types, track water intake, record body measurements, and visualize
calorie trends over time. All data remains on the user's device.

**Core Value Proposition:** Offline-first health tracking with zero server dependency and zero data
exposure.

**Cumulative Feature Set (v0.0.1 - v0.0.4):**

- Manual food logging with macros (protein, carbs, fat), meal types, and favorites
- Recipe manager with dynamic ingredient composition
- Progress charts - 7-day and 30-day calorie visualization
- Voice food logging via Web Speech API with fuzzy matching (v0.0.4)
- Water intake tracking with daily goal (v0.0.4)
- Body measurements (weight, body fat, waist, chest, hips) with unit conversion (v0.0.4)
- Logging streak tracking - current and best (v0.0.4)
- Weekly summary metrics (v0.0.3)
- Barcode scanner - camera functional; food-lookup API not yet integrated (v0.0.3)
- Dark mode with OS preference detection and localStorage persistence (v0.0.1)
- ErrorBoundary for crash recovery (v0.0.2)
- HTTP security headers: CSP, X-Frame-Options, Permissions-Policy, Referrer-Policy (v0.0.4)
- Code-split vendor bundles; lazy-loaded pages and BarcodeScanner (v0.0.4)
- 11 GitHub Actions CI/CD workflows; coverage reporting (v0.0.2)

---

## 2. Technology Stack

### Frontend Framework

| Technology      | Version | Role                                                       |
|-----------------|---------|------------------------------------------------------------|
| React           | 19      | Component library, automatic JSX transform                 |
| Vite (Rolldown) | 8       | Build tool: HMR, code splitting, compression               |
| TypeScript      | 6       | Strict mode, `verbatimModuleSyntax`, `react-jsx` transform |

### State Management and Storage

| Technology | Version | Role                                     |
|------------|---------|------------------------------------------|
| Zustand    | 5       | Single global store, hook-based actions  |
| Dexie.js   | 4       | IndexedDB abstraction, schema migrations |

Database name: `GryffinCaloraiDB` (client-side only, no server)

### UI and Styling

| Technology      | Version | Role                                             |
|-----------------|---------|--------------------------------------------------|
| Tailwind CSS    | 4       | Utility-first CSS, `dark: class`-based dark mode |
| React Icons     | 5       | SVG icon set (Feather, Material Design)          |
| Chart.js        | 4       | Bar and line charts                              |
| react-chartjs-2 | 5       | React wrapper for Chart.js                       |

### Developer Tooling

| Technology          | Version | Role                                             |
|---------------------|---------|--------------------------------------------------|
| Vitest              | 4       | Unit/integration test runner (jsdom environment) |
| @vitest/coverage-v8 | 4       | V8 coverage reporter (added v0.0.4)              |
| fake-indexeddb      | 6       | Mock IndexedDB for test isolation                |
| ESLint              | 10      | React hooks and TypeScript linting               |
| Prettier            | 3       | Code formatting                                  |

---

## 3. Architecture Overview

### Application Entry Point

```
index.html
  -> src/main.tsx
       <StrictMode>
         <ErrorBoundary>
           <App />
```

`src/App.tsx` manages:

- Hash-based routing (`window.location.hash`)
- Dark mode state and persistence
- DB initialization via `useLayoutEffect`
- `React.lazy` + `<Suspense fallback={<PageLoading />}>` for all pages

### Component Hierarchy

```
<App>
  <nav>
    Logo ("C" + "Gryffin Calorai")
    Nav links: Dashboard | Recipes | Progress
    Dark mode toggle button
  </nav>
  <main>
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        #dashboard -> <Dashboard>  (lazy)
          Summary card (total calories, progress bar, goal editor)
          Macro breakdown cards (protein, carbs, fat)
          <WeeklySummary />
          2-col grid: <StreakCard /> + <WaterTracker />
          Favorites quick-add bar
          3-col logging grid:
            <FoodLogger />
            <Suspense> -> <BarcodeScanner /> (lazy, defers @zxing)
            <VoiceFoodLogger />
          Daily log history (list with edit / delete / favorite actions)

        #recipes  -> <Recipes>    (lazy)
          Recipe creation form (name, description, dynamic ingredients)
          Saved recipes list with delete

        #progress -> <Progress>   (lazy)
          7-day calorie bar chart (grouped by meal type)
          30-day calorie line chart (with goal reference line)
          <BodyMeasurements />
            Unit toggles (kg/lb, cm/in)
            Measurement entry form
            Weight trend line chart (shown when >= 2 entries with weight)
            Measurement history table (newest first)
      </Suspense>
    </ErrorBoundary>
  </main>
```

### State Management

**Single Zustand Store (`src/state/AppState.ts`):**

```typescript
interface AppState {
  user: UserProfile | null
  dailyLogs: FoodItem[]         // today's entries
  allFoodItems: FoodItem[]      // deduplicated recent items for suggestions
  recipes: Recipe[]
  favoriteFoods: FoodItem[]     // items with isFavorite = true
  dailyWaterLogs: WaterLog[]    // today's water entries
  bodyMeasurements: BodyMeasurement[]
  isLoading: boolean            // initialized to true
  error: string | null
  userId: UserId | null
}
```

**Actions** (all async, all use `error instanceof Error ? error.message : "..."` pattern):

| Action                           | DB calls                                                                                                                              |
|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `fetchInitialData(userId)`       | getOrCreateUser, getDailyFoodLogs, getAllRecipes, getRecentFoodItems, getFavoriteFoodItems, getDailyWaterLogs, getAllBodyMeasurements |
| `refreshDailyLogs(userId)`       | getDailyFoodLogs                                                                                                                      |
| `addFoodLog(food)`               | addFoodItemLog -> refreshDailyLogs                                                                                                    |
| `deleteFoodLog(id)`              | deleteFoodItem(id, userId) -> refreshDailyLogs                                                                                        |
| `updateFoodLog(id, updates)`     | updateFoodItem(id, updates, userId) -> refreshDailyLogs                                                                               |
| `toggleFavorite(id, isFavorite)` | toggleFavoriteFoodItem -> fetchFavorites + fetchAllFoodItems                                                                          |
| `fetchFavorites(userId)`         | getFavoriteFoodItems                                                                                                                  |
| `updateCalorieGoal(goal)`        | updateUserProfile(updatedUser, userId)                                                                                                |
| `fetchRecipes(userId)`           | getAllRecipes                                                                                                                         |
| `deleteRecipe(id)`               | deleteRecipe(id, userId) -> fetchRecipes                                                                                              |
| `fetchAllFoodItems(userId)`      | getRecentFoodItems                                                                                                                    |
| `addWaterLog(amount)`            | addWaterLogToDB -> fetchDailyWaterLogs                                                                                                |
| `deleteWaterLog(id)`             | deleteWaterLog(id, userId) -> fetchDailyWaterLogs                                                                                     |
| `fetchDailyWaterLogs(userId)`    | getDailyWaterLogs                                                                                                                     |
| `addBodyMeasurement(m)`          | addBodyMeasurementToDB -> fetchBodyMeasurements                                                                                       |
| `deleteBodyMeasurement(id)`      | deleteBodyMeasurement(id, userId) -> fetchBodyMeasurements                                                                            |
| `fetchBodyMeasurements(userId)`  | getAllBodyMeasurements                                                                                                                |

**State initialization flow:**

1. `App.tsx` `useLayoutEffect` calls `initializeDB()` then `fetchInitialData(UserId("1"))`
2. `fetchInitialData` calls `getOrCreateUser("1", "Guest", "guest@example.com")`
3. All data slices are loaded in parallel and set atomically

**Data flow:**

```
User interaction
  -> Custom Hook (form state + validation)
    -> Zustand action
      -> DB Service function
        -> Dexie API
          -> IndexedDB (GryffinCaloraiDB)
```

### Bundle Architecture (`vite.config.ts`)

**Base path:** `/${packageJson.name}/` (sub-path deployment)

**Vendor chunks (Rolldown `manualChunks` function):**

| Chunk            | Matched paths                 |
|------------------|-------------------------------|
| `vendor-react`   | `react/`, `react-dom`         |
| `vendor-charts`  | `chart.js`, `react-chartjs-2` |
| `vendor-barcode` | `@zxing`                      |
| `vendor-db`      | `dexie`                       |
| `vendor-icons`   | `react-icons`                 |
| `vendor-state`   | `zustand`                     |

All three page components and `BarcodeScanner` are `React.lazy`-loaded. `BarcodeScanner` has its own
nested `<Suspense>` boundary, keeping `vendor-barcode` out of the initial load.

---

## 4. Data Model and Schema

### Database: `GryffinCaloraiDB` (Dexie/IndexedDB)

**Current Schema Version: 7**

#### Schema Version History

| Version | Change                                              | Migration                                         |
|---------|-----------------------------------------------------|---------------------------------------------------|
| v1      | `users`, `foodItems`, `recipes`                     | -                                                 |
| v2      | `calorieGoal` on users; `userId` index on foodItems | backfills `calorieGoal = 2000` for existing users |
| v3      | `protein`, `carbs`, `fat` on foodItems              | backfills all three to `0`                        |
| v4      | `isFavorite` on foodItems                           | backfills to `false`                              |
| v5      | `mealType` on foodItems                             | backfills to `"Breakfast"`                        |
| v6      | `waterLogs` table                                   | -                                                 |
| v7      | `bodyMeasurements` table (current)                  | -                                                 |

---

#### Table: `users`

**Primary key:** `id` (UserId - string)
**Indices:** `id, username, email, lastLogin`

```typescript
interface UserProfile {
  id: UserId;           // "1" (hardcoded single user)
  username: string;     // "Guest"
  email: string;        // "guest@example.com"
  lastLogin: string;    // ISO 8601 timestamp, updated on every getOrCreateUser() call
  calorieGoal: number;  // default 2000 kcal; validated range [1, 99999]
}
```

Single user per session; no authentication. `updateUserProfile` enforces
`profile.id === requestingUserId` before writing.

---

#### Table: `foodItems`

**Primary key:** `++id` (auto-increment FoodItemId)
**Compound index:** `[userId+dateLogged]` - all daily queries use this index
**Other indices:** `userId, name, calories, servingSize, dateLogged, isFavorite, mealType`

```typescript
interface FoodItem {
  id?: FoodItemId;
  name: string;           // 1-100 chars (validated in useFoodForm)
  calories: number;       // 0-10000 kcal (validated)
  servingSize: number;    // 1-100 (validated)
  protein: number;        // 0-500g (validated)
  carbs: number;          // 0-500g (validated)
  fat: number;            // 0-500g (validated)
  dateLogged: ISODate;    // YYYY-MM-DD
  userId: UserId;
  isFavorite: boolean;
  mealType?: MealType;    // "Breakfast" | "Lunch" | "Snacks" | "Dinner"
}
```

`deleteFoodItem`, `toggleFavoriteFoodItem`, and `updateFoodItem` all verify `item.userId === userId`
before mutating; silently no-op if mismatch.

`getRecentFoodItems` deduplicates by name (most recent item per distinct name).

---

#### Table: `recipes`

**Primary key:** `++id` (auto-increment RecipeId)
**Indices:** `name, description, createdBy, dateCreated, userId`

```typescript
interface Recipe {
  id?: RecipeId;
  name: string;
  description: string;
  ingredients: Array<{
    foodItemId: FoodItemId;
    quantity: number;   // stored; not used in calorie calculation
    serving: number;    // stored; not used in calorie calculation
  }>;
  totalCalories: number; // currently: ingredients.length * 100 (known debt)
  createdBy: UserId;
  dateCreated: string;   // ISO 8601 timestamp
  userId: UserId;
}
```

`deleteRecipe` verifies `recipe.userId === userId` before deleting.

**Known debt:** `totalCalories` is hardcoded as `ingredients.length * 100`. Ingredient `quantity`
and `serving` fields are stored but ignored in calorie math.

---

#### Table: `waterLogs`

**Primary key:** `++id` (auto-increment WaterLogId)
**Compound index:** `[userId+dateLogged]`
**Other indices:** `userId, dateLogged`

```typescript
interface WaterLog {
  id?: WaterLogId;
  userId: UserId;
  amount: number;       // ml
  dateLogged: ISODate;  // YYYY-MM-DD
  loggedAt: string;     // ISO 8601 timestamp for intra-day ordering
}
```

`addWaterLog(amount)` in AppState constructs the full `WaterLog` object (with
`loggedAt: new Date().toISOString()`) before passing to DB.

`deleteWaterLog` verifies `log.userId === userId` before deleting.

---

#### Table: `bodyMeasurements`

**Primary key:** `++id` (auto-increment BodyMeasurementId)
**Compound index:** `[userId+measuredAt]`
**Other indices:** `userId, measuredAt`

```typescript
interface BodyMeasurement {
  id?: BodyMeasurementId;
  userId: UserId;
  measuredAt: ISODate;    // YYYY-MM-DD
  weight?: number;        // kg (display converts to lb if unit = "lb")
  bodyFat?: number;       // % (no unit conversion)
  waist?: number;         // cm (display converts to in if unit = "in")
  chest?: number;         // cm (display converts to in)
  hips?: number;          // cm (display converts to in)
}
```

All fields except `userId` and `measuredAt` are optional. `getAllBodyMeasurements` returns records
sorted by `measuredAt` ascending. History table displays in reverse order (newest first).

`deleteBodyMeasurement` verifies `m.userId === userId` before deleting.

---

### Branded Type System

Compile-time ID safety via TypeScript intersection types. Zero runtime cost.

```typescript
// src/types/index.ts
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId            = Brand<string, "UserId">
export type FoodItemId        = Brand<number, "FoodItemId">
export type RecipeId          = Brand<number, "RecipeId">
export type WaterLogId        = Brand<number, "WaterLogId">
export type BodyMeasurementId = Brand<number, "BodyMeasurementId">
export type ISODate           = Brand<string, "ISODate">
```

Each branded type has a constructor function (raw cast) and a type guard (runtime validation):

| Type                                                                   | Guard logic                                     |
|------------------------------------------------------------------------|-------------------------------------------------|
| `isUserId`                                                             | `typeof value === "string" && value.length > 0` |
| `isFoodItemId` / `isRecipeId` / `isWaterLogId` / `isBodyMeasurementId` | `typeof value === "number" && value > 0`        |
| `isISODate`                                                            | `/^\d{4}-\d{2}-\d{2}$/.test(value)`             |

### Utility Functions (`src/types/index.ts`)

| Function                                     | Behavior                                                                                                                                                                    |
|----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `todayISO()`                                 | Returns `new Date().toISOString().split("T")[0]` as `ISODate`                                                                                                               |
| `kgToLb(kg)`                                 | `Math.round(kg * 2.20462 * 10) / 10`                                                                                                                                        |
| `lbToKg(lb)`                                 | `Math.round((lb / 2.20462) * 100) / 100`                                                                                                                                    |
| `cmToIn(cm)`                                 | `Math.round((cm / 2.54) * 10) / 10`                                                                                                                                         |
| `inToCm(inch)`                               | `Math.round(inch * 2.54 * 10) / 10`                                                                                                                                         |
| `sanitizeBarcodeInput(raw)`                  | Strips non-printable ASCII (`/[^\x20-\x7E]/g`), trims; returns `null` if empty or >100 chars                                                                                |
| `sanitizeVoiceTranscript(raw)`               | Strips chars with code < 0x20 or = 0x7F, collapses whitespace; returns `null` if empty or >200 chars                                                                        |
| `fuzzyMatchFoodName(query, corpus, limit=3)` | Scores by exact/prefix/substring/Levenshtein; threshold = `max(2, floor(queryLength/4))`; returns up to `limit` matches                                                     |
| `computeStreaks(uniqueDates)`                | Returns `{ currentStreak, longestStreak }`; walks back from today (or yesterday if today has no log) for current streak; scans all sorted dates for longest consecutive run |

**Constants:**

| Constant              | Value                                                   |
|-----------------------|---------------------------------------------------------|
| `DAILY_WATER_GOAL_ML` | `2000`                                                  |
| `MEAL_TYPES`          | `["Breakfast", "Lunch", "Snacks", "Dinner"]` (readonly) |
| `DEFAULT_MEAL_TYPE`   | `"Breakfast"`                                           |

---

## 5. Features and Observed Requirements (EARS Format)

### Feature 1: Food Logging

**Evidence:** `src/components/FoodLogger.tsx`, `src/hooks/useFoodForm.ts`,
`src/db/dbService.ts:addFoodItemLog`, `src/state/AppState.ts:addFoodLog`

**OBS-FOOD-001 - Storage**
The system shall store food log entries in the `foodItems` table with userId, date, calories,
macros, meal type, and favorite flag.

**OBS-FOOD-002 - Validation**
When the user submits the FoodLogger form with any field out of range (name: 1-100 chars; calories:
0-10000; servingSize: 1-100; protein/carbs/fat: 0-500g), the system shall display an error message
and block the DB write.

**OBS-FOOD-003 - Loading gate**
While `isLoading` is true in the form hook, the system shall disable the submit button.

**OBS-FOOD-004 - Success feedback**
When a food item is successfully logged, the system shall display a success message referencing the
food name.

**OBS-FOOD-005 - Daily refresh**
When `addFoodLog()` or `deleteFoodLog()` completes, the system shall call `refreshDailyLogs()` to
re-query today's entries from IndexedDB.

**OBS-FOOD-006 - Delete ownership**
When the user deletes a food log, `deleteFoodItem` shall silently no-op if `item.userId !== userId`.

**OBS-FOOD-007 - Edit**
When the user edits an existing log entry, `updateFoodItem` shall update only the fields provided in
`Partial<Omit<FoodItem,"id"|"userId">>` and verify ownership before writing.

**OBS-FOOD-008 - Favorites**
When the user toggles favorite on an entry, `toggleFavoriteFoodItem` shall verify ownership, update
`isFavorite`, then refresh both `favoriteFoods` and `allFoodItems` in AppState.

**OBS-FOOD-009 - Daily totals**
The system shall compute daily totals (total calories, protein, carbs, fat) in memory by summing
`dailyLogs`; no aggregation occurs at write time.

---

### Feature 2: Calorie Goal

**Evidence:** `src/state/AppState.ts:updateCalorieGoal`, `src/db/dbService.ts:updateUserProfile`

**OBS-GOAL-001 - Default**
The system shall assign `calorieGoal = 2000` kcal to newly created users (set in `getOrCreateUser`).

**OBS-GOAL-002 - Validation**
`updateCalorieGoal` shall silently no-op if `!Number.isFinite(goal) || goal < 1 || goal > 99999`.

**OBS-GOAL-003 - Progress bar**
The system shall display progress as `(totalCalories / calorieGoal) * 100`; the bar is capped at
100% for display.

**OBS-GOAL-004 - Ownership**
`updateUserProfile` shall throw `"Unauthorized: cannot modify another user's profile"` if
`profile.id !== requestingUserId`.

---

### Feature 3: Recipe Management

**Evidence:** `src/db/dbService.ts`, `src/hooks/useRecipeForm.ts`, `src/pages/Recipes.tsx`

**OBS-RECIPE-001 - Creation**
When the user saves a recipe with a name and at least one ingredient, the system shall persist it to
the `recipes` table and refresh the recipe list.

**OBS-RECIPE-002 - Calorie calculation (current)**
The system shall compute `totalCalories` as `ingredients.length * 100`. This is a known inaccuracy.

**OBS-RECIPE-003 - Ingredient selector**
When the user selects a food item from the ingredient dropdown, the system shall populate the row
from `allFoodItems` in AppState.

**OBS-RECIPE-004 - Delete ownership**
When the user deletes a recipe, `deleteRecipe` shall silently no-op if `recipe.userId !== userId`.

---

### Feature 4: Progress Visualization

**Evidence:** `src/pages/Progress.tsx`, `src/hooks/useProgressData.ts`

**OBS-PROGRESS-001 - 7-day chart**
The Progress page shall render a grouped bar chart of daily calorie totals for the last 7 days, with
bars color-coded by meal type (Breakfast, Lunch, Snacks, Dinner).

**OBS-PROGRESS-002 - 30-day chart**
The Progress page shall render a line chart of daily calorie totals for the last 30 days, with a
dashed reference line at `user.calorieGoal`.

**OBS-PROGRESS-003 - Data aggregation**
`useProgressData` shall fetch all user logs via `getAllFoodLogs(userId)`, group by date, and sum
calories per day. Days with no logs shall default to 0.

---

### Feature 5: Weekly Summary

**Evidence:** `src/components/WeeklySummary.tsx`, `src/hooks/useWeeklySummary.ts`

**OBS-WEEKLY-001 - Metrics**
The WeeklySummary component shall display: 7-day average daily calories, number of days on target (
within calorie goal), and consistency percentage.

**OBS-WEEKLY-002 - Data source**
The `useWeeklySummary` hook shall derive all metrics from the last 7 days of `allFoodItems` in
AppState without additional DB queries.

---

### Feature 6: Barcode Scanner

**Evidence:** `src/components/BarcodeScanner.tsx`, `src/hooks/useBarcodeScanner.ts`,
`src/types/index.ts:sanitizeBarcodeInput`

**OBS-BARCODE-001 - Camera access**
Where the user grants camera permission, the system shall activate the device camera and attempt
barcode decoding via `@zxing/browser`.

**OBS-BARCODE-002 - Lazy loading**
The system shall lazy-load `BarcodeScanner` via a nested `<Suspense>` boundary, keeping
`vendor-barcode` (`@zxing`) out of the initial JS bundle.

**OBS-BARCODE-003 - Sanitization**
The system shall pass all raw barcode scan strings through `sanitizeBarcodeInput()` (strips
non-printable ASCII; max 100 chars) before any further processing.

**OBS-BARCODE-004 - Lookup not implemented**
The barcode-to-food-lookup API is not implemented. Camera scanning is functional; the barcode string
is not yet used to fetch nutritional data.

---

### Feature 7: Voice Food Logging

**Evidence:** `src/components/VoiceFoodLogger.tsx`, `src/hooks/useVoiceCapture.ts`,
`src/types/index.ts:sanitizeVoiceTranscript,fuzzyMatchFoodName`

**OBS-VOICE-001 - Capture**
When the user activates the mic button, the system shall start a `SpeechRecognition` (or
`webkitSpeechRecognition`) session and display the live transcript.

**OBS-VOICE-002 - Sanitization**
The system shall pass all transcripts through `sanitizeVoiceTranscript()` (strips chars code < 0x20
or = 0x7F, collapses whitespace, max 200 chars) before use.

**OBS-VOICE-003 - Fuzzy match**
When a sanitized transcript is available, the system shall call
`fuzzyMatchFoodName(query, corpus, limit=3)` against `allFoodItems` and `favoriteFoods` using
Levenshtein distance with threshold `max(2, floor(queryLength/4))`.

**OBS-VOICE-004 - Pre-fill confirmation**
When a match is found, the system shall pre-populate `FoodLogger` inline (same pattern as the
barcode flow) for user confirmation before logging.

**OBS-VOICE-005 - Browser compatibility guard**
Where `SpeechRecognition` is unavailable (e.g., Firefox), the system shall display a graceful
fallback message rather than throwing an error.

---

### Feature 8: Water Tracking

**Evidence:** `src/components/WaterTracker.tsx`, `src/hooks/useWaterForm.ts`,
`src/db/dbService.ts:waterLogs`

**OBS-WATER-001 - Storage**
The system shall store water log entries in the `waterLogs` table with `userId`, `amount` (ml),
`dateLogged`, and `loggedAt` (ISO timestamp for intra-day ordering).

**OBS-WATER-002 - Daily goal**
The WaterTracker shall display today's total water intake against `DAILY_WATER_GOAL_ML = 2000 ml`.

**OBS-WATER-003 - Quick-add**
The WaterTracker shall provide quick-add buttons for predefined amounts, submitting a water log
without requiring manual text entry.

**OBS-WATER-004 - Delete ownership**
When the user deletes a water log, `deleteWaterLog` shall silently no-op if `log.userId !== userId`.

---

### Feature 9: Body Measurements

**Evidence:** `src/components/BodyMeasurements.tsx`, `src/hooks/useBodyForm.ts`,
`src/db/dbService.ts:bodyMeasurements`

**OBS-BODY-001 - Storage**
The system shall store body measurements in `bodyMeasurements` with fields: `weight` (kg),
`bodyFat` (%), `waist` (cm), `chest` (cm), `hips` (cm). All measurement fields are optional; only
`userId` and `measuredAt` are required.

**OBS-BODY-002 - Unit display**
The system shall convert displayed weight via `kgToLb()` when the user selects "lb", and length
measurements via `cmToIn()` when the user selects "in". Unit preference is local component state and
does not create a new DB record.

**OBS-BODY-003 - Weight chart**
The BodyMeasurements component shall render a weight line chart using Chart.js (purple:
`rgb(168, 85, 247)`) only when there are 2 or more measurements with a `weight` value.

**OBS-BODY-004 - History table**
The component shall display all body measurements in reverse chronological order (newest first) with
columns: Date, Weight, Body Fat, Waist, Chest, Hips, Delete.

**OBS-BODY-005 - Delete ownership**
`deleteBodyMeasurement` shall silently no-op if `m.userId !== userId`.

---

### Feature 10: Streak Tracking

**Evidence:** `src/components/StreakCard.tsx`, `src/hooks/useStreaks.ts`,
`src/types/index.ts:computeStreaks`

**OBS-STREAK-001 - Computation**
`computeStreaks(uniqueDates)` shall:

- Walk back from today (or yesterday if today has no log) to find `currentStreak`
- Scan all sorted dates for the longest consecutive daily run (`longestStreak`)

**OBS-STREAK-002 - Display**
The StreakCard shall display `currentStreak` labeled "Current" and `longestStreak` labeled "Best".

**OBS-STREAK-003 - Icons**
The StreakCard shall show: 🔥 (>= 7-day streak), ⚡ (>= 3-day streak), 📅 (otherwise).

**OBS-STREAK-004 - Loading state**
While `isLoading` is true from `useStreaks`, the StreakCard shall render an animated pulse skeleton.

---

### Feature 11: Dark Mode

**Evidence:** `src/App.tsx`

**OBS-DARK-001 - Init**
On app load, dark mode state is initialized from `localStorage.getItem("darkMode")` via `JSON.parse`
with try/catch fallback to `window.matchMedia("(prefers-color-scheme: dark)").matches`.

**OBS-DARK-002 - Toggle**
When the user clicks the toggle button, the system shall add or remove the `dark` class on
`document.documentElement` and call `localStorage.setItem("darkMode", JSON.stringify(isDark))`.

**OBS-DARK-003 - Layout effect**
A `useLayoutEffect` watches `darkMode` state and applies the `dark` class synchronously before paint
to prevent flash of wrong theme.

---

### Feature 12: Error Boundary

**Evidence:** `src/components/ErrorBoundary.tsx`, `src/main.tsx`, `src/App.tsx`

**OBS-ERROR-001 - Placement**
The `ErrorBoundary` wraps the `<Suspense>` boundary inside `<main>`, not the entire app - navigation
remains functional if a page throws.

**OBS-ERROR-002 - Fallback UI**
When a React component throws during render, the ErrorBoundary shall display: the error message, a
unique error ID, and a "Reload Page" button.

**OBS-ERROR-003 - Reload**
When the user clicks "Reload Page", the system shall call `window.location.reload()`.

**OBS-ERROR-004 - Scope**
The ErrorBoundary catches only synchronous React render errors; async errors, event handler errors,
and unhandled promise rejections are not caught.

---

### Feature 13: Navigation

**Evidence:** `src/App.tsx`

**OBS-NAV-001 - Hash routing**
The system shall read `window.location.hash` on mount and on every `hashchange` event to determine
the active page.

**OBS-NAV-002 - Routes**
`#dashboard` (default) renders `<Dashboard>`, `#recipes` renders `<Recipes>`, `#progress` renders
`<Progress>`. Any unknown hash defaults to Dashboard.

**OBS-NAV-003 - No router library**
Navigation is implemented entirely in `App.tsx` via `window.location.hash` and an event listener; no
router library is used.

---

## 6. Non-Functional Requirements

### Security

**Evidence:** `vite.config.ts`, `public/_headers`, `src/db/dbService.ts`

#### HTTP Security Headers

The following headers are applied in three layers:

| Layer          | Where applied                                                                                           |
|----------------|---------------------------------------------------------------------------------------------------------|
| Dev server     | `vite.config.ts` `server.headers` - CSP **excluded** (blocked Vite Fast Refresh inline script)          |
| Preview server | `vite.config.ts` `preview.headers` - full CSP applied                                                   |
| Static hosting | `public/_headers` (Cloudflare Pages / Netlify) - matches preview headers exactly                        |
| index.html     | `<meta http-equiv="Content-Security-Policy">` tag - stripped in dev by `strip-csp-meta-dev` Vite plugin |

**Full CSP directive:**

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';   /* Tailwind JIT requires this */
img-src 'self' data:;
font-src 'self';
connect-src 'self';                  /* barcode API origin to be added here when integrated */
worker-src 'self';
frame-ancestors 'none';              /* enforced via HTTP header only; browsers ignore this in meta tags */
base-uri 'self';
form-action 'self';
```

**Other headers (applied in all modes including dev):**

| Header                   | Value                                              |
|--------------------------|----------------------------------------------------|
| `X-Frame-Options`        | `DENY`                                             |
| `X-Content-Type-Options` | `nosniff`                                          |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`                  |
| `Permissions-Policy`     | `camera=(self), microphone=(self), geolocation=()` |

#### Database Security

| Observation                                                                                                                         | Evidence                     |
|-------------------------------------------------------------------------------------------------------------------------------------|------------------------------|
| `deleteFoodItem`, `deleteRecipe`, `deleteWaterLog`, `deleteBodyMeasurement` check `userId` ownership before mutating                | `dbService.ts`               |
| `toggleFavoriteFoodItem`, `updateFoodItem` check `userId` before mutating                                                           | `dbService.ts`               |
| `updateUserProfile` throws if `profile.id !== requestingUserId`                                                                     | `dbService.ts`               |
| `clearDatabase()` throws in production (`import.meta.env.MODE === "production"`)                                                    | `dbService.ts:clearDatabase` |
| `initializeDB()` schema-conflict auto-recovery (delete + re-open) restricted to non-production; production throws descriptive error | `dbService.ts:initializeDB`  |
| All voice transcripts sanitized via `sanitizeVoiceTranscript()` before use                                                          | `src/types/index.ts`         |
| All barcode scan results sanitized via `sanitizeBarcodeInput()` before use                                                          | `src/types/index.ts`         |
| Error messages use `error instanceof Error ? error.message : "..."` to avoid leaking internals                                      | `AppState.ts`                |

**Known gaps:**

| Gap                                                                                                   | Severity | Location                       |
|-------------------------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                                    | Medium   | `useRecipeForm`, `Recipes.tsx` |
| `getRecentFoodItems` and `getAllFoodLogs` do not use compound index - they use `where("userId")` only | Low      | `dbService.ts`                 |

### Performance

| Observation                                                      | Evidence                                  |
|------------------------------------------------------------------|-------------------------------------------|
| `getDailyFoodLogs` uses compound index `[userId+dateLogged]`     | `dbService.ts`                            |
| `getDailyWaterLogs` uses compound index `[userId+dateLogged]`    | `dbService.ts`                            |
| `getAllBodyMeasurements` uses `where("userId")` index            | `dbService.ts`                            |
| Build output compressed with Gzip and Brotli                     | `vite.config.ts` vite-plugin-compression2 |
| 6 vendor chunks keep per-page JS payloads small                  | `vite.config.ts` manualChunks             |
| `@zxing` (largest dep) deferred until BarcodeScanner is rendered | `Dashboard.tsx` lazy Suspense             |

### Offline Capability

- All data stored in `GryffinCaloraiDB` (IndexedDB) - persists across browser restarts
- No network requests in normal operation
- No service worker in v0.0.4

### Error Handling

| Layer                     | Pattern                                                                         |
|---------------------------|---------------------------------------------------------------------------------|
| React render              | `ErrorBoundary` class component                                                 |
| Async actions in AppState | `try/catch`; sets `error` state; re-throws where callers need to know           |
| DB helpers                | No-op on ownership mismatch; throw on actual DB errors                          |
| DB init                   | Production: throws on schema conflict. Dev: auto-recovers with delete + re-open |

### Testing

| Module                     | Test file                                     | Status                     |
|----------------------------|-----------------------------------------------|----------------------------|
| `dbService.ts`             | `src/db/dbService.test.ts`                    | Implemented                |
| `AppState.ts`              | `src/state/AppState.test.ts`                  | Implemented                |
| `src/types/index.ts`       | `src/types/index.test.ts`                     | Implemented (added v0.0.4) |
| `useVoiceCapture`          | `src/hooks/useVoiceCapture.test.ts`           | Implemented (added v0.0.4) |
| `VoiceFoodLogger`          | `src/components/VoiceFoodLogger.test.tsx`     | Implemented (added v0.0.4) |
| `PageLoading`              | `src/components/PageLoading.test.tsx`         | Implemented (added v0.0.4) |
| `BodyMeasurements`         | `src/components/BodyMeasurements.tsx` related | In progress                |
| `StreakCard`               | `src/components/StreakCard.tsx` related       | In progress                |
| Remaining components/hooks | -                                             | Pending (target >80%)      |

**DB test pattern:**

```typescript
beforeAll(async () => { await db.delete(); await db.open(); await initializeDB(); });
// Uses real Dexie against fake-indexeddb
```

**AppState test pattern:**

```typescript
vi.mock("../db/dbService", () => ({ getOrCreateUser: vi.fn(async () => ({...})), ... }));
// All db exports must be in the mock factory or tests throw "not a function"
```

---

## 7. User Flows and Scenarios

### Scenario 1: First-Time User

1. User opens application at `/#dashboard`
2. `initializeDB()` creates `GryffinCaloraiDB` at schema v7
3. `getOrCreateUser("1", "Guest", "guest@example.com")` creates the user with `calorieGoal = 2000`
4. Dashboard loads with all empty state
5. User can immediately log food

### Scenario 2: Logging Food (Manual)

1. User fills `FoodLogger` form (name, calories, macros, meal type)
2. `useFoodForm.submitFoodLog()` validates all fields
3. Valid: `addFoodLog(food)` action calls `addFoodItemLog(food)` -> `refreshDailyLogs()`
4. `dailyLogs` in AppState updates; Dashboard totals recalculate
5. Success message shown; form resets

### Scenario 3: Voice Logging

1. User clicks mic button in `VoiceFoodLogger`
2. `useVoiceCapture` starts `SpeechRecognition` session
3. User speaks; transcript captured and passed through `sanitizeVoiceTranscript()`
4. `fuzzyMatchFoodName(query, allFoodItems.concat(favoriteFoods))` finds candidates
5. `FoodLogger` pre-filled with match data inline; user confirms or edits
6. Proceeds through same `addFoodLog()` path as manual logging

### Scenario 4: Tracking Water

1. User clicks a quick-add button (e.g., 250 ml) on `WaterTracker`
2. `addWaterLog(250)` action constructs `WaterLog` with `loggedAt: new Date().toISOString()`
3. `addWaterLogToDB(log)` inserts; `fetchDailyWaterLogs()` refreshes `dailyWaterLogs`
4. Progress bar recalculates: `sum(dailyWaterLogs.amount) / 2000 * 100`

### Scenario 5: Logging Body Measurements

1. User on Progress page clicks "+ Log Measurement"
2. Entry form reveals fields: Weight, Body Fat, Waist, Chest, Hips
3. Unit toggles control display and input scale; values converted to metric (kg, cm) before DB write
4. `form.submitMeasurement()` validates, calls `addBodyMeasurement(m)`
5. `fetchBodyMeasurements()` refreshes `bodyMeasurements`
6. Weight chart appears when >= 2 entries with weight; table shows newest entry first

### Scenario 6: Progress Review

1. User navigates to `#progress`
2. `useProgressData(7)` fetches all logs, groups and sums by date
3. 7-day grouped bar chart renders with meal-type color coding
4. User clicks "30 days"; `useProgressData(30)` re-runs; line chart renders with goal reference
5. `BodyMeasurements` section below shows measurements if any exist

### Scenario 7: Dark Mode Persistence

1. User clicks dark mode toggle
2. `toggleDarkMode()`: calls `document.documentElement.classList.add("dark")` and
   `localStorage.setItem("darkMode", "true")`
3. On next page load: `JSON.parse(localStorage.getItem("darkMode"))` restores `true`;
   `useLayoutEffect` applies the class before first paint

---

## 8. API and Query Reference

### DB Service Exports (`src/db/dbService.ts`)

**Initialization:**

```typescript
initializeDB(): Promise<void>
  // Opens GryffinCaloraiDB; dev: auto-recovers from schema conflict; prod: throws

clearDatabase(): Promise<void>
  // Dev only; throws in production
```

**User:**

```typescript
getOrCreateUser(userId, username, email): Promise<UserProfile>
  // Creates user if not found; updates lastLogin on every call

updateUserProfile(profile, requestingUserId): Promise<void>
  // Throws if profile.id !== requestingUserId
```

**Food Items:**

```typescript
addFoodItemLog(foodLog: FoodItem): Promise<FoodItemId>
getDailyFoodLogs(userId, date): Promise<FoodItem[]>      // uses [userId+dateLogged]
getAllFoodLogs(userId): Promise<FoodItem[]>               // uses userId index
getRecentFoodItems(userId): Promise<FoodItem[]>           // deduped by name, most recent per name
getFoodItemById(id, userId): Promise<FoodItem | undefined>
deleteFoodItem(id, userId): Promise<void>                 // no-op on userId mismatch
toggleFavoriteFoodItem(id, isFavorite, userId): Promise<void>
getFavoriteFoodItems(userId): Promise<FoodItem[]>
updateFoodItem(id, updates, userId): Promise<void>        // no-op on userId mismatch
```

**Recipes:**

```typescript
saveRecipe(recipe): Promise<RecipeId>
getAllRecipes(userId): Promise<Recipe[]>
deleteRecipe(id, userId): Promise<void>     // no-op on userId mismatch
```

**Water Logs:**

```typescript
addWaterLog(log: WaterLog): Promise<WaterLogId>
getDailyWaterLogs(userId, date): Promise<WaterLog[]>   // uses [userId+dateLogged]
deleteWaterLog(id, userId): Promise<void>              // no-op on userId mismatch
```

**Body Measurements:**

```typescript
addBodyMeasurement(m: BodyMeasurement): Promise<BodyMeasurementId>
getAllBodyMeasurements(userId): Promise<BodyMeasurement[]>  // sorted by measuredAt asc
deleteBodyMeasurement(id, userId): Promise<void>           // no-op on userId mismatch
```

### Custom Hooks

**`useFoodForm()`** - `src/hooks/useFoodForm.ts`

```typescript
{
  name, setName, calories, setCalories, servingSize, setServingSize,
  protein, setProtein, carbs, setCarbs, fat, setFat, mealType, setMealType,
  isLoading, message,
  submitFoodLog(): Promise<boolean>,
  resetForm(): void
}
```

**`useRecipeForm(userId, allFoodItems)`** - `src/hooks/useRecipeForm.ts`

```typescript
{
  recipeName, setRecipeName, description, setDescription,
  ingredients: FormIngredient[],
  addIngredient(), removeIngredient(id), updateIngredient(id, field, value),
  selectIngredientFoodItem(ingredientId, foodItem),
  message, isLoading, saveRecipeForm(): Promise<boolean>
}
```

**`useProgressData(days: 7 | 30)`** - `src/hooks/useProgressData.ts`

```typescript
{ labels: string[], data: number[], isLoading: boolean }
```

**`useWaterForm()`** - `src/hooks/useWaterForm.ts`

```typescript
{ amount, setAmount, isLoading, message, submitWaterLog(): Promise<boolean> }
```

**`useBodyForm()`** - `src/hooks/useBodyForm.ts`

```typescript
{
  weight, setWeight, bodyFat, setBodyFat,
  waist, setWaist, chest, setChest, hips, setHips,
  weightUnit: WeightUnit, setWeightUnit,
  lengthUnit: LengthUnit, setLengthUnit,
  isLoading, message,
  submitMeasurement(): Promise<boolean>
}
```

**`useStreaks()`** - `src/hooks/useStreaks.ts`

```typescript
{ currentStreak: number, longestStreak: number, isLoading: boolean }
```

**`useWeeklySummary()`** - `src/hooks/useWeeklySummary.ts`

```typescript
{ avgCalories: number, daysOnTarget: number, consistencyPct: number }
```

**`useVoiceCapture()`** - `src/hooks/useVoiceCapture.ts`

```typescript
{ transcript: string, isListening: boolean, startListening(), stopListening(), isSupported: boolean }
```

**`useBarcodeScanner()`** - `src/hooks/useBarcodeScanner.ts`

```typescript
{ scannedCode: string | null, isScanning: boolean, startScanning(), stopScanning(), error: string | null }
```

---

## 9. Build and Deployment

### Build Output

```bash
pnpm build  # -> dist/ (index.html + assets/ gzip + brotli compressed)
```

### Deployment

The app deploys at `/${packageJson.name}/` (sub-path; configured in `vite.config.ts` `base`).

**Static hosting security headers** are provided via `public/_headers` (copied to `dist/` on build),
covering Cloudflare Pages and Netlify automatically. For other hosts, replicate the file's header
directives.

**Dev server:** CSP is intentionally excluded from dev headers because `@vitejs/plugin-react`
injects an inline `<script type="module">` for Fast Refresh that `script-src 'self'` would block.

### Deployment Checklist

- [ ] `pnpm build` succeeds with no TypeScript errors
- [ ] `pnpm lint:fix` passes
- [ ] `pnpm test` passes with coverage report
- [ ] Deployed over HTTPS
- [ ] `public/_headers` present in `dist/` or equivalent host config
- [ ] IndexedDB persists across sessions
- [ ] Dark mode toggle works

---

## 10. Known Limitations and Technical Debt

### Pending Features

| Feature                            | Status                                                              |
|------------------------------------|---------------------------------------------------------------------|
| Barcode food-lookup API            | Camera works; API not integrated (`connect-src` placeholder in CSP) |
| Recipe macro calculation           | Hardcoded 100 kcal/ingredient instead of actual ingredient calories |
| Macro breakdown display in recipes | Not rendered in UI                                                  |
| Multi-user auth                    | Single hardcoded user `UserId("1")`                                 |
| PWA / service worker               | No offline sync or install prompt                                   |
| Advanced filtering and search      | Not implemented                                                     |
| Food log pagination                | All items loaded at once via `getAllFoodLogs`                       |
| WCAG 2.1 full compliance           | Pending audit                                                       |

### Technical Debt

| Issue                                                                                | Severity | Location                       |
|--------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                   | Medium   | `useRecipeForm`, `Recipes.tsx` |
| Recipe `totalCalories` hardcoded (`ingredients.length * 100`)                        | Medium   | `useRecipeForm`, `Recipe` type |
| `quantity` and `serving` on Recipe.ingredients stored but ignored                    | Low      | `Recipe` interface             |
| `getAllFoodLogs` and `getRecentFoodItems` use `where("userId")` - not compound index | Low      | `dbService.ts`                 |
| No schema migration tests                                                            | Low      | `dbService.test.ts`            |
| No optimistic updates                                                                | Low      | `AppState.ts`                  |

---

## 11. v0.0.5 Roadmap

From `release-notes/0.0.4.md`:

| Item                                                                |
|---------------------------------------------------------------------|
| Barcode food-lookup API integration (Open Food Facts or equivalent) |
| Full component and integration test coverage (>80%)                 |
| Macro nutrient breakdown display for recipes                        |
| Advanced filtering and search for food logs                         |
| Multi-user auth, PWA offline sync, data export/import               |

---

## 12. Uncertainties and Questions

- **Recipe calories:** Should `totalCalories` be computed from `sum(ingredient.calories * quantity)`
  or remain simplified? Ingredient `quantity` and `serving` fields are stored but unused.
- **Calorie goal UI:** Are there min/max range constraints shown to the user, or is the [1, 99999]
  validation silent?
- **Food log editing UI:** `updateFoodLog` action exists in AppState. Is an edit trigger wired up in
  the Dashboard log history, or only available via hooks?
- **Barcode API choice:** The CSP comment names `https://world.openfoodfacts.org` as the candidate
  API. Has this been confirmed?
- **PWA architecture:** Service worker requires a build-time decision on caching strategy. Is it in
  scope for v0.0.5?
- **`getRecentFoodItems` deduplication:** Deduplication by name (most recent per name) - is this the
  intended behavior for `allFoodItems` used as the ingredient selector corpus?

---

**Document Generated:** May 9, 2026
**Analysis Method:** Reverse-engineering from release-notes/ and src/ folder
**Source References:** release-notes/0.0.1.md through 0.0.4.md, src/types/index.ts,
src/db/dbService.ts, src/state/AppState.ts, src/App.tsx, src/components/BodyMeasurements.tsx,
src/components/StreakCard.tsx, vite.config.ts, public/_headers

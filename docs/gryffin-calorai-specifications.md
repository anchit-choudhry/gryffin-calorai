# Gryffin Calorai: Complete Application Specification

**Project:** Gryffin Calorai
**Version:** 0.0.7 (current)
**Type:** Single-Page Application (React/Vite SPA)
**Status:** Active Development
**Last Updated:** May 12, 2026
**Analysis Scope:** src/ folder reverse-engineering + CLAUDE.md (v0.0.1 - v0.0.7)

---

## 1. Executive Summary

Gryffin Calorai is a privacy-first calorie tracking application that runs entirely in the browser
using IndexedDB for local data persistence. No backend server is used. Users log daily food intake
with macronutrients and meal types, track water and step activity, record body measurements, and
visualize calorie and macro trends over time. All data remains on the user's device.

**Core Value Proposition:** Offline-first health tracking with zero server dependency and zero data
exposure.

**Cumulative Feature Set (v0.0.1 - v0.0.7):**

- Manual food logging with macros (protein, carbs, fat), meal types, and favorites
- Recipe manager with dynamic ingredient composition and accurate calorie calculation
- Progress charts - 7-day and 30-day calorie visualization (stacked bars + area chart)
- Macro nutrient trend chart - 7-day AreaChart (protein, carbs, fat)
- Water intake tracking with user-configurable daily goal and history chart
- Step tracking with user-configurable daily goal and quick-add presets
- Body measurements (weight, body fat, waist, chest, hips) with unit conversion
- Body composition trend chart (LineChart; shown when >= 2 measurements)
- Calorie distribution pie chart by meal type (7-day view)
- Gamification achievement system - 18 achievements across 6 categories
- Voice food logging via Web Speech API with fuzzy matching
- Barcode scanner - camera functional; food-lookup API not yet integrated
- Logging streak tracking - current and best
- Weekly summary metrics
- Progress page with 7 sections and 7/30-day toggle
- Dark mode with OS preference detection and localStorage persistence
- ErrorBoundary for crash recovery
- HTTP security headers: CSP, X-Frame-Options, Permissions-Policy, Referrer-Policy
- Code-split vendor bundles; lazy-loaded pages and BarcodeScanner
- 11 GitHub Actions CI/CD workflows; coverage reporting
- Editorial design system (oklch color palette, @fontsource-variable typography, responsive grid)
- shadcn/ui Dialog, Tabs, Form, Input, Button, Card, Tooltip primitives
- react-hook-form 7 + zod v3 validation on all form hooks
- motion 12 layout animations; sonner toasts; lucide-react icons

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

| Technology               | Version | Role                                               |
|--------------------------|---------|----------------------------------------------------|
| Tailwind CSS             | 4       | Utility-first CSS, `dark: class`-based dark mode   |
| shadcn/ui (Radix UI)     | 1.4     | Dialog, Tabs, Form, Input, Button, Card primitives |
| lucide-react             | 1.14    | SVG icon set                                       |
| Recharts                 | 3.8     | ComposedChart, AreaChart, LineChart, PieChart      |
| motion (motion/react)    | 12      | Layout animations, page/section variants           |
| sonner                   | 2       | Toast notifications via `<Toaster />` in App.tsx   |
| @fontsource-variable/... | 5       | Fraunces (display), JetBrains Mono, Public Sans    |

### Forms and Validation

| Technology          | Version | Role                                      |
|---------------------|---------|-------------------------------------------|
| react-hook-form     | 7       | Form state management, all forms          |
| zod (via `zod/v3`)  | 4       | Schema validation; `src/forms/schemas.ts` |
| @hookform/resolvers | 5       | zodResolver adapter for react-hook-form   |

### Developer Tooling

| Technology          | Version | Role                                             |
|---------------------|---------|--------------------------------------------------|
| Vitest              | 4       | Unit/integration test runner (jsdom environment) |
| @vitest/coverage-v8 | 4       | V8 coverage reporter                             |
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
          [shadcn/ui <Dialog>] Edit Log / Barcode Food / Voice Food
          Section A — Masthead / Hero:
            <DashboardHero /> (totalCalories, macro totals: protein/carbs/fat)
          Section B — Week in Review:
            <WeeklySummary />
            <StreakCard />
            <WaterTracker />
            <StepTracker />
          Section C — Recently Logged: scroll chips (up to 8; quick-re-log)
          Section D — From the Pantry: favorites chips (quick-re-log)
          Section E — Add to Today's Log (3-col grid):
            "01 · Write" <EditorialFrame> -> <FoodLogger />
            "02 · Scan"  <EditorialFrame> -> <Suspense> <BarcodeScanner /> (lazy)
            "03 · Speak" <EditorialFrame> -> <VoiceFoodLogger />
          Section F — Today's Log: grouped by meal type, AnimatePresence stagger

        #recipes  -> <Recipes>    (lazy)
          Recipe creation form (react-hook-form + zod, useFieldArray for ingredients)
          Saved recipes list with delete

        #progress -> <Progress>   (lazy)
          Section 01 — Progress Tracking:
            7-day: ComposedChart stacked bars by meal type + goal ReferenceLine
            30-day: AreaChart total calories + goal ReferenceLine
            Tabs for 7 / 30 day toggle
          Section 02 — Body Measurements:
            <BodyMeasurements /> (log form + history table)
          Section 03 — Macro Nutrient Trends:
            7-day: AreaChart protein / carbs / fat
            30-day: placeholder message
          Section 04 — Water Intake Trend:
            AreaChart with waterGoal reference line
          Section 05 — Body Composition: (shown only if >= 2 measurements)
            LineChart: bodyFat%, waist, chest, hips with cm/in unit toggle
          Section 06 — Calorie Distribution:
            7-day: PieChart by meal type
            30-day: placeholder message
          Section 07 — Achievements:
            Grid of 18 achievement cards (locked/unlocked state)
            Unlock count summary
      </Suspense>
    </ErrorBoundary>
  </main>
```

### State Management

**Single Zustand Store (`src/state/AppState.ts`):**

```typescript
interface AppState {
  init: AppInitState         // replaces isLoading + user; 4-state machine
  dailyLogs: FoodItem[]      // today's food entries
  allFoodItems: FoodItem[]   // deduplicated recent items for suggestions
  recipes: Recipe[]
  favoriteFoods: FoodItem[]  // items with isFavorite = true
  dailyWaterLogs: WaterLog[]
  dailyStepLogs: StepLog[]   // today's step entries
  bodyMeasurements: BodyMeasurement[]
  unlockedAchievements: UserAchievement[]
  waterGoalMl: number        // user-configurable; persisted in localStorage
  stepGoal: number           // user-configurable; persisted in localStorage
  error: string | null
  userId: UserId | null
}
```

`AppInitState` (from `src/types/index.ts`):

```typescript
type AppInitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; user: UserProfile }
  | { status: "error"; message: string };
```

**Actions** (all async unless noted; errors mapped via `mapDbError`):

| Action                           | DB calls / behavior                                                                                                                                                              |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `fetchInitialData(userId)`       | getOrCreateUser, getDailyFoodLogs, getAllRecipes, getRecentFoodItems, getFavoriteFoodItems, getDailyWaterLogs, getDailyStepLogs, getAllBodyMeasurements, getUnlockedAchievements |
| `refreshDailyLogs(userId)`       | getDailyFoodLogs                                                                                                                                                                 |
| `addFoodLog(food)`               | addFoodItemLog -> refreshDailyLogs -> checkAndUnlockAchievements                                                                                                                 |
| `deleteFoodLog(id)`              | deleteFoodItem(id, userId) -> refreshDailyLogs                                                                                                                                   |
| `updateFoodLog(id, updates)`     | updateFoodItem(id, updates, userId) -> refreshDailyLogs                                                                                                                          |
| `toggleFavorite(id, isFavorite)` | toggleFavoriteFoodItem -> fetchFavorites + fetchAllFoodItems                                                                                                                     |
| `fetchFavorites(userId)`         | getFavoriteFoodItems                                                                                                                                                             |
| `updateCalorieGoal(goal)`        | updateUserProfile(updatedUser, userId); updates init.user in-place                                                                                                               |
| `fetchRecipes(userId)`           | getAllRecipes                                                                                                                                                                    |
| `deleteRecipe(id)`               | deleteRecipe(id, userId) -> fetchRecipes                                                                                                                                         |
| `fetchAllFoodItems(userId)`      | getRecentFoodItems                                                                                                                                                               |
| `addWaterLog(amount)`            | constructs WaterLog -> addWaterLogToDB -> fetchDailyWaterLogs -> checkAndUnlockAchievements                                                                                      |
| `deleteWaterLog(id)`             | deleteWaterLog(id, userId) -> fetchDailyWaterLogs                                                                                                                                |
| `fetchDailyWaterLogs(userId)`    | getDailyWaterLogs                                                                                                                                                                |
| `addStepLog(steps)`              | constructs StepLog -> addStepLogToDB -> fetchDailyStepLogs -> checkAndUnlockAchievements                                                                                         |
| `deleteStepLog(id)`              | deleteStepLog(id, userId) -> fetchDailyStepLogs                                                                                                                                  |
| `fetchDailyStepLogs(userId)`     | getDailyStepLogs                                                                                                                                                                 |
| `addBodyMeasurement(m)`          | addBodyMeasurementToDB -> fetchBodyMeasurements -> checkAndUnlockAchievements                                                                                                    |
| `deleteBodyMeasurement(id)`      | deleteBodyMeasurement(id, userId) -> fetchBodyMeasurements                                                                                                                       |
| `fetchBodyMeasurements(userId)`  | getAllBodyMeasurements                                                                                                                                                           |
| `fetchAchievements(userId)`      | getUnlockedAchievements                                                                                                                                                          |
| `checkAndUnlockAchievements()`   | getAllFoodLogs + getAllWaterLogs + getUnlockedAchievementIds -> evaluateAchievements -> batch addUserAchievement -> getUnlockedAchievements -> toast.success per new achievement |
| `setWaterGoalMl(ml)` (sync)      | validates [250, 10000]; persists to localStorage; sets waterGoalMl in store                                                                                                      |
| `setStepGoal(steps)` (sync)      | validates [1000, 100000]; persists to localStorage; sets stepGoal in store                                                                                                       |

**State initialization flow:**

1. `App.tsx` `useLayoutEffect` calls `initializeDB()` then `fetchInitialData(UserId("1"))`
2. `fetchInitialData` sets `init: { status: "loading" }` then calls `getOrCreateUser`
3. All data slices loaded sequentially; `init: { status: "ready", user: profile }` set atomically
4. `waterGoalMl` and `stepGoal` are initialized from localStorage before the store is created

**Data flow:**

```
User interaction
  -> Custom Hook (react-hook-form + zod validation)
    -> Zustand action
      -> DB Service function
        -> Dexie API
          -> IndexedDB (GryffinCaloraiDB)
```

### Bundle Architecture (`vite.config.ts`)

**Base path:** `/${packageJson.name}/` (sub-path deployment)

**Vendor chunks (Rolldown `manualChunks` function):**

| Chunk            | Matched paths                                                              |
|------------------|----------------------------------------------------------------------------|
| `vendor-react`   | `react-dom`, `react/`                                                      |
| `vendor-charts`  | `recharts`, `d3-`, `victory-`                                              |
| `vendor-barcode` | `@zxing`                                                                   |
| `vendor-db`      | `dexie`                                                                    |
| `vendor-icons`   | `lucide-react`                                                             |
| `vendor-ui`      | `sonner`, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| `vendor-motion`  | `motion`                                                                   |
| `vendor-state`   | `zustand`                                                                  |
| `vendor-form`    | `react-hook-form`, `@hookform`, `zod`                                      |

All three page components and `BarcodeScanner` are `React.lazy`-loaded. `BarcodeScanner` has its own
nested `<Suspense>` boundary, keeping `vendor-barcode` out of the initial load.

---

## 4. Data Model and Schema

### Database: `GryffinCaloraiDB` (Dexie/IndexedDB)

**Current Schema Version: 9**

#### Schema Version History

| Version | Change                                              | Migration                                         |
|---------|-----------------------------------------------------|---------------------------------------------------|
| v1      | `users`, `foodItems`, `recipes`                     | -                                                 |
| v2      | `calorieGoal` on users; `userId` index on foodItems | backfills `calorieGoal = 2000` for existing users |
| v3      | `protein`, `carbs`, `fat` on foodItems              | backfills all three to `0`                        |
| v4      | `isFavorite` on foodItems                           | backfills to `false`                              |
| v5      | `mealType` on foodItems                             | backfills to `"Breakfast"`                        |
| v6      | `waterLogs` table                                   | -                                                 |
| v7      | `bodyMeasurements` table                            | -                                                 |
| v8      | `userAchievements` table                            | -                                                 |
| v9      | `stepLogs` table (current)                          | -                                                 |

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
    quantity: number;
    serving: number;
  }>;
  totalCalories: number; // sum(ingredient.calories * quantity * serving)
  createdBy: UserId;
  dateCreated: string;   // ISO 8601 timestamp
  userId: UserId;
}
```

`deleteRecipe` verifies `recipe.userId === userId` before deleting.

`totalCalories` is now computed from
`ingredients.reduce((acc, ing) => acc + ing.calories * ing.quantity * ing.serving, 0)`.
The per-ingredient `calories` field is provided by the user when adding an ingredient via
`useFieldArray`.

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

`addWaterLog(amount)` in AppState constructs the full `WaterLog` object before passing to DB.
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

#### Table: `userAchievements`

**Primary key:** `++id` (auto-increment UserAchievementId)
**Compound index:** `[userId+achievementId]`
**Other indices:** `userId, achievementId, unlockedAt`

```typescript
interface UserAchievement {
  id?: UserAchievementId;
  userId: UserId;
  achievementId: string;   // matches ACHIEVEMENTS[n].id from src/lib/achievements.ts
  unlockedAt: string;      // ISO 8601 timestamp
}
```

`getUnlockedAchievementIds(userId)` returns a `Set<string>` used by `evaluateAchievements` to
skip already-earned achievements. `addUserAchievement` does not check for duplicates at the DB
layer - deduplication is handled by the `alreadyUnlocked` set in `checkAndUnlockAchievements`.

---

#### Table: `stepLogs`

**Primary key:** `++id` (auto-increment StepLogId)
**Compound index:** `[userId+dateLogged]`
**Other indices:** `userId, dateLogged`

```typescript
interface StepLog {
  id?: StepLogId;
  userId: UserId;
  steps: number;         // 1-100000 (validated in useStepForm)
  dateLogged: ISODate;   // YYYY-MM-DD
  loggedAt: string;      // ISO 8601 timestamp for intra-day ordering
}
```

`addStepLog(steps)` in AppState constructs the full `StepLog` object before passing to DB.
`deleteStepLog` verifies `log.userId === userId` before deleting.

---

### Branded Type System

Compile-time ID safety via TypeScript intersection types. Zero runtime cost.

```typescript
// src/types/index.ts
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">
export type FoodItemId = Brand<number, "FoodItemId">
export type RecipeId = Brand<number, "RecipeId">
export type WaterLogId = Brand<number, "WaterLogId">
export type BodyMeasurementId = Brand<number, "BodyMeasurementId">
export type UserAchievementId = Brand<number, "UserAchievementId">
export type StepLogId = Brand<number, "StepLogId">
export type ISODate = Brand<string, "ISODate">
```

Each branded type has a constructor function (raw cast) and a type guard (runtime validation):

| Type                                                                                                           | Guard logic                                                            |
|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| `isUserId`                                                                                                     | `typeof value === "string" && length [1, 128] && printable ASCII only` |
| `isFoodItemId` / `isRecipeId` / `isWaterLogId` / `isBodyMeasurementId` / `isStepLogId` / `isUserAchievementId` | `typeof value === "number" && value > 0`                               |
| `isISODate`                                                                                                    | regex `^\d{4}-\d{2}-\d{2}$` + `Date` validity check                    |

### Utility Functions (`src/types/index.ts`)

| Function                                     | Behavior                                                                                                                                                        |
|----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `todayISO()`                                 | Returns `new Date().toISOString().split("T")[0]` as `ISODate`                                                                                                   |
| `kgToLb(kg)`                                 | `Math.round(kg * 2.20462 * 10) / 10`                                                                                                                            |
| `lbToKg(lb)`                                 | `Math.round((lb / 2.20462) * 100) / 100`                                                                                                                        |
| `cmToIn(cm)`                                 | `Math.round((cm / 2.54) * 10) / 10`                                                                                                                             |
| `inToCm(inch)`                               | `Math.round(inch * 2.54 * 10) / 10`                                                                                                                             |
| `sanitizeBarcodeInput(raw)`                  | Strips non-printable ASCII (`/[^\x20-\x7E]/g`), trims; returns `null` if empty or >100 chars                                                                    |
| `sanitizeVoiceTranscript(raw)`               | Strips chars with code < 0x20 or = 0x7F, collapses whitespace; returns `null` if empty or >200 chars                                                            |
| `fuzzyMatchFoodName(query, corpus, limit=3)` | Scores by exact/prefix/substring/Levenshtein; threshold = `max(2, floor(queryLength/4))`; returns up to `limit` matches                                         |
| `computeStreaks(uniqueDates)`                | Returns `{ currentStreak, longestStreak }`; walks back from today (or yesterday if today has no log) for current streak; scans all sorted dates for longest run |
| `assertDefined<T>(val, msg)`                 | Throws if `val` is `null` or `undefined`; narrows type                                                                                                          |

**Utility types:**

| Type               | Definition                                                     |
|--------------------|----------------------------------------------------------------|
| `NonEmptyArray<T>` | `[T, ...T[]]`                                                  |
| `DeepReadonly<T>`  | Recursively makes all properties `readonly`                    |
| `AsyncResult<T>`   | Discriminated union: idle / pending / resolved / rejected      |
| `AppInitState`     | 4-state machine: idle / loading / ready(user) / error(message) |

**Constants:**

| Constant              | Value                                                   |
|-----------------------|---------------------------------------------------------|
| `DAILY_WATER_GOAL_ML` | `2000`                                                  |
| `DAILY_STEP_GOAL`     | `10000`                                                 |
| `MEAL_TYPES`          | `["Breakfast", "Lunch", "Snacks", "Dinner"]` (readonly) |
| `DEFAULT_MEAL_TYPE`   | `"Breakfast"`                                           |

### Utility Functions (`src/lib/utils.ts`)

| Export                        | Behavior                                                                                                  |
|-------------------------------|-----------------------------------------------------------------------------------------------------------|
| `cn(...inputs)`               | `clsx` + `tailwind-merge` utility for className composition                                               |
| `EDITORIAL_INPUT_CLS`         | Shared Tailwind class string for editorial-style borderless inputs                                        |
| `groupLogsByMeal(logs)`       | Groups `FoodItem[]` by `MealType`; returns `GroupedMealLog[]` in `MEAL_TYPES` order, empty groups omitted |
| `normalizeHash(raw)`          | Maps raw hash string to one of `"#dashboard"`, `"#recipes"`, `"#progress"`; defaults to dashboard         |
| `mapDbError(error, fallback)` | Maps Dexie errors to user-friendly messages (QuotaExceeded, ConstraintError, DatabaseClosed)              |

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
0-10000; servingSize: 1-100; protein/carbs/fat: 0-500g), the system shall display a field-level
error via `<FormMessage />` and block the DB write.

**OBS-FOOD-003 - Loading gate**
While `isLoading` is true in the form hook, the system shall disable the submit button.

**OBS-FOOD-004 - Success feedback**
When a food item is successfully logged, the system shall display a toast via `sonner` referencing
the food name.

**OBS-FOOD-005 - Daily refresh**
When `addFoodLog()` or `deleteFoodLog()` completes, the system shall call `refreshDailyLogs()` to
re-query today's entries from IndexedDB.

**OBS-FOOD-006 - Delete ownership**
When the user deletes a food log, `deleteFoodItem` shall silently no-op if `item.userId !== userId`.

**OBS-FOOD-007 - Edit**
When the user edits an existing log entry via the edit dialog, `useFoodForm(initialFood)` operates
in edit mode; `updateFoodItem` updates only the fields in `Partial<Omit<FoodItem,"id"|"userId">>`.

**OBS-FOOD-008 - Favorites**
When the user toggles favorite on an entry, `toggleFavoriteFoodItem` shall verify ownership, update
`isFavorite`, then refresh both `favoriteFoods` and `allFoodItems` in AppState.

**OBS-FOOD-009 - Daily totals**
The system shall compute daily totals (total calories, protein, carbs, fat) in memory by summing
`dailyLogs` via `useMemo`; no aggregation occurs at write time.

**OBS-FOOD-010 - Achievement trigger**
When a food log is successfully added, the system shall call `checkAndUnlockAchievements()` to
evaluate newly earned achievements.

---

### Feature 2: Calorie Goal

**Evidence:** `src/state/AppState.ts:updateCalorieGoal`, `src/db/dbService.ts:updateUserProfile`

**OBS-GOAL-001 - Default**
The system shall assign `calorieGoal = 2000` kcal to newly created users.

**OBS-GOAL-002 - Validation**
`updateCalorieGoal` shall silently no-op if `!Number.isFinite(goal) || goal < 1 || goal > 99999`.

**OBS-GOAL-003 - Progress bar**
The system shall display progress as `(totalCalories / calorieGoal) * 100`; the bar is capped at
100% for display.

**OBS-GOAL-004 - Ownership**
`updateUserProfile` shall throw `"Unauthorized: cannot modify another user's profile"` if
`profile.id !== requestingUserId`.

**OBS-GOAL-005 - State update**
`updateCalorieGoal` shall update `init.user.calorieGoal` in the Zustand store in-place without
transitioning out of `{ status: "ready" }`.

---

### Feature 3: Recipe Management

**Evidence:** `src/db/dbService.ts`, `src/hooks/useRecipeForm.ts`, `src/pages/Recipes.tsx`,
`src/forms/schemas.ts:RecipeFormSchema`

**OBS-RECIPE-001 - Creation**
When the user saves a recipe with a name, description, and at least one ingredient, the system shall
persist it to the `recipes` table and refresh the recipe list.

**OBS-RECIPE-002 - Calorie calculation**
The system shall compute `totalCalories` as
`sum(ingredient.calories * ingredient.quantity * ingredient.serving)`.
Per-ingredient `calories` is entered by the user and validated [0, 10000].

**OBS-RECIPE-003 - Ingredient management**
`useRecipeForm` uses `react-hook-form useFieldArray` to manage a dynamic list of ingredient rows.
Each row has: `foodItemId`, `foodItemName`, `calories`, `quantity`, `serving`.

**OBS-RECIPE-004 - Delete ownership**
When the user deletes a recipe, `deleteRecipe` shall silently no-op if `recipe.userId !== userId`.

**OBS-RECIPE-005 - Achievement trigger**
When a recipe is successfully saved, `checkAndUnlockAchievements()` is called.

---

### Feature 4: Progress Visualization

**Evidence:** `src/pages/Progress.tsx`, `src/hooks/useProgressData.ts`

**OBS-PROGRESS-001 - 7-day stacked bar chart**
The Progress page shall render a `ComposedChart` of stacked bars by meal type (Breakfast, Lunch,
Snacks, Dinner) for the last 7 days, with a red dashed `ReferenceLine` at `user.calorieGoal`.

**OBS-PROGRESS-002 - 30-day area chart**
The Progress page shall render an `AreaChart` of daily calorie totals for the last 30 days, with a
dashed reference line at `user.calorieGoal`.

**OBS-PROGRESS-003 - Data aggregation**
`useProgressData(days)` fetches all user logs via `getAllFoodLogs(userId)`, groups by date+mealType,
sums calories per day, and builds meal-type arrays. Days with no logs default to 0.

**OBS-PROGRESS-004 - Macro trends (7-day only)**
`useProgressData(7)` additionally returns `macroData: { protein[], carbs[], fat[] }` for the
7-day macro AreaChart. `macroData` is `null` in 30-day mode.

**OBS-PROGRESS-005 - Day toggle**
The Progress page uses a shadcn/ui `<Tabs>` component to toggle between 7 and 30-day views.
Macro Nutrient Trends and Calorie Distribution sections show a placeholder in 30-day mode.

---

### Feature 5: Weekly Summary

**Evidence:** `src/components/WeeklySummary.tsx`, `src/hooks/useWeeklySummary.ts`

**OBS-WEEKLY-001 - Metrics**
The WeeklySummary component shall display: 7-day average daily calories, number of days on target
(within calorie goal), and consistency percentage.

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

**OBS-BARCODE-004 - Pre-fill dialog**
When a barcode is detected, the system shall open a shadcn/ui `<Dialog>` with a `<FoodLogger>`
pre-filled with the barcode value as `prefillName`.

**OBS-BARCODE-005 - Lookup not implemented**
The barcode-to-food-lookup API is not implemented. Camera scanning is functional; the barcode
string is not yet used to fetch nutritional data.

---

### Feature 7: Voice Food Logging

**Evidence:** `src/components/VoiceFoodLogger.tsx`, `src/hooks/useVoiceCapture.ts`,
`src/types/index.ts:sanitizeVoiceTranscript,fuzzyMatchFoodName`

**OBS-VOICE-001 - Capture**
When the user activates the mic button, the system shall start a `SpeechRecognition` (or
`webkitSpeechRecognition`) session and display the live transcript.

**OBS-VOICE-002 - Sanitization**
The system shall pass all transcripts through `sanitizeVoiceTranscript()` before use.

**OBS-VOICE-003 - Fuzzy match**
When a sanitized transcript is available, the system shall call
`fuzzyMatchFoodName(query, corpus, limit=3)` against `allFoodItems` and `favoriteFoods` using
Levenshtein distance with threshold `max(2, floor(queryLength/4))`.

**OBS-VOICE-004 - Pre-fill dialog**
When a match is found, the system shall open a shadcn/ui `<Dialog>` with a `<FoodLogger>` pre-filled
with the matched name. The user confirms or edits before logging.

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
The WaterTracker shall display today's total water intake against `waterGoalMl` from the Zustand
store (default `DAILY_WATER_GOAL_ML = 2000 ml`; user-configurable).

**OBS-WATER-003 - Quick-add**
The WaterTracker shall provide quick-add buttons for predefined amounts (e.g., 150, 250, 500 ml),
submitting a water log without requiring manual text entry via `submitWaterLog(amountOverride)`.

**OBS-WATER-004 - Goal editing**
The WaterTracker shall allow inline editing of `waterGoalMl` (range [250, 10000]) via
`setWaterGoalMl` action; the new goal is persisted to `localStorage("waterGoalMl")`.

**OBS-WATER-005 - Delete ownership**
When the user deletes a water log, `deleteWaterLog` shall silently no-op if `log.userId !== userId`.

**OBS-WATER-006 - Achievement trigger**
When a water log is successfully added, `checkAndUnlockAchievements()` is called.

---

### Feature 9: Body Measurements

**Evidence:** `src/components/BodyMeasurements.tsx`, `src/hooks/useBodyForm.ts`,
`src/db/dbService.ts:bodyMeasurements`, `src/forms/schemas.ts:makeBodySchema`

**OBS-BODY-001 - Storage**
The system shall store body measurements in `bodyMeasurements` with fields: `weight` (kg),
`bodyFat` (%), `waist` (cm), `chest` (cm), `hips` (cm). Only `userId` and `measuredAt` required.

**OBS-BODY-002 - Unit display**
The system shall convert displayed weight via `kgToLb()` when the user selects "lb", and length
measurements via `cmToIn()` when the user selects "in". Values are converted back to metric before
DB write. Unit preference is local form state.

**OBS-BODY-003 - Dynamic schema**
`useBodyForm` calls `makeBodySchema(weightUnit, lengthUnit)` to produce unit-aware validation.
`useEffect` clears field errors when the unit changes.

**OBS-BODY-004 - History table**
The component shall display all body measurements in reverse chronological order (newest first).

**OBS-BODY-005 - Delete ownership**
`deleteBodyMeasurement` shall silently no-op if `m.userId !== userId`.

**OBS-BODY-006 - Achievement trigger**
When a body measurement is successfully added, `checkAndUnlockAchievements()` is called.

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
The StreakCard shall show: fire icon (>= 7-day streak), zap icon (>= 3-day streak), calendar icon
(otherwise) using lucide-react icons.

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
A `useLayoutEffect` watches `darkMode` state and applies the `dark` class synchronously before
paint to prevent flash of wrong theme.

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

---

### Feature 13: Navigation

**Evidence:** `src/App.tsx`, `src/lib/utils.ts:normalizeHash`

**OBS-NAV-001 - Hash routing**
The system shall read `window.location.hash` on mount and on every `hashchange` event, passing it
through `normalizeHash()` to determine the active page.

**OBS-NAV-002 - Routes**
`#dashboard` (default) renders `<Dashboard>`, `#recipes` renders `<Recipes>`, `#progress` renders
`<Progress>`. Any unknown hash defaults to `#dashboard`.

**OBS-NAV-003 - No router library**
Navigation is implemented entirely in `App.tsx` via `window.location.hash` and a `hashchange`
event listener; no router library is used.

---

### Feature 14: Step Tracking

**Evidence:** `src/components/StepTracker.tsx`, `src/hooks/useStepForm.ts`,
`src/db/dbService.ts:stepLogs`, `src/forms/schemas.ts:StepSchema`

**OBS-STEP-001 - Storage**
The system shall store step log entries in the `stepLogs` table with `userId`, `steps` (integer),
`dateLogged` (YYYY-MM-DD), and `loggedAt` (ISO timestamp).

**OBS-STEP-002 - Validation**
`StepSchema` validates `steps` as an integer in range [1, 100000]. `useStepForm` uses
`zodResolver(StepSchema)` via react-hook-form.

**OBS-STEP-003 - Quick-add presets**
The StepTracker shall provide quick-add buttons for predefined amounts (2000, 5000, 8000, 10000
steps) via `submitStepLog(stepsOverride)` without requiring form submission.

**OBS-STEP-004 - Custom amount**
The StepTracker shall provide a "Custom" toggle that reveals a numeric input field for any valid
step count.

**OBS-STEP-005 - Daily goal**
The StepTracker shall display today's total steps against `stepGoal` from the Zustand store
(default `DAILY_STEP_GOAL = 10000`; user-configurable).

**OBS-STEP-006 - Goal editing**
The StepTracker shall allow inline editing of `stepGoal` (range [1000, 100000]) via `setStepGoal`;
the new goal is persisted to `localStorage("stepGoal")`.

**OBS-STEP-007 - Progress hairline**
The StepTracker shall display a thin progress bar (`h-px`) filled proportionally to
`totalSteps / stepGoal`, capped at 100%.

**OBS-STEP-008 - Delete ownership**
When the user deletes a step log entry, `deleteStepLog` shall silently no-op if
`log.userId !== userId`.

**OBS-STEP-009 - Achievement trigger**
When a step log is successfully added, `checkAndUnlockAchievements()` is called.

---

### Feature 15: Gamification Achievements

**Evidence:** `src/lib/achievements.ts`, `src/state/AppState.ts:checkAndUnlockAchievements`,
`src/pages/Progress.tsx` (Section 07), `src/db/dbService.ts:userAchievements`

**OBS-ACH-001 - Achievement catalog**
The system shall maintain a catalog of 18 achievements across 6 categories in
`src/lib/achievements.ts`:

| Category    | IDs                                             | Count |
|-------------|-------------------------------------------------|-------|
| `streak`    | streak_3, streak_7, streak_14, streak_30        | 4     |
| `calorie`   | calorie_goal_hit, full_day, calorie_goal_3_days | 3     |
| `hydration` | water_first, water_goal_hit, water_streak_3     | 3     |
| `milestone` | log_1, log_10, log_50, log_100                  | 4     |
| `body`      | body_first, body_5, body_10                     | 3     |
| `recipe`    | recipe_first, recipe_5                          | 2     |

**OBS-ACH-002 - Evaluation**
`evaluateAchievements(params, alreadyUnlocked)` shall return only the IDs of achievements whose
conditions are met and which are not in the `alreadyUnlocked` set.

**OBS-ACH-003 - Persistent storage**
When `checkAndUnlockAchievements()` identifies newly earned achievements, the system shall write
one `UserAchievement` record per new achievement to `userAchievements` and refresh
`unlockedAchievements` in AppState.

**OBS-ACH-004 - Toast notification**
When an achievement is unlocked, the system shall display a `toast.success` message:
`"${achievement.icon} Achievement Unlocked: ${achievement.title}"` via sonner.

**OBS-ACH-005 - Idempotent checks**
`checkAndUnlockAchievements` shall fetch `getUnlockedAchievementIds` on every call to avoid
re-evaluating already-earned achievements, making repeated calls safe.

**OBS-ACH-006 - Progress grid**
The Achievements section on the Progress page (Section 07) shall display all 18 achievements in a
responsive grid. Unlocked achievements show their icon and unlock date; locked achievements show "?"
and their description.

**OBS-ACH-007 - Trigger points**
Achievements are evaluated after: `addFoodLog`, `addWaterLog`, `addStepLog`,
`addBodyMeasurement`, and `saveRecipeForm`. They are not evaluated on delete operations.

---

### Feature 16: Water Intake History Chart

**Evidence:** `src/hooks/useWaterHistoryData.ts`, `src/pages/Progress.tsx` (Section 04)

**OBS-WATER-HIST-001 - Data source**
`useWaterHistoryData(days)` fetches all water logs via `getAllWaterLogs(userId)`, aggregates daily
totals, and returns `{ labels, data, isLoading }` for the last `days` (7 or 30) days.

**OBS-WATER-HIST-002 - Chart**
The Water Intake Trend section renders a Recharts `AreaChart` with a red dashed `ReferenceLine`
at `waterGoalMl`.

---

## 6. Non-Functional Requirements

### Security

**Evidence:** `vite.config.ts`, `public/_headers`, `src/db/dbService.ts`

#### HTTP Security Headers

| Layer          | Where applied                                                                                       |
|----------------|-----------------------------------------------------------------------------------------------------|
| Dev server     | `vite.config.ts` `server.headers` - CSP excluded (blocks Vite Fast Refresh inline script)           |
| Preview server | `vite.config.ts` `preview.headers` - full CSP applied                                               |
| Static hosting | `public/_headers` (Cloudflare Pages / Netlify)                                                      |
| index.html     | `<meta http-equiv="Content-Security-Policy">` - stripped in dev by `strip-csp-meta-dev` Vite plugin |

**Full CSP directive:**

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
worker-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**Other headers:**

| Header                   | Value                                              |
|--------------------------|----------------------------------------------------|
| `X-Frame-Options`        | `DENY`                                             |
| `X-Content-Type-Options` | `nosniff`                                          |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`                  |
| `Permissions-Policy`     | `camera=(self), microphone=(self), geolocation=()` |

#### Database Security

| Observation                                                                                                           | Evidence         |
|-----------------------------------------------------------------------------------------------------------------------|------------------|
| `deleteFoodItem`, `deleteRecipe`, `deleteWaterLog`, `deleteBodyMeasurement`, `deleteStepLog` check `userId` ownership | `dbService.ts`   |
| `toggleFavoriteFoodItem`, `updateFoodItem` check `userId` before mutating                                             | `dbService.ts`   |
| `updateUserProfile` throws if `profile.id !== requestingUserId`                                                       | `dbService.ts`   |
| `clearDatabase()` throws in production                                                                                | `dbService.ts`   |
| `initializeDB()` schema-conflict auto-recovery restricted to non-production                                           | `dbService.ts`   |
| All voice transcripts sanitized via `sanitizeVoiceTranscript()` before use                                            | `types/index.ts` |
| All barcode scan results sanitized via `sanitizeBarcodeInput()` before use                                            | `types/index.ts` |
| Error messages use `mapDbError()` to avoid leaking Dexie internals                                                    | `AppState.ts`    |

**Known gaps:**

| Gap                                                                                       | Severity | Location                       |
|-------------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                        | Medium   | `useRecipeForm`, `Recipes.tsx` |
| `getRecentFoodItems` and `getAllFoodLogs` use `where("userId")` only - not compound index | Low      | `dbService.ts`                 |

### Performance

| Observation                                                                  | Evidence                                  |
|------------------------------------------------------------------------------|-------------------------------------------|
| `getDailyFoodLogs` uses compound index `[userId+dateLogged]`                 | `dbService.ts`                            |
| `getDailyWaterLogs` uses compound index `[userId+dateLogged]`                | `dbService.ts`                            |
| `getDailyStepLogs` uses compound index `[userId+dateLogged]`                 | `dbService.ts`                            |
| `getAllBodyMeasurements` uses `where("userId")` index                        | `dbService.ts`                            |
| Build output compressed with Gzip and Brotli                                 | `vite.config.ts` vite-plugin-compression2 |
| 9 vendor chunks keep per-page JS payloads small                              | `vite.config.ts` manualChunks             |
| `@zxing` deferred until BarcodeScanner is rendered                           | `Dashboard.tsx` lazy Suspense             |
| `motion/react` `useReducedMotion` hook disables animations for accessibility | `Dashboard.tsx`, `Progress.tsx`           |

### Offline Capability

- All data stored in `GryffinCaloraiDB` (IndexedDB) - persists across browser restarts
- No network requests in normal operation
- No service worker in v0.0.7

### Error Handling

| Layer                     | Pattern                                                                         |
|---------------------------|---------------------------------------------------------------------------------|
| React render              | `ErrorBoundary` class component                                                 |
| Async actions in AppState | `try/catch`; calls `mapDbError`; sets `error` state                             |
| DB helpers                | No-op on ownership mismatch; throw on actual DB errors                          |
| DB init                   | Production: throws on schema conflict. Dev: auto-recovers with delete + re-open |
| Forms                     | react-hook-form + zod; field-level `<FormMessage />` errors; sonner for toast   |

### Testing

| Module                                                 | Test file                                 | Status                    |
|--------------------------------------------------------|-------------------------------------------|---------------------------|
| `dbService.ts`                                         | `src/db/dbService.test.ts`                | Implemented               |
| `AppState.ts`                                          | `src/state/AppState.test.ts`              | Implemented               |
| `src/types/index.ts`                                   | `src/types/index.test.ts`                 | Implemented               |
| `useVoiceCapture`                                      | `src/hooks/useVoiceCapture.test.ts`       | Implemented               |
| `VoiceFoodLogger`                                      | `src/components/VoiceFoodLogger.test.tsx` | Implemented               |
| `PageLoading`                                          | `src/components/PageLoading.test.tsx`     | Implemented               |
| `src/lib/achievements.ts`                              | `src/lib/achievements.test.ts`            | Implemented               |
| `useStepForm`                                          | `src/hooks/useStepForm.test.ts`           | Implemented               |
| `StepTracker`                                          | `src/components/StepTracker.test.tsx`     | Implemented               |
| `BodyMeasurements`, `StreakCard`, remaining components | -                                         | In progress (target >80%) |

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
2. `initializeDB()` creates `GryffinCaloraiDB` at schema v9
3. `getOrCreateUser("1", "Guest", "guest@example.com")` creates the user with `calorieGoal = 2000`
4. Dashboard loads with all empty state; `init: { status: "ready", user }` in AppState
5. User can immediately log food, water, or steps

### Scenario 2: Logging Food (Manual)

1. User fills `FoodLogger` form (name, calories, macros, meal type)
2. `useFoodForm.submitFoodLog()` invokes react-hook-form `handleSubmit` -> zod validation
3. Valid: `addFoodLog(food)` action calls `addFoodItemLog` -> `refreshDailyLogs` ->
   `checkAndUnlockAchievements`
4. `dailyLogs` in AppState updates; Dashboard totals recalculate via `useMemo`
5. `toast.success` shown; form resets

### Scenario 3: Voice Logging

1. User clicks mic button in `VoiceFoodLogger`
2. `useVoiceCapture` starts `SpeechRecognition` session
3. User speaks; transcript sanitized via `sanitizeVoiceTranscript()`
4. `fuzzyMatchFoodName(query, allFoodItems.concat(favoriteFoods))` finds candidates
5. Parent `Dashboard` receives `onTranscriptMatched(name)` callback; opens Voice Food `<Dialog>`
6. `<FoodLogger prefillName={name}>` pre-fills the form; user confirms or edits
7. Proceeds through same `addFoodLog()` path as manual logging

### Scenario 4: Tracking Water

1. User clicks a quick-add button (e.g., 250 ml) on `WaterTracker`
2. `submitWaterLog(250)` validates via `WaterSchema.safeParse`
3. `addWaterLog(250)` action constructs `WaterLog` with `loggedAt: new Date().toISOString()`
4. `addWaterLogToDB(log)` inserts; `fetchDailyWaterLogs()` refreshes `dailyWaterLogs`
5. Progress bar recalculates: `sum(dailyWaterLogs.amount) / waterGoalMl * 100`
6. `checkAndUnlockAchievements()` fires - e.g., unlocks "First Sip" or "Hydration Hero"

### Scenario 5: Tracking Steps

1. User clicks a quick-add button (e.g., 10000 steps) on `StepTracker`
2. `submitStepLog(10000)` validates via `StepSchema.safeParse`
3. `addStepLog(10000)` action constructs `StepLog`; inserts; refreshes `dailyStepLogs`
4. Progress hairline updates: `totalSteps / stepGoal * 100`, capped at 100%
5. `checkAndUnlockAchievements()` fires

### Scenario 6: Earning an Achievement

1. User logs food every day for 7 consecutive days
2. On day 7, after `addFoodLog`, `checkAndUnlockAchievements()` is called
3. `getAllFoodLogs` + `getAllWaterLogs` + `getUnlockedAchievementIds` fetched in parallel
4. `evaluateAchievements(params, alreadyUnlocked)` computes `currentStreak >= 7` as true
5. `newIds = ["streak_7"]`; `addUserAchievement({ userId, achievementId: "streak_7", ... })` written
6. `getUnlockedAchievements` refreshes `unlockedAchievements` in store
7. `toast.success("🔥 Achievement Unlocked: Week Warrior")`

### Scenario 7: Progress Review

1. User navigates to `#progress`
2. `useProgressData(7)` and `useWaterHistoryData(7)` fetch all logs in parallel
3. Section 01: 7-day stacked bar chart renders with meal-type colors
4. Section 04: Water intake trend AreaChart renders
5. User toggles to "30 days"; hooks re-run with `days=30`
6. Section 03 and 06 show placeholder messages (7-day only)
7. Section 07: Achievements grid shows unlocked/locked states

### Scenario 8: Dark Mode Persistence

1. User clicks dark mode toggle
2. `document.documentElement.classList.add("dark")` and `localStorage.setItem("darkMode", "true")`
3. On next page load: `JSON.parse(localStorage.getItem("darkMode"))` restores `true`;
   `useLayoutEffect` applies the class before first paint

---

## 8. API and Query Reference

### Zod Schemas (`src/forms/schemas.ts`)

| Schema                                | Key validations                                                              |
|---------------------------------------|------------------------------------------------------------------------------|
| `FoodFormSchema`                      | name[1-100], calories[0-10000], servingSize[1-100], protein/carbs/fat[0-500] |
| `makeBodySchema(weightUnit, lenUnit)` | weight>0, bodyFat[1-99], waist/chest/hips>0; unit-aware max                  |
| `RecipeFormSchema`                    | recipeName[1-100], description[1-500], ingredients[>=1]                      |
| `IngredientSchema`                    | foodItemId>0, calories[0-10000], quantity/serving[1-999]                     |
| `WaterSchema`                         | amount integer [1, 5000] ml                                                  |
| `StepSchema`                          | steps integer [1, 100000]                                                    |

### DB Service Exports (`src/db/dbService.ts`)

**Initialization:**

```typescript
initializeDB(): Promise<void>
clearDatabase()
:
Promise<void>  // dev only
```

**User:**

```typescript
getOrCreateUser(userId, username, email): Promise<UserProfile>
updateUserProfile(profile, requestingUserId)
:
Promise<void>  // throws on mismatch
```

**Food Items:**

```typescript
addFoodItemLog(foodLog: FoodItem): Promise<FoodItemId>
getDailyFoodLogs(userId, date)
:
Promise<FoodItem[]>      // compound index
getAllFoodLogs(userId)
:
Promise<FoodItem[]>
getRecentFoodItems(userId)
:
Promise<FoodItem[]>           // deduped by name
getFoodItemById(id, userId): Promise<FoodItem | undefined>
deleteFoodItem(id, userId)
:
Promise<void>
toggleFavoriteFoodItem(id, isFavorite, userId): Promise<void>
getFavoriteFoodItems(userId): Promise<FoodItem[]>
updateFoodItem(id, updates, userId)
:
Promise<void>
```

**Recipes:**

```typescript
saveRecipe(recipe): Promise<RecipeId>
getAllRecipes(userId): Promise<Recipe[]>
deleteRecipe(id, userId)
:
Promise<void>
```

**Water Logs:**

```typescript
addWaterLog(log: WaterLog): Promise<WaterLogId>
getDailyWaterLogs(userId, date)
:
Promise<WaterLog[]>   // compound index
getAllWaterLogs(userId)
:
Promise<WaterLog[]>
deleteWaterLog(id, userId)
:
Promise<void>
```

**Body Measurements:**

```typescript
addBodyMeasurement(m: BodyMeasurement): Promise<BodyMeasurementId>
getAllBodyMeasurements(userId): Promise<BodyMeasurement[]>  // sorted by measuredAt asc
deleteBodyMeasurement(id, userId)
:
Promise<void>
```

**User Achievements:**

```typescript
addUserAchievement(a
:
UserAchievement
):
Promise<UserAchievementId>
getUnlockedAchievements(userId)
:
Promise<UserAchievement[]>
getUnlockedAchievementIds(userId)
:
Promise<Set<string>>
```

**Step Logs:**

```typescript
addStepLog(log
:
StepLog
):
Promise<StepLogId>
getDailyStepLogs(userId, date)
:
Promise<StepLog[]>    // compound index
getAllStepLogs(userId)
:
Promise<StepLog[]>
deleteStepLog(id, userId)
:
Promise<void>
```

### Custom Hooks

**`useFoodForm(initialFood?)`** - `src/hooks/useFoodForm.ts`

```typescript
{
  form: UseFormReturn<FoodFormValues>,  // react-hook-form instance
    isLoading
:
  boolean,
    isEditMode
:
  boolean,
  submitFoodLog(): Promise<boolean>,
  resetForm(): void
}
```

**`useRecipeForm(userId)`** - `src/hooks/useRecipeForm.ts`

```typescript
{
  form: UseFormReturn<RecipeFormValues>,
    fields
:
  FieldArrayWithId[],
    append(ingredient)
:
  void,
    remove(index)
:
  void,
    isLoading
:
  boolean,
    saveRecipeForm()
:
  Promise<boolean>
}
```

**`useProgressData(days: 7 | 30)`** - `src/hooks/useProgressData.ts`

```typescript
{
  labels: string[],        // MM-DD format
    data
:
  number[],          // total calories per day
    mealTypeData
:
  {
    Breakfast, Lunch, Snacks, Dinner
  :
    number[]
  }
|
  null,  // 7-day only
    macroData
:
  {
    protein, carbs, fat
  :
    number[]
  }
|
  null,                   // 7-day only
    isLoading
:
  boolean
}
```

**`useWaterHistoryData(days: 7 | 30)`** - `src/hooks/useWaterHistoryData.ts`

```typescript
{ labels: string[], data: number[], isLoading: boolean }
```

**`useWaterForm()`** - `src/hooks/useWaterForm.ts`

```typescript
{
  form: UseFormReturn<WaterFormValues>,
    isLoading
:
  boolean,
    submitWaterLog(amountOverride ? : number)
:
  Promise<boolean>
}
```

**`useBodyForm()`** - `src/hooks/useBodyForm.ts`

```typescript
{
  form: UseFormReturn<BodyFormValues>,
    weightUnit
:
  WeightUnit,
    setWeightUnit(unit)
:
  void,
    lengthUnit
:
  LengthUnit,
    setLengthUnit(unit)
:
  void,
    isLoading
:
  boolean,
  submitMeasurement(): Promise<boolean>
}
```

**`useStepForm()`** - `src/hooks/useStepForm.ts`

```typescript
{
  form: UseFormReturn<StepFormValues>,
    isLoading
:
  boolean,
    submitStepLog(stepsOverride ? : number)
:
  Promise<boolean>
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

**Static hosting security headers** are provided via `public/_headers` (copied to `dist/` on
build), covering Cloudflare Pages and Netlify automatically.

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
| Macro breakdown display in recipes | Not rendered on recipe card                                         |
| Multi-user auth                    | Single hardcoded user `UserId("1")`                                 |
| PWA / service worker               | No offline sync or install prompt                                   |
| Advanced filtering and search      | Not implemented                                                     |
| Food log pagination                | All items loaded at once via `getAllFoodLogs`                       |
| WCAG 2.1 full compliance           | Pending audit                                                       |

### Technical Debt

| Issue                                                                                | Severity | Location                       |
|--------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                   | Medium   | `useRecipeForm`, `Recipes.tsx` |
| `getAllFoodLogs` and `getRecentFoodItems` use `where("userId")` - not compound index | Low      | `dbService.ts`                 |
| No schema migration tests                                                            | Low      | `dbService.test.ts`            |
| No optimistic updates                                                                | Low      | `AppState.ts`                  |
| Component test coverage <80% for many components                                     | Medium   | `src/components/`              |

---

## 11. v0.0.8 Roadmap

| Item                                                           | Status      |
|----------------------------------------------------------------|-------------|
| Step Tracking (Feature 14 - StepLog, StepTracker, useStepForm) | Done        |
| Gamification achievement system (Feature 15 - 18 achievements) | Done        |
| Macro nutrient breakdown display for recipes                   | Pending     |
| Component test coverage >80%                                   | In progress |
| Advanced filtering and search (date range, meal type filters)  | Pending     |

---

## 12. Uncertainties and Questions

- **Recipe calories UI:** The `calories` field on each ingredient row requires the user to manually
  enter the per-unit calorie value. Should this be auto-populated from `allFoodItems` when a food
  item is selected?
- **Calorie goal UI:** Are there min/max range constraints shown to the user, or is the [1, 99999]
  validation silent?
- **Barcode API choice:** The CSP comment references `connect-src 'self'` with a note that the
  barcode API origin should be added when integrated. Has a specific API (e.g., Open Food Facts)
  been decided?
- **`getRecentFoodItems` deduplication:** Deduplication by name (most recent per name) - is this
  the intended behavior for the ingredient selector corpus in recipes?
- **Achievement deduplication at DB level:** `addUserAchievement` does not check for duplicates;
  the `[userId+achievementId]` compound index exists but is not enforced as unique. Could lead to
  duplicate rows if `checkAndUnlockAchievements` is called concurrently.
- **PWA architecture:** Service worker requires a build-time decision on caching strategy. Is it
  in scope for v0.0.8 or later?

---

**Document Generated:** May 12, 2026
**Analysis Method:** Reverse-engineering from src/ folder and CLAUDE.md (v0.0.1 - v0.0.7)
**Source References:** src/types/index.ts, src/db/dbService.ts, src/state/AppState.ts,
src/lib/achievements.ts, src/lib/utils.ts, src/forms/schemas.ts, src/App.tsx,
src/pages/Dashboard.tsx, src/pages/Progress.tsx, src/hooks/*.ts, src/components/StepTracker.tsx,
vite.config.ts, package.json, CLAUDE.md

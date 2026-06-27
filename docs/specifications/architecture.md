# Gryffin Calorai: Architecture and Technology Stack

Executive summary, technology stack, and architecture overview including component
hierarchy and bundle chunking strategy.

---

## 1. Executive Summary

Gryffin Calorai is a privacy-first calorie tracking application that runs entirely in the browser
using IndexedDB for local data persistence. No backend server is used. Users log daily food intake
with macronutrients and meal types, track water and step activity, record body measurements, and
visualize calorie and macro trends over time. All data remains on the user's device.

**Core Value Proposition:** Offline-first health tracking with zero server dependency and zero data
exposure.

**Cumulative Feature Set (v0.0.1 - v0.3.0):**

- Manual food logging with macros (protein, carbs, fat), meal types, and favorites
- Recipe manager with dynamic ingredient composition and accurate calorie calculation
- Progress charts - 7-day and 30-day calorie visualization (stacked bars + area chart)
- Macro nutrient trend chart - 7-day AreaChart (protein, carbs, fat)
- Water intake tracking with user-configurable daily goal and history chart
- Step tracking with user-configurable daily goal and quick-add presets
- Body measurements (weight, body fat, waist, chest, hips) with unit conversion
- Body composition trend chart (LineChart; shown when >= 2 measurements)
- Calorie distribution pie chart by meal type (7-day view)
- Gamification achievement system - 19 achievements across 6 categories
- Voice food logging via Web Speech API with fuzzy matching
- Barcode scanner - camera functional; food-lookup API not yet integrated
- Logging streak tracking - current and best
- Weekly summary metrics
- Progress page with 7 sections and 7/30-day toggle
- Interactive product tour (8 steps, spotlight, coachmark cards, localStorage persistence)
- Global keyboard shortcuts overlay with command registry
- Intermittent fasting timer (SVG ring progress, 5 presets, browser Notification API)
- Activity logging with MET-based calorie calculation (~60 activities)
- TDEE/goal engine onboarding (Mifflin-St Jeor, multi-step modal, unit toggles)
- Data export: versioned JSON backup + CSV ZIP (fflate); import with schema validation
- Settings page (Profile, Goals, Data, About)
- Dark mode with OS preference detection and localStorage persistence
- ErrorBoundary for crash recovery
- HTTP security headers: CSP, HSTS, X-Frame-Options, COEP, COOP, CORP, Permissions-Policy
- Code-split vendor bundles; lazy-loaded pages and BarcodeScanner
- 17 GitHub Actions CI/CD workflows; coverage reporting
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

### Utility Libraries

| Technology | Version | Role                                            |
|------------|---------|-------------------------------------------------|
| date-fns   | 4       | `differenceInSeconds` used by `useFastingTimer` |
| fflate     | 0.8     | Lightweight ZIP compression for CSV export      |

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
- `ProductTourOverlay` and `OnboardingModal` rendered at the app shell level

### Component Hierarchy

```
<App>
  <nav>
    Logo ("C" + "Gryffin Calorai")
    Nav links: Dashboard | Recipes | Progress | Settings
    Dark mode toggle button
  </nav>
  <main>
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        #dashboard -> <Dashboard>  (lazy)
          <ProductTourOverlay /> (tour overlay, renders globally)
          <OnboardingBanner /> (shown when no TDEE profile)
          [shadcn/ui <Dialog>] Edit Log / Barcode Food / Voice Food
          Section A - Masthead / Hero:
            <DashboardHero /> (totalCalories, macro totals, TDEE-sourced calorieGoal)
          Section B - Week in Review:
            <WeeklySummary />
            <StreakCard />
            <WaterTracker />
            <StepTracker />
            <FastingTimer />
            <ActivityLogger />
          Section C - Recently Logged: scroll chips (up to 8; quick-re-log)
          Section D - From the Pantry: favorites chips (quick-re-log)
          Section E - Add to Today's Log (3-col grid):
            "01 · Write" <EditorialFrame> -> <FoodLogger />
            "02 · Scan"  <EditorialFrame> -> <Suspense> <BarcodeScanner /> (lazy)
            "03 · Speak" <EditorialFrame> -> <VoiceFoodLogger />
          Section F - Today's Log: grouped by meal type, AnimatePresence stagger

        #recipes  -> <Recipes>    (lazy)
          Recipe creation form (react-hook-form + zod, useFieldArray for ingredients)
          Saved recipes list with delete

        #progress -> <Progress>   (lazy)
          Section 01 - Progress Tracking:
            7-day: ComposedChart stacked bars by meal type + goal ReferenceLine
            30-day: AreaChart total calories + goal ReferenceLine
            Tabs for 7 / 30 day toggle
          Section 02 - Body Measurements:
            <BodyMeasurements /> (log form + history table)
          Section 03 - Macro Nutrient Trends:
            7-day: AreaChart protein / carbs / fat
            30-day: placeholder message
          Section 04 - Water Intake Trend:
            AreaChart with waterGoal reference line
          Section 05 - Body Composition: (shown only if >= 2 measurements)
            LineChart: bodyFat%, waist, chest, hips with cm/in unit toggle
          Section 06 - Calorie Distribution:
            7-day: PieChart by meal type
            30-day: placeholder message
          Section 07 - Achievements:
            Grid of 19 achievement cards (locked/unlocked state)
            Unlock count summary

        #/settings -> <Settings>  (lazy)
          Hash-based sub-nav: Profile | Goals | Data | About
          Profile: <TdeeProfilePanel /> (lazy) - full TDEE edit + live preview
          Goals: <GoalSettings /> - inline edit for water goal (ml) + step goal (steps)
          Data: <DataExportPanel /> - JSON backup + CSV ZIP export; import with confirmation
          About: version info + GitHub link
      </Suspense>
    </ErrorBoundary>
  </main>
  <OnboardingModal /> (first-launch, localStorage flag)
  <KeyboardShortcutsOverlay /> (toggleable via keyboard shortcut)
```

### State Management

**Single Zustand Store (`src/state/AppState.ts`):**

```typescript
interface AppState {
  init: AppInitState         // 4-state machine
  dailyLogs: FoodItem[]      // today's food entries
  allFoodItems: FoodItem[]   // deduplicated recent items for suggestions
  recipes: Recipe[]
  favoriteFoods: FoodItem[]  // items with isFavorite = true
  dailyWaterLogs: WaterLog[]
  dailyStepLogs: StepLog[]
  bodyMeasurements: BodyMeasurement[]
  unlockedAchievements: UserAchievement[]
  waterGoalMl: number        // user-configurable; persisted in localStorage
  stepGoal: number           // user-configurable; persisted in localStorage
  error: string | null
  userId: UserId | null
  // Feature 13 - TDEE
  tdeeProfile: TdeeProfile | null
  // Feature 10 - Activity Logging
  dailyActivityLogs: ActivityLog[]
  allActivityLogs: ActivityLog[]
  // Feature 6 - Intermittent Fasting
  activeFastingSession: FastingSession | null
  fastingHistory: FastingSession[]
  // Product Tour (v0.2.0)
  tourActive: boolean
  tourStep: number
  tourTotalSteps: number
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

| Action                           | DB calls / behavior                                                                                                                                                                                                                                                                        |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `fetchInitialData(userId)`       | getOrCreateUser, getDailyFoodLogs, getAllRecipes, getRecentFoodItems, getFavoriteFoodItems, getDailyWaterLogs, getDailyStepLogs, getAllBodyMeasurements, getUnlockedAchievements, getTdeeProfile, getActiveFastingSession, getAllFastingSessions, getDailyActivityLogs, getAllActivityLogs |
| `refreshDailyLogs(userId)`       | getDailyFoodLogs                                                                                                                                                                                                                                                                           |
| `addFoodLog(food)`               | addFoodItemLog -> refreshDailyLogs -> checkAndUnlockAchievements                                                                                                                                                                                                                           |
| `deleteFoodLog(id)`              | deleteFoodItem(id, userId) -> refreshDailyLogs                                                                                                                                                                                                                                             |
| `updateFoodLog(id, updates)`     | updateFoodItem(id, updates, userId) -> refreshDailyLogs                                                                                                                                                                                                                                    |
| `toggleFavorite(id, isFavorite)` | toggleFavoriteFoodItem -> fetchFavorites + fetchAllFoodItems                                                                                                                                                                                                                               |
| `fetchFavorites(userId)`         | getFavoriteFoodItems                                                                                                                                                                                                                                                                       |
| `updateCalorieGoal(goal)`        | updateUserProfile(updatedUser, userId); updates init.user in-place                                                                                                                                                                                                                         |
| `fetchRecipes(userId)`           | getAllRecipes                                                                                                                                                                                                                                                                              |
| `deleteRecipe(id)`               | deleteRecipe(id, userId) -> fetchRecipes                                                                                                                                                                                                                                                   |
| `updateRecipe(recipe)`           | updateRecipeInDB(recipe) -> fetchRecipes                                                                                                                                                                                                                                                   |
| `fetchAllFoodItems(userId)`      | getRecentFoodItems                                                                                                                                                                                                                                                                         |
| `addWaterLog(amount)`            | constructs WaterLog -> addWaterLogToDB -> fetchDailyWaterLogs -> checkAndUnlockAchievements                                                                                                                                                                                                |
| `deleteWaterLog(id)`             | deleteWaterLog(id, userId) -> fetchDailyWaterLogs                                                                                                                                                                                                                                          |
| `fetchDailyWaterLogs(userId)`    | getDailyWaterLogs                                                                                                                                                                                                                                                                          |
| `addStepLog(steps)`              | constructs StepLog -> addStepLogToDB -> fetchDailyStepLogs -> checkAndUnlockAchievements                                                                                                                                                                                                   |
| `deleteStepLog(id)`              | deleteStepLog(id, userId) -> fetchDailyStepLogs                                                                                                                                                                                                                                            |
| `fetchDailyStepLogs(userId)`     | getDailyStepLogs                                                                                                                                                                                                                                                                           |
| `addBodyMeasurement(m)`          | addBodyMeasurementToDB -> fetchBodyMeasurements -> checkAndUnlockAchievements                                                                                                                                                                                                              |
| `deleteBodyMeasurement(id)`      | deleteBodyMeasurement(id, userId) -> fetchBodyMeasurements                                                                                                                                                                                                                                 |
| `fetchBodyMeasurements(userId)`  | getAllBodyMeasurements                                                                                                                                                                                                                                                                     |
| `fetchAchievements(userId)`      | getUnlockedAchievements                                                                                                                                                                                                                                                                    |
| `checkAndUnlockAchievements()`   | getAllFoodLogs + getAllWaterLogs + getUnlockedAchievementIds -> evaluateAchievements -> batch addUserAchievement -> getUnlockedAchievements -> toast.success per new achievement                                                                                                           |
| `setWaterGoalMl(ml)` (sync)      | validates [250, 10000]; persists to localStorage; sets waterGoalMl in store                                                                                                                                                                                                                |
| `setStepGoal(steps)` (sync)      | validates [1000, 100000]; persists to localStorage; sets stepGoal in store                                                                                                                                                                                                                 |
| `fetchTdeeProfile(userId)`       | getTdeeProfile                                                                                                                                                                                                                                                                             |
| `saveTdeeProfile(profile)`       | saveTdeeProfileToDB -> fetchTdeeProfile -> updates init.user.calorieGoal                                                                                                                                                                                                                   |
| `fetchDailyActivityLogs(userId)` | getDailyActivityLogs                                                                                                                                                                                                                                                                       |
| `addActivityLog(log)`            | addActivityLogToDB -> fetchDailyActivityLogs                                                                                                                                                                                                                                               |
| `deleteActivityLog(id)`          | deleteActivityLogFromDB -> fetchDailyActivityLogs                                                                                                                                                                                                                                          |
| `fetchFastingSessions(userId)`   | getAllFastingSessions + getActiveFastingSession                                                                                                                                                                                                                                            |
| `startFasting(targetHours)`      | startFastingSessionInDB -> fetchFastingSessions                                                                                                                                                                                                                                            |
| `endFasting(completed)`          | endFastingSessionInDB -> fetchFastingSessions                                                                                                                                                                                                                                              |
| `exportData()`                   | exportAllData -> returns BackupPayload                                                                                                                                                                                                                                                     |
| `importData(payload)`            | importBackup(payload) -> fetchInitialData -> returns ImportResult                                                                                                                                                                                                                          |
| `startTour()` (sync)             | sets tourActive=true, tourStep=0                                                                                                                                                                                                                                                           |
| `nextTourStep()` (sync)          | increments tourStep; calls endTour() if at last step                                                                                                                                                                                                                                       |
| `prevTourStep()` (sync)          | decrements tourStep (min 0)                                                                                                                                                                                                                                                                |
| `endTour()`                      | sets tourActive=false; persists tour-complete flag to localStorage                                                                                                                                                                                                                         |
| `skipTour()`                     | sets tourActive=false; persists tour-skipped flag to localStorage                                                                                                                                                                                                                          |
| `completeOnboarding()`           | completeOnboardingInDB -> updates init.user.hasCompletedOnboarding                                                                                                                                                                                                                         |

**State initialization flow:**

1. `App.tsx` `useLayoutEffect` calls `initializeDB()` then `fetchInitialData(UserId("1"))`
2. `fetchInitialData` sets `init: { status: "loading" }` then calls `getOrCreateUser`
3. All data slices loaded; `init: { status: "ready", user: profile }` set atomically
4. `waterGoalMl` and `stepGoal` initialized from localStorage before the store is created

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

All four page components and `BarcodeScanner` are `React.lazy`-loaded. `BarcodeScanner` has its
own nested `<Suspense>` boundary, keeping `vendor-barcode` out of the initial load.

---


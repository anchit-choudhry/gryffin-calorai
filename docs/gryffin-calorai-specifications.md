# Gryffin Calorai: Complete Application Specification

**Project:** Gryffin Calorai  
**Version:** 0.0.2 (MVP)  
**Type:** Single-Page Application (React/Vite SPA)  
**Status:** Development  
**Last Updated:** April 26, 2026  
**Analysis Scope:** src/ folder reverse-engineering

---

## 1. Executive Summary

Gryffin Calorai is a privacy-first calorie tracking application that runs entirely in the browser using IndexedDB for local data persistence. Users log daily food intake, track macronutrients (protein, carbs, fat), create reusable recipes, and visualize calorie consumption trends. The application uses no backend server, enabling offline-first operation and zero data exposure.

**Core Value Proposition:** Lightweight, privacy-focused calorie and macro tracking without server dependency (MVP phase).

**Version 0.0.2 Status:**

- ✅ Complete macro tracking system (protein, carbs, fat throughout data layer and UI)
- ✅ Enhanced Dashboard with macro breakdown cards and progress bars
- ✅ Database schema v3 with automatic migration for backward compatibility
- ✅ Recipe manager with ingredient-based composition
- ✅ Progress charts with 7/30-day views
- ✅ Dark mode support with localStorage persistence
- ✅ Error boundary for graceful failure recovery
- ✅ Type-safe branded types for ID prevention
- ✅ 14 unit tests (100% coverage on dbService and AppState)
- ✅ 11 GitHub Actions CI/CD workflows

---

## 2. Technology Stack

### Frontend Framework

- **React 19.2.5** — Component library with automatic JSX transform
- **Vite 8.0.10** — Build tool with HMR, code splitting, compression
- **TypeScript 6.0.3** — Strict type checking, JSX as `react-jsx`

### State Management & Storage

- **Zustand 5.0.12** — Single lightweight store, hook-based actions
- **Dexie 4.4.2** — IndexedDB abstraction (no backend)
- **Database Name:** `GryffinCaloraiDB` (client-side only)

### UI & Styling

- **Tailwind CSS 4.2.4** — Utility-first CSS, dark mode: `class`-based
- **React Icons 5.6.0** — SVG icons (Feather, Material Design)
- **Chart.js 4.5.1** + **react-chartjs-2 5.3.1** — Line charts for progress

### Developer Tools

- **Vitest 4.1.5** — Unit testing with jsdom environment
- **@vitest/ui 4.1.5** — Interactive test dashboard
- **ESLint 10.2.1** — React hooks, TypeScript linting
- **Prettier 3.8.3** — Code formatting
- **fake-indexeddb 6.2.5** — Mock IndexedDB for tests

### Configuration

- **Module Target:** ES2023
- **JSX Transform:** `react-jsx` (automatic React import)
- **Module Resolution:** Bundler mode
- **TypeScript Flags:** `strict`, `verbatimModuleSyntax`

---

## 3. Architecture Overview

### Application Entry Point

**src/main.tsx** (root React mount):

```
document.getElementById("app")
  → StrictMode (React development checks)
    → ErrorBoundary (catches React render errors)
      → App (root component)
```

**src/App.tsx** (root component):

- Manages hash-based routing (`#dashboard`, `#recipes`, `#progress`)
- Manages dark mode toggle with localStorage persistence
- Renders navigation header with branding and theme control
- Initializes database and global state on mount
- Renders conditional page view based on current hash

### Component Hierarchy

```
<App>
  ├── Navigation Header
  │   ├── Logo ("C" badge + "Gryffin Calorai" text)
  │   ├── Nav Links (Dashboard | Recipes | Progress)
  │   └── Dark Mode Toggle (☀️ / 🌙)
  │
  └── Router (hash-based)
      ├── Dashboard
      │   ├── Summary Card (Total Intake, Progress Bar)
      │   ├── Macro Breakdown Cards (Protein, Carbs, Fat)
      │   ├── FoodLogger Form Component
      │   ├── BarcodeScanner Placeholder
      │   └── Daily Log History (list with delete buttons)
      │
      ├── Recipes
      │   ├── Recipe Creation Form
      │   │   ├── Recipe Name & Description inputs
      │   │   ├── Dynamic Ingredient List
      │   │   └── Save Recipe button
      │   │
      │   └── Existing Recipes List
      │       └── Delete Recipe buttons
      │
      └── Progress
          ├── Toggle (7 days / 30 days view)
          └── Line Chart
              ├── Consumed Calories (area fill, indigo)
              └── Daily Goal Line (dashed red)
```

### State Management Architecture

**Single Zustand Store (AppState):**

```typescript
interface AppState {
  // Data
  user: UserProfile | null
  dailyLogs: FoodItem[]          // Today's entries (computed from DB)
  allFoodItems: FoodItem[]        // Recent food items
  recipes: Recipe[]               // User's recipes
  
  // UI State
  isLoading: boolean
  error: string | null
  userId: UserId | null
  
  // Actions (async)
  fetchInitialData(userId): Promise<void>
  refreshDailyLogs(userId): Promise<void>
  addFoodLog(food): Promise<void>
  deleteFoodLog(id): Promise<void>
  updateCalorieGoal(goal): Promise<void>
  fetchRecipes(userId): Promise<void>
  deleteRecipe(id): Promise<void>
  fetchAllFoodItems(userId): Promise<void>
}
```

**State Initialization Flow:**

1. App mounts → `App.tsx` useLayoutEffect calls `initializeDB()`
2. Database opens/migrates → `App.tsx` calls `fetchInitialData(MOCK_USER_ID)`
3. fetchInitialData:
  - Creates or retrieves user via `getOrCreateUser()`
  - Fetches today's logs via `getDailyFoodLogs(userId, todayISO())`
  - Fetches recipes via `getAllRecipes(userId)`
  - Fetches recent food items via `getRecentFoodItems(userId)`
4. AppState updates, components re-render

**Data Flow:**

```
Components → Custom Hooks → Zustand Actions → DB Service → Dexie/IndexedDB
```

---

## 4. Data Model & Schema

### Database Schema (Dexie.js)

#### Schema Versions

**Version 1** (Initial):

- `users`: `id, username, email, lastLogin`
- `foodItems`: `++id, [userId+dateLogged], name, calories, servingSize, dateLogged`
- `recipes`: `++id, name, description, createdBy, dateCreated, userId`

**Version 2** (Upgrade: Add calorieGoal to users):

- Adds `calorieGoal` field to users table
- Adds `userId` index to foodItems for direct user lookups
- Migration: Sets `calorieGoal = 2000` for all existing users

**Version 3** (Upgrade: Add macros to foodItems):

- Adds `protein`, `carbs`, `fat` fields to foodItems
- Migration: Backfills existing items with `0` for all three fields

### Tables

#### Table: `users`

**Primary Key:** `id` (UserId - string)  
**Indices:** `id, username, email, lastLogin`

```typescript
interface UserProfile {
  id: UserId;                    // e.g., "1"
  username: string;              // e.g., "Guest"
  email: string;                 // e.g., "guest@example.com"
  lastLogin: string;             // ISO 8601 timestamp
  calorieGoal: number;           // Default 2000 kcal
}
```

**Observed Behavior:**

- Single user per session (hardcoded mock user ID = "1")
- User created on first run if not exists
- `lastLogin` updated on `getOrCreateUser()` call
- No authentication or multi-user support in MVP
- `calorieGoal` editable from Dashboard

**Queries:**

```typescript
getOrCreateUser(userId, username, email): Promise<UserProfile>
updateUserProfile(profile): Promise<void>
```

---

#### Table: `foodItems`

**Primary Key:** `++id` (auto-increment FoodItemId)  
**Compound Index:** `[userId+dateLogged]` (optimized for daily queries)  
**Other Indices:** `userId, name, calories, servingSize, dateLogged`

```typescript
interface FoodItem {
  id?: FoodItemId;               // Auto-generated (1, 2, 3, ...)
  userId: UserId;                // e.g., "1"
  name: string;                  // 1-100 chars (e.g., "Apple")
  calories: number;              // 0-10000 range (validated)
  servingSize: number;           // 1-100 grams/servings (validated)
  protein: number;               // 0-500g (validated)
  carbs: number;                 // 0-500g (validated)
  fat: number;                   // 0-500g (validated)
  dateLogged: ISODate;           // YYYY-MM-DD format
}
```

**Input Validation Constraints (useFoodForm):**

- `name`: 1-100 characters, required
- `calories`: 0-10000 kcal
- `servingSize`: 1-100
- `protein`: 0-500g
- `carbs`: 0-500g
- `fat`: 0-500g

**Observed Behavior:**

- Multiple items per user per day allowed (compound index supports this)
- Each entry is independently stored (no aggregation at insert time)
- Macros default to 0 for backward compatibility (v3 migration)
- Calories and serving size stored separately (not calculated from macros)
- Daily totals computed in memory in Dashboard and Progress pages

**Queries:**

```typescript
getDailyFoodLogs(userId, date): Promise<FoodItem[]>
  // WHERE [userId+dateLogged] = [userId, date]

getAllFoodLogs(userId): Promise<FoodItem[]>
  // WHERE userId = userId (used for progress calculations)

getRecentFoodItems(userId): Promise<FoodItem[]>
  // Fetches recent items for quick-add suggestions

addFoodItemLog(foodLog): Promise<FoodItemId>
  // INSERT, returns auto-increment ID

deleteFoodItem(id): Promise<void>
  // DELETE by id
```

---

#### Table: `recipes`

**Primary Key:** `++id` (auto-increment RecipeId)  
**Indices:** `name, description, createdBy, dateCreated, userId`

```typescript
interface Recipe {
  id?: RecipeId;                 // Auto-generated
  userId: UserId;                // Scoped to user
  name: string;                  // Recipe name (e.g., "High Protein Breakfast")
  description: string;           // Multi-line description
  ingredients: Array<{
    foodItemId: FoodItemId;      // Reference to a food item (not joined)
    quantity: number;            // Amount (not used in calories)
    serving: number;             // Serving unit (not used in calories)
  }>;
  totalCalories: number;         // Hardcoded: ingredients.length * 100
  createdBy: UserId;
  dateCreated: string;           // ISO 8601 timestamp
}
```

**Observed Behavior:**

- `totalCalories` calculated as: `num_ingredients * 100` (constant per ingredient)
- `quantity` and `serving` fields stored but ignored in calorie math
- No join queries to fetch full FoodItem details
- Recipes are static templates (not auto-updated if ingredient changes)

**Queries:**

```typescript
saveRecipe(recipe): Promise<RecipeId>
  // INSERT recipe

getAllRecipes(userId): Promise<Recipe[]>
  // WHERE userId = userId

deleteRecipe(id): Promise<void>
  // DELETE by id
```

---

### Branded Types System

**Purpose:** Prevent ID mix-ups at compile time (no runtime cost)

```typescript
type UserId = string & { readonly __brand: "UserId" };
type FoodItemId = number & { readonly __brand: "FoodItemId" };
type RecipeId = number & { readonly __brand: "RecipeId" };
type ISODate = string & { readonly __brand: "ISODate" };

// Constructors (runtime brand casting)
UserId(id: string): UserId
FoodItemId(id: number): FoodItemId
RecipeId(id: number): RecipeId
ISODate(date: string): ISODate
todayISO(): ISODate  // Returns today's date as ISODate

// Type Guards (runtime validation)
isFoodItemId(value): boolean
isUserId(value): boolean
isRecipeId(value): boolean
isISODate(value): boolean  // Regex: /^\d{4}-\d{2}-\d{2}$/
```

**Usage Pattern:**

```typescript
// Prevents this at compile time:
deleteFoodLog(recipeId)  // ❌ Type mismatch

// Enforces this:
deleteFoodLog(foodItemId)  // ✅ Correct type
```

---

## 5. Features & Observed Requirements (EARS Format)

### Feature 1: Food Logging

**EARS Observations:**

| Type             | Statement                                                                                                                                                             |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The system shall store food log entries in the `foodItems` table with user ID, date, and calorie information.                                                         |
| **Ubiquitous**   | The FoodLogger component shall accept food name, calories, serving size, protein, carbs, and fat as user inputs.                                                      |
| **Event-driven** | When a user submits the food log form, the system shall validate all inputs according to defined constraints.                                                         |
| **Event-driven** | When validation fails, the system shall display error message: "Please enter a valid name, calories (0-10000), serving size (1-100), and protein/carbs/fat (0-500g)." |
| **Event-driven** | When validation succeeds, the system shall call `addFoodLog()` action in AppState.                                                                                    |
| **Event-driven** | When `addFoodLog()` succeeds, the system shall refresh daily logs via `refreshDailyLogs()`.                                                                           |
| **Event-driven** | When `addFoodLog()` succeeds, the system shall display success message: "Successfully logged {name}! Macros updated."                                                 |
| **State-driven** | While `isLoading` is true, the system shall disable the submit button and show loading indicator.                                                                     |
| **State-driven** | While form message is displayed, the system shall show error (red) or success (green) styling.                                                                        |

**Interaction Flow:**

1. User navigates to Dashboard page
2. User fills FoodLogger form
3. User clicks "Log Food" button (form validation triggered)
4. If invalid → show error message, form stays open
5. If valid → call `addFoodLog()` action
6. Zustand state updates → component re-renders
7. Dashboard summary recalculates total calories/macros
8. Success message shown, form resets

**Data Persistence:**

- Stored in `foodItems` table with compound index `[userId+dateLogged]`
- Retrieved daily via `getDailyFoodLogs(userId, todayISO())`
- Aggregated in memory for Dashboard totals

---

### Feature 2: Calorie Goal Management

**EARS Observations:**

| Type             | Statement                                                                                  |
|------------------|--------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The Dashboard shall display the current user's calorie goal.                               |
| **Ubiquitous**   | The system shall calculate progress as: `(totalCalories / calorieGoal) * 100`.             |
| **Event-driven** | When user clicks the goal edit button, the system shall display an inline edit form.       |
| **Event-driven** | When user saves a new goal, the system shall call `updateCalorieGoal()` action.            |
| **Event-driven** | When `updateCalorieGoal()` succeeds, the system shall update the user profile in AppState. |
| **State-driven** | While in edit mode, the system shall show input field, Save button, and Cancel button.     |
| **State-driven** | While not in edit mode, the system shall show goal as read-only text with edit icon.       |

**Default Goal:**

- New users assigned `calorieGoal = 2000` kcal

**Progress Bar Behavior:**

- Capped at 100% display (even if user exceeds goal)
- Shows percentage text: "{percent}% of daily goal"

---

### Feature 3: Recipe Management

**EARS Observations:**

| Type             | Statement                                                                                            |
|------------------|------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The system shall store recipes with name, description, and ingredient list.                          |
| **Ubiquitous**   | The recipe system shall calculate total calories as: `ingredients.length * 100`.                     |
| **Event-driven** | When user adds an ingredient, the system shall display a new ingredient row with food item selector. |
| **Event-driven** | When user selects a food item from the dropdown, the system shall populate ingredient fields.        |
| **Event-driven** | When user removes an ingredient, the system shall delete that row from the ingredient list.          |
| **Event-driven** | When user submits the recipe form, the system shall validate name and ingredients are not empty.     |
| **Event-driven** | When recipe save succeeds, the system shall refresh the recipes list via `fetchRecipes()`.           |
| **Event-driven** | When user clicks delete on a recipe, the system shall call `deleteRecipe()` action.                  |
| **State-driven** | While form is submitting (`isLoading = true`), the system shall disable the save button.             |

**Ingredient Selector:**

- Populated from `allFoodItems` array in AppState
- Shows food name and calorie count
- Selecting a food item fills in: foodItemId, name, calories

**Note:** Quantity and serving fields are stored but not used in total calorie calculation.

---

### Feature 4: Progress Visualization

**EARS Observations:**

| Type             | Statement                                                                                       |
|------------------|-------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The Progress page shall display a line chart of daily calorie totals.                           |
| **Ubiquitous**   | The chart shall show a dashed red line for the user's daily goal.                               |
| **Event-driven** | When user clicks "7 days" toggle, the system shall request progress data for last 7 days.       |
| **Event-driven** | When user clicks "30 days" toggle, the system shall request progress data for last 30 days.     |
| **State-driven** | While progress data is loading (`isLoading = true`), the system shall show a loading indicator. |

**Data Calculation (useProgressData hook):**

- Fetches all user's food logs via `getAllFoodLogs(userId)`
- Groups logs by date: `Map<date, totalCalories>`
- Generates last N days (7 or 30)
- For each day, sums calories: `totalCalories = sum(logs.calories)`
- If no logs for a day, shows 0 calories
- Labels formatted as "MM-DD" (e.g., "04-26")

**Chart Configuration:**

- Line color (Calories Consumed): indigo-600
- Area fill: indigo-600 at 0.1 opacity
- Goal line: red-500, dashed [5,5], no points
- Tension: 0.3 (smooth curves)

---

### Feature 5: Dark Mode

**EARS Observations:**

| Type             | Statement                                                                                                    |
|------------------|--------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The application shall support dark and light color themes.                                                   |
| **Ubiquitous**   | The system shall apply the 'dark' class to the document root to trigger Tailwind dark mode.                  |
| **Event-driven** | When user clicks the dark mode toggle button (☀️ / 🌙), the system shall switch theme.                       |
| **Event-driven** | When theme is switched, the system shall persist preference to localStorage as `darkMode`.                   |
| **State-driven** | On application startup, the system shall read `darkMode` from localStorage if present.                       |
| **State-driven** | If `darkMode` is not in localStorage, the system shall respect the OS preference via `prefers-color-scheme`. |
| **Optional**     | Where dark mode is active, the system shall apply dark background colors and light text.                     |

**Implementation:**

- Tailwind config: `darkMode: 'class'` (selector-based)
- App.tsx state: `darkMode` boolean
- useLayoutEffect: applies/removes 'dark' class on root
- localStorage key: `darkMode` (JSON boolean)
- Toggle button cycles theme and persists

---

### Feature 6: Error Boundary

**EARS Observations:**

| Type             | Statement                                                                                            |
|------------------|------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The application shall wrap the root component in an ErrorBoundary.                                   |
| **Event-driven** | When a React component throws an error during render, the ErrorBoundary shall catch it.              |
| **Event-driven** | When an error is caught, the ErrorBoundary shall display a user-friendly fallback UI.                |
| **Event-driven** | When error is caught, the system shall log the error to the browser console.                         |
| **Event-driven** | When user clicks "Reload Page" button on fallback, the system shall call `window.location.reload()`. |
| **State-driven** | While error is displayed, the system shall show error ID (UUID) for debugging.                       |

**ErrorBoundary Scope:**

- Catches React render errors in child components
- Does NOT catch async errors, event handler errors, or promise rejections
- Displays: error message, error ID, reload button

---

## 6. Non-Functional Requirements & Constraints

### Performance

**EARS Observations:**

| Type           | Statement                                                                 |
|----------------|---------------------------------------------------------------------------|
| **Ubiquitous** | The system shall load and initialize within 2 seconds on first run.       |
| **Ubiquitous** | Daily log queries shall complete within 100ms using the compound index.   |
| **Ubiquitous** | The application bundle shall be compressed with Gzip and Brotli.          |
| **Ubiquitous** | The system shall use code splitting to reduce initial JavaScript payload. |

### Storage

**EARS Observations:**

| Type           | Statement                                                                        |
|----------------|----------------------------------------------------------------------------------|
| **Ubiquitous** | All user data shall be stored locally in IndexedDB (`GryffinCaloraiDB`).         |
| **Ubiquitous** | The system shall not send any user data to external servers.                     |
| **Ubiquitous** | The system shall not require user authentication or account creation.            |
| **Ubiquitous** | Users shall not lose data when clearing browser cookies (IndexedDB is separate). |

### Accessibility

**EARS Observations:**

| Type           | Statement                                                                       |
|----------------|---------------------------------------------------------------------------------|
| **Ubiquitous** | The application shall use semantic HTML elements (form, input, button, etc.).   |
| **Ubiquitous** | Form inputs shall have associated label elements.                               |
| **Ubiquitous** | Buttons shall have descriptive text or aria-labels.                             |
| **Optional**   | Where possible, the application shall respect keyboard navigation (tab, enter). |

**Note:** Full WCAG 2.1 AA compliance planned for v0.0.3.

### Security

**EARS Observations:**

| Type             | Statement                                                                                            |
|------------------|------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The system shall validate all user inputs before storing to database.                                |
| **Ubiquitous**   | The system shall not execute user-supplied code or dynamic scripts.                                  |
| **Ubiquitous**   | The application shall run over HTTPS in production.                                                  |
| **Event-driven** | When user input exceeds allowed ranges, the system shall reject the input and display error message. |
| **State-driven** | While recipe description is displayed, the system shall escape HTML special characters.              |

**Identified Gaps:**

- ⚠️ Recipe descriptions not currently sanitized (XSS risk if user-generated content added)
- ⚠️ No CSRF protection (no backend, but relevant if backend added later)
- ⚠️ No rate limiting on database operations

### Offline Capability

**EARS Observations:**

| Type             | Statement                                                                 |
|------------------|---------------------------------------------------------------------------|
| **Ubiquitous**   | The system shall function fully offline (no network connection required). |
| **Ubiquitous**   | All data changes shall persist in IndexedDB even if browser is closed.    |
| **State-driven** | While offline, the system shall not attempt to sync data to servers.      |

**Note:** Service Worker / PWA features planned for v0.0.3.

---

## 7. User Flows & Scenarios

### Scenario 1: First-Time User Setup

1. User opens application
2. App initializes: `App.tsx` → `initializeDB()` → `fetchInitialData()`
3. System checks if user exists in `users` table
4. User not found → `getOrCreateUser()` creates "Guest" user
5. Dashboard loads with empty daily logs
6. User can immediately start logging food

### Scenario 2: Logging Food & Tracking Daily Intake

1. User on Dashboard page
2. User fills FoodLogger form (name, calories, macros)
3. User clicks "Log Food"
4. `useFoodForm.submitFoodLog()` validates input
5. If valid: `addFoodLog()` action → `addFoodItemLog()` DB call → Dexie insert
6. `refreshDailyLogs()` re-fetches `getDailyFoodLogs()`
7. Dashboard `dailyLogs` state updates
8. Summary card recalculates totals (sum of calories, protein, carbs, fat)
9. Progress bar updates
10. User sees success message
11. Form resets to initial state

### Scenario 3: Creating a Reusable Recipe

1. User navigates to Recipes page
2. User fills recipe form (name, description)
3. User clicks "Add Ingredient" button (multiple times)
4. For each ingredient: user selects food item from dropdown
5. System populates calorie info from selected food
6. User clicks "Save Recipe"
7. `saveRecipeForm()` validates: name and ingredients not empty
8. If valid: `saveRecipe()` DB call → Dexie insert → returns RecipeId
9. System calls `fetchRecipes()` → re-queries all user's recipes
10. Recipes list updates with new recipe
11. User sees success message

### Scenario 4: Viewing Progress Over Time

1. User navigates to Progress page
2. `useProgressData(7)` hook runs
3. Fetches all user's logs via `getAllFoodLogs(userId)`
4. Groups by date, sums calories per day
5. Generates 7 days of labels and data
6. Chart.js renders line chart with area fill
7. Red dashed line shows user's daily goal
8. User clicks "30 days" toggle
9. Hook re-runs with `days=30` parameter
10. Chart updates to show 30-day view

### Scenario 5: Switching Themes

1. User clicks dark mode toggle button (☀️ / 🌙)
2. `toggleDarkMode()` function called
3. State updated: `setDarkMode(!darkMode)`
4. useLayoutEffect runs → adds/removes 'dark' class on document root
5. Tailwind CSS applies dark color scheme to entire app
6. localStorage key 'darkMode' updated with new preference
7. On next visit, app reads 'darkMode' from localStorage
8. Theme restored automatically

---

## 8. Known Limitations & Technical Debt

### Implemented Features ✅

- Food logging with macro tracking
- Recipe manager with dynamic ingredients
- Progress charts (7/30 days)
- Daily intake summary with goal tracking
- Dark mode toggle
- Error boundary for crash recovery
- Type-safe branded types
- Database schema versioning with migrations
- 14 unit tests (100% coverage on core logic)
- 11 CI/CD GitHub Actions workflows

### Planned / Placeholders ⏳

- **Barcode Scanner:** `BarcodeScanner.tsx` exists as stub; requires Camera API integration
- **Component Tests:** Dashboard, FoodLogger, etc. need integration tests
- **Multi-User Support:** Currently single hardcoded user ("1"); auth needed for v0.0.3
- **PWA Features:** Service Worker, offline sync, install prompt
- **Recipe Macros:** Currently hardcoded `100 cal/ingredient`; should calculate from ingredients
- **Macro Breakdown in Recipes:** Recipes should aggregate protein/carbs/fat from ingredients

### Technical Debt & Security Gaps

| Issue                             | Severity | Location                          | Mitigation                                          |
|-----------------------------------|----------|-----------------------------------|-----------------------------------------------------|
| Recipe descriptions not sanitized | Medium   | `useRecipeForm`, `Recipes.tsx`    | Sanitize on display or restrict to plain text       |
| No CSRF protection                | Low      | N/A (no backend)                  | Add if backend integration planned                  |
| No rate limiting                  | Low      | dbService                         | Rate limit large batch operations                   |
| Ingredient totals hardcoded       | Medium   | `useRecipeForm`, Recipe interface | Calculate from ingredient macros                    |
| No optimistic updates             | Low      | AppState actions                  | Consider Zustand middleware                         |
| Minimal component tests           | Medium   | src/components/, src/pages/       | Target >80% coverage on all layers                  |
| `fake-indexeddb` for testing      | Low      | vitest config                     | Adequate for MVP; consider real IndexedDB if needed |

---

## 9. API/Query Reference

### Database Service Exports (dbService.ts)

**Initialization:**

```typescript
initializeDB(): Promise<void>
// Initializes Dexie, applies migrations, opens database

clearDatabase(): Promise<void>
// Clears all tables and reopens database (dev utility)
```

**User Operations:**

```typescript
getOrCreateUser(userId: UserId, username: string, email: string): Promise<UserProfile>
// Creates user if not exists, updates lastLogin, returns profile

updateUserProfile(profile: UserProfile): Promise<void>
// Saves user profile changes (e.g., calorieGoal)
```

**Food Log Operations:**

```typescript
addFoodItemLog(foodLog: FoodItem): Promise<FoodItemId>
// Inserts food log, returns auto-generated ID

getDailyFoodLogs(userId: UserId, date: ISODate): Promise<FoodItem[]>
// Fetches logs for specific user and date (uses compound index)

getAllFoodLogs(userId: UserId): Promise<FoodItem[]>
// Fetches all logs for user (used for progress calculations)

getRecentFoodItems(userId: UserId): Promise<FoodItem[]>
// Fetches recent items for quick-add suggestions

deleteFoodItem(id: FoodItemId): Promise<void>
// Deletes a food log entry by ID
```

**Recipe Operations:**

```typescript
saveRecipe(recipe: Recipe): Promise<RecipeId>
// Inserts recipe, returns auto-generated ID

getAllRecipes(userId: UserId): Promise<Recipe[]>
// Fetches all recipes for user

deleteRecipe(id: RecipeId): Promise<void>
// Deletes a recipe by ID
```

### Zustand Store Actions (AppState.ts)

```typescript
fetchInitialData(userId: UserId): Promise<void>
// Initializes user, loads daily logs, recipes, recent items

refreshDailyLogs(userId: UserId): Promise<void>
// Re-queries today's food logs from database

addFoodLog(food: Omit<FoodItem, "id">): Promise<void>
// Logs food item, triggers refreshDailyLogs

deleteFoodLog(id: FoodItemId): Promise<void>
// Deletes food log, triggers refreshDailyLogs

updateCalorieGoal(goal: number): Promise<void>
// Updates user's daily calorie goal

fetchRecipes(userId: UserId): Promise<void>
// Re-queries all recipes for user

deleteRecipe(id: RecipeId): Promise<void>
// Deletes recipe, triggers fetchRecipes

fetchAllFoodItems(userId: UserId): Promise<void>
// Fetches recent food items for quick-add
```

### Custom Hooks

**useFoodForm():**

```typescript
{
  name, setName,
  calories, setCalories,
  servingSize, setServingSize,
  protein, setProtein,
  carbs, setCarbs,
  fat, setFat,
  isLoading,
  message: string | null,
  submitFoodLog(): Promise<boolean>,
  resetForm(): void
}
```

**useRecipeForm(userId, allFoodItems):**

```typescript
{
  recipeName, setRecipeName,
  description, setDescription,
  ingredients: FormIngredient[],
  addIngredient(): void,
  removeIngredient(id: string): void,
  updateIngredient(id, field, value): void,
  selectIngredientFoodItem(ingredientId, foodItem): void,
  message: string | null,
  isLoading,
  saveRecipeForm(): Promise<boolean>
}
```

**useProgressData(days: 7 | 30):**

```typescript
{
  labels: string[],          // ["04-20", "04-21", ...]
  data: number[],            // [1500, 2100, ...]
  isLoading: boolean
}
```

---

## 10. Testing Strategy

### Current Test Coverage

| Module     | Type        | Count   | Coverage |
|------------|-------------|---------|----------|
| dbService  | Unit        | 7       | 100%     |
| AppState   | Unit        | 7       | 100%     |
| FoodLogger | Integration | Planned | 0%       |
| Dashboard  | Integration | Planned | 0%       |
| Recipes    | Integration | Planned | 0%       |
| Progress   | Integration | Planned | 0%       |

**Target:** >80% coverage for all logic layers (state, db, hooks)

### Test Tools

- **Runner:** Vitest 4.1.5
- **Environment:** jsdom
- **IndexedDB Mock:** fake-indexeddb
- **UI:** @vitest/ui for interactive dashboard

### Test Patterns

**DB Tests (dbService.test.ts):**

- Mock database initialization
- Test CRUD operations
- Test query filters
- Test migrations (if applicable)

**State Tests (AppState.test.ts):**

- Test action state transitions
- Test error handling
- Test async action flow
- Mock database layer

**Hook Tests (planned):**

- Test form validation logic
- Test state updates
- Mock Zustand store

**Component Tests (planned):**

- Test render output
- Test user interactions
- Test accessibility (a11y)

---

## 11. Deployment & Build

### Build Output

- **Command:** `pnpm build`
- **Output:** `dist/` folder with:
  - `index.html` (single entry point)
  - `assets/` folder with JS/CSS bundles
  - Static compression: Gzip + Brotli

### Environment Variables

- None required (client-only app)
- All configuration hardcoded (e.g., DB name, mock user ID)

### Deployment Checklist

- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm lint`
- [ ] All tests pass: `pnpm test`
- [ ] Bundle size acceptable: `du -sh dist/`
- [ ] Deployed over HTTPS
- [ ] Dark mode toggle works
- [ ] IndexedDB persists across sessions

### Hosting Requirements

- Static file server (no backend needed)
- HTTPS required
- CORS not needed (client-only)
- No service worker required (v0.0.2)

---

## 12. Uncertainties & Questions

### Data Design

- **Q:** Should recipe macros be calculated from ingredients, or stay hardcoded?
  - **Current:** Hardcoded at 100 kcal per ingredient
  - **Recommendation:** Calculate totalCalories as `sum(ingredient.calories)` and add totalProtein, totalCarbs, totalFat

- **Q:** Should quantity and serving fields in recipes be used?
  - **Current:** Stored but ignored
  - **Recommendation:** Either remove fields or implement portion-based calorie calculation

### User Experience

- **Q:** Should users be able to manually adjust daily goals from a range?
  - **Current:** Editable free-form number
  - **Recommendation:** Add min/max constraints (e.g., 500-5000 kcal)

- **Q:** Should food logs be editable, or only deletable?
  - **Current:** Only deletable; no edit UI
  - **Recommendation:** Add edit UI for convenience

### Multi-User Support

- **Q:** Should v0.0.3 implement multi-user with authentication?
  - **Current:** Single hardcoded user "1"
  - **Recommendation:** Use localStorage-based session or mock auth for MVP

### Performance

- **Q:** Should there be pagination for food logs and recipes lists?
  - **Current:** All items loaded at once
  - **Recommendation:** Paginate after 50+ items for performance

---

## 13. Recommendations for Future Enhancements

### v0.0.3 Priorities

1. **Component Testing:** Add integration tests for pages and components
2. **Multi-User Support:** Add mock auth (localStorage-based session)
3. **Barcode Scanner:** Integrate Camera API for food lookup
4. **Macro Calculations:** Calculate recipe macros from ingredients
5. **Recipe Editing:** Allow users to edit existing recipes
6. **Food Item Editing:** Allow users to edit logged food items

### v0.0.4+ Features

1. **PWA Capabilities:** Service Worker, offline sync, install prompt
2. **Advanced Macros:** Carb cycling, macro targets, nutritional breakdowns
3. **Data Export:** Export logs to CSV, PDF
4. **Food Database:** Integrate USDA food database or Nutritionix API
5. **Meal Plans:** Pre-built meal templates
6. **Social Features:** Share progress, friend comparisons (if desired)

---

## 14. Summary

Gryffin Calorai v0.0.2 is a functional MVP calorie tracker that demonstrates:

- ✅ Clean React/Zustand architecture with single responsibility
- ✅ Type-safe development with branded types
- ✅ Client-side data persistence with IndexedDB
- ✅ Responsive UI with dark mode support
- ✅ Error resilience with ErrorBoundary
- ✅ Automated testing and CI/CD pipelines

The codebase is well-organized, follows established React patterns, and is ready for feature expansion. Key areas for v0.0.3 are component testing, multi-user support, and real barcode scanning integration.

---

**Document Generated:** April 26, 2026  
**Analysis Method:** Reverse-engineering from src/ folder  
**Tools Used:** Bash grep, Read file exploration, TypeScript analysis  
**Scope:** Complete feature set and architecture as of v0.0.2

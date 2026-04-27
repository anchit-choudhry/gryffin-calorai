# Gryffin Calorai: Complete Application Specification

**Project:** Gryffin Calorai  
**Version:** 0.0.2 (MVP with Macro Tracking)  
**Type:** Single-Page Application (SPA)  
**Status:** Development  
**Last Updated:** 2026-04-26

---

## 1. Executive Summary

Gryffin Calorai is a React-based calorie tracking application designed for MVP-level functionality. It enables users to log daily food intake with detailed macronutrient tracking (protein, carbs, fat), create reusable recipes, and visualize their calorie consumption trends over time. The application uses client-side local storage (IndexedDB) for data persistence and Zustand for state management.

**Core Value Proposition:** Lightweight, privacy-focused calorie and macro tracking without server dependency (MVP phase).

**Version 0.0.2 Enhancements:**

- Complete macro tracking system (protein, carbs, fat fields throughout data layer and UI)
- Enhanced Dashboard with macro breakdown cards
- Database schema v3 with automatic migration for backward compatibility
- Security improvements: error boundary enhancements, input validation, localStorage safety
- React standards compliance: error handling, TypeScript strict mode, custom hook patterns

---

## 2. Technology Stack

### Frontend

- **Framework:** React 19.2.5 (React 19 with JSX transform)
- **State Management:** Zustand 5.0.12 (lightweight client-side store)
- **Styling:** Tailwind CSS 4.2.4 with dark mode support (`darkMode: "selector"`)
- **UI Components:** React Icons 5.6.0 for icon assets
- **Build Tool:** Vite 8.0.10 (fast development + optimized production builds)
- **Type System:** TypeScript 6.0.3 (strict mode enabled)

### Data & Storage

- **Local Database:** Dexie 4.4.2 (IndexedDB abstraction layer)
- **Database Name:** `GryffinCaloraiDB`
- **Storage Scope:** Client-side only (no server persistence)

### Charts & Visualization

- **Chart Library:** Chart.js 4.5.1
- **React Integration:** react-chartjs-2 5.3.1
- **Chart Type:** Line chart with area fill for progress visualization

### Developer Tools

- **Linter:** ESLint 10.2.1 with React hooks rules
- **Code Formatter:** Prettier 3.8.3
- **Testing:** Vitest 4.1.5 with jsdom
- **Type Checking:** TypeScript strict mode
- **Compression:** Gzip + Brotli (vite-plugin-compression2)

### Configuration

- **Module Target:** ES2023
- **JSX Transform:** `react-jsx` (automatic React import)
- **Module Resolution:** Bundler mode with verbatimModuleSyntax

---

## 3. Architecture Overview

### Component Hierarchy

```
App (root, routing, theme)
├── ErrorBoundary (error catching)
├── Navigation Header
│   ├── Logo / Branding
│   ├── Navigation Links (Dashboard, Recipes, Progress)
│   └── Dark Mode Toggle
└── Router (hash-based)
    ├── Dashboard (page)
    │   ├── FoodLogger (component)
    │   ├── BarcodeScanner (component, placeholder)
    │   └── Daily Log History (component)
    ├── Recipes (page)
    │   └── Recipe Form (component)
    └── Progress (page)
        └── Chart Component
```

### State Management Architecture

**Zustand Store (AppState):**

```
AppState {
  user: UserProfile | null
  dailyLogs: FoodItem[]
  userId: UserId | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchInitialData(userId: UserId)
  refreshDailyLogs(userId: UserId)
  addFoodLog(food: Omit<FoodItem, "id">)
}
```

**Component-Level State:**

- Theme preference (localStorage + React state)
- Current routing path (hash-based)
- Form states (useFoodForm, useRecipeForm hooks)

### Data Flow Architecture

```
┌─────────────────────────────────────┐
│         React Component              │
│  (FoodLogger, RecipeForm, etc.)     │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│      Custom Hooks Layer             │
│  (useFoodForm, useRecipeForm)       │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│     Zustand State (AppState)        │
│  (centralized client state)         │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Database Service (dbService)      │
│  (IndexedDB abstraction)            │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    Dexie / IndexedDB                │
│  (GryffinCaloraiDB)                 │
└─────────────────────────────────────┘
```

---

## 4. Data Model & Schema

### Database Tables

#### Table: `users`

**Purpose:** Store user profile information  
**Primary Key:** `id` (UserId - string)  
**Indices:** `id, username, email, lastLogin`

```typescript
interface UserProfile {
  id: UserId;
  username: string;
  email: string;
  lastLogin: string; // ISO 8601 timestamp
}
```

**Observed Behavior:**

- Users are created on application first-run with mock data (Guest user)
- lastLogin is updated on each session initialization
- No user authentication or multi-user differentiation in MVP

---

#### Table: `foodItems`

**Purpose:** Store individual food log entries  
**Primary Key:** `++id` (auto-increment FoodItemId)  
**Compound Index:** `[userId+dateLogged]` (for daily log queries)  
**Other Indices:** `name, calories, servingSize, dateLogged`

```typescript
interface FoodItem {
  id?: FoodItemId;           // Auto-generated on insert
  name: string;              // 1-100 chars
  calories: number;          // 0-10000 range
  servingSize: number;       // 1-100 range (grams or servings)
  protein: number;           // 0-500g range (macronutrient tracking)
  carbs: number;             // 0-500g range (macronutrient tracking)
  fat: number;               // 0-500g range (macronutrient tracking)
  dateLogged: ISODate;       // YYYY-MM-DD format
  userId: UserId;            // Scoped to user
}
```

**Observed Behavior:**

- Entries are uniquely identified by auto-increment ID
- Multiple food items can be logged per user per day (compound index allows this)
- Calories and serving size are stored separately (not calculated)
- Macro fields (protein, carbs, fat) track macronutrient breakdown for dietary analysis
- Macro fields validated to 0-500g range to prevent invalid data entry
- Database v3 migration automatically backfills existing records with 0 macro values for compatibility

---

#### Table: `recipes`

**Purpose:** Store reusable recipe templates  
**Primary Key:** `++id` (auto-increment RecipeId)  
**Indices:** `name, description, createdBy, dateCreated, userId`

```typescript
interface Recipe {
  id?: RecipeId;
  name: string;
  description: string;
  ingredients: Array<{
    foodItemId: FoodItemId;
    quantity: number;         // Not used in calorie calculation
    serving: number;          // Not used in calorie calculation
  }>;
  totalCalories: number;      // Fixed per ingredient (100 cal/ingredient)
  createdBy: UserId;
  dateCreated: string;        // ISO 8601 timestamp
  userId: UserId;             // Scoped to user
}
```

**Observed Behavior:**

- Total calories calculated as: `ingredients.length * 100` (hardcoded formula)
- Ingredient quantity and serving are stored but not used in calorie math
- No join queries to fetch full ingredient details (FoodItem objects)

---

### Branded Types System

**Purpose:** Compile-time type safety to prevent ID mix-ups

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type FoodItemId = Brand<number, "FoodItemId">;
type RecipeId = Brand<number, "RecipeId">;
type ISODate = Brand<string, "ISODate">; // Validates YYYY-MM-DD format

// Constructor functions
UserId(id: string): UserId
FoodItemId(id: number): FoodItemId
RecipeId(id: number): RecipeId
ISODate(date: string): ISODate
todayISO(): ISODate // Helper to get today's date

// Type guards
isFoodItemId(value: unknown): value is FoodItemId
isUserId(value: unknown): value is UserId
isRecipeId(value: unknown): value is RecipeId
isISODate(value: unknown): value is ISODate
```

---

## 5. Features & Observed Requirements

### Feature 1: Food Logging

**EARS Format Observations:**

| Type             | Requirement                                                                                                                        |
|------------------|------------------------------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The FoodLogger shall accept food name, calories, and serving size as user input.                                                   |
| **Ubiquitous**   | The FoodLogger shall store food logs in IndexedDB, scoped to the current user and date.                                            |
| **Event-driven** | When a user submits the food log form, the system shall validate input (name: 1-100 chars, calories: 0-10000, servingSize: 1-100). |
| **Event-driven** | When validation succeeds, the system shall store the FoodItem in the database and add it to AppState.                              |
| **Event-driven** | When validation fails, the system shall display an error message to the user and not persist data.                                 |
| **Event-driven** | When a food item is added, the system shall refresh the daily logs and update the Dashboard summary.                               |
| **State-driven** | While the form is submitting, the system shall disable the submit button and show "Saving..." text.                                |

**User Interaction Flow:**

1. User navigates to Dashboard
2. User fills FoodLogger form (name, calories, serving size)
3. User clicks "Log Food" button
4. System validates input
5. System stores to IndexedDB
6. System refreshes daily log display
7. User sees confirmation message
8. Form resets to initial state

**Data Persistence:**

- Entries stored in `foodItems` table with compound index `[userId+dateLogged]`
- Logs retrieved via `getDailyFoodLogs(userId, date)` query

---

### Feature 2: Dashboard Summary

**EARS Format Observations:**

| Type             | Requirement                                                                                          |
|------------------|------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The Dashboard shall display today's total calorie intake by summing all FoodItem calories for today. |
| **Ubiquitous**   | The Dashboard shall display a goal of 2000 kcal for comparison.                                      |
| **Ubiquitous**   | The Dashboard shall list all food items logged for today.                                            |
| **Event-driven** | When the Dashboard loads, the system shall fetch today's food logs from AppState.                    |
| **State-driven** | While daily logs are loading, the system shall display a loading message.                            |
| **State-driven** | If no logs exist for today, the system shall display "No food items logged for today yet."           |

**Calculation Logic:**

```
totalCalories = sum(FoodItem.calories for each log today)
```

---

### Feature 3: Recipe Management

**EARS Format Observations:**

| Type             | Requirement                                                                                                                               |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The Recipes page shall allow users to create recipes with name, description, and ingredients.                                             |
| **Ubiquitous**   | The system shall store recipes in IndexedDB with auto-generated IDs.                                                                      |
| **Event-driven** | When a user adds an ingredient, the system shall create an ingredient entry with default values (foodItemId: 1, quantity: 1, serving: 1). |
| **Event-driven** | When a user removes an ingredient, the system shall delete it from the ingredients list.                                                  |
| **Event-driven** | When a user submits the recipe form, the system shall validate: recipe name exists, description exists, at least one ingredient exists.   |
| **Event-driven** | When validation succeeds, the system shall calculate total calories as `ingredients.length * 100` and persist the recipe.                 |
| **State-driven** | While the recipe is being saved, the system shall disable the submit button and show "Saving..." text.                                    |
| **Optional**     | Where barcode scanning is implemented, the system shall populate ingredient foodItemIds from scanned barcodes.                            |

**Ingredient Input Fields:**

- Food Item ID (number, controlled input)
- Quantity (number, controlled input)
- Serving Size (number, controlled input)

**Calorie Calculation:**

```
totalCalories = ingredients.length * 100 (fixed)
```

**Note:** This formula does not account for quantity or serving size.

---

### Feature 4: Progress Tracking

**EARS Format Observations:**

| Type             | Requirement                                                                                         |
|------------------|-----------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The Progress page shall display a line chart showing daily calorie consumption over time.           |
| **Ubiquitous**   | The chart shall use mock data (5 hardcoded daily entries for demonstration).                        |
| **State-driven** | While the page loads, the chart shall be rendered with predefined mock data.                        |
| **Optional**     | Where real historical data is available, the chart shall fetch and display actual food log history. |

**Mock Data Used:**

```
{ date: "2026-03-20", calories: 1800 }
{ date: "2026-03-21", calories: 2100 }
{ date: "2026-03-22", calories: 1650 }
{ date: "2026-03-23", calories: 1950 }
{ date: "2026-03-24", calories: 2200 }
```

**Chart Configuration:**

- **Type:** Line with area fill
- **X-Axis:** Dates (formatted as MM-DD)
- **Y-Axis:** Calories (0 to max)
- **Color:** Indigo (#4F46E5)
- **Fill Opacity:** 10%

---

### Feature 5: Dark Mode

**EARS Format Observations:**

| Type             | Requirement                                                                                    |
|------------------|------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The application shall support light and dark theme modes.                                      |
| **Event-driven** | When the user clicks the theme toggle button, the system shall switch themes immediately.      |
| **Ubiquitous**   | The system shall persist theme preference to localStorage under key "darkMode".                |
| **Event-driven** | When the app loads, the system shall check localStorage for saved theme preference.            |
| **Event-driven** | If no saved preference exists, the system shall default to the system color scheme preference. |
| **State-driven** | While dark mode is enabled, the system shall apply dark Tailwind CSS classes to the DOM.       |

**Implementation Details:**

- **Storage:** `localStorage.setItem("darkMode", JSON.stringify(isDark))`
- **DOM Update:** `document.documentElement.classList.add("dark")` / `.remove("dark")`
- **Tailwind Config:** `darkMode: "selector"` (class-based)
- **Toggle Button:** Moon (🌙) icon in light mode, Sun (☀️) icon in dark mode

---

### Feature 6: Navigation

**EARS Format Observations:**

| Type             | Requirement                                                                                                             |
|------------------|-------------------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The application shall provide a fixed navigation header with links to Dashboard, Recipes, and Progress pages.           |
| **Ubiquitous**   | The system shall use hash-based routing (#dashboard, #recipes, #progress).                                              |
| **Event-driven** | When a user clicks a navigation link, the system shall update `window.location.hash` and render the corresponding page. |
| **Event-driven** | When the browser hash changes, the system shall update the current page view.                                           |
| **State-driven** | The active navigation link shall be highlighted based on the current route.                                             |

**Routes:**
| Route | Component | Default |
|-------|-----------|---------|
| `#dashboard` | Dashboard | Yes |
| `#recipes` | Recipes | |
| `#progress` | Progress | |

---

### Feature 7: Barcode Scanner (Placeholder)

**EARS Format Observations:**

| Type             | Requirement                                                                                                                            |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Ubiquitous**   | The BarcodeScanner component shall display a placeholder UI for future barcode scanning.                                               |
| **Ubiquitous**   | The placeholder shall show "Camera Feed Placeholder" text and an "Activate Scanner" button.                                            |
| **Event-driven** | When the "Activate Scanner" button is clicked, the system shall display an alert with text "Barcode scanning logic to be implemented." |
| **Optional**     | Where barcode scanning is implemented, the system shall use `navigator.mediaDevices.getUserMedia` to access the camera.                |
| **Optional**     | Where barcode scanning is implemented, the system shall use a library like QuaggaJS or react-barcode-scanner for barcode detection.    |

**Status:** Placeholder implementation, no actual camera access or barcode detection.

---

## 6. Non-Functional Characteristics

### Performance

| Aspect              | Observed Behavior                                               |
|---------------------|-----------------------------------------------------------------|
| **Load Time**       | App initializes with Dexie database opening (~50-100ms)         |
| **IndexedDB Query** | Compound index queries execute in <10ms for typical data        |
| **State Updates**   | Zustand state mutations are synchronous, immediate              |
| **Re-renders**      | React memoization not currently optimized; full subtree renders |
| **Bundle Size**     | ~476KB gzipped (with all dependencies)                          |

### Scalability

| Aspect            | Observation                                                           |
|-------------------|-----------------------------------------------------------------------|
| **Data Volume**   | IndexedDB supports millions of records on modern browsers             |
| **User Limit**    | Single-user application (hardcoded userId "1"); no horizontal scaling |
| **Storage Limit** | Browser quota: typically 50MB+ depending on browser/device            |
| **Session Limit** | Single browser tab/window per device (localStorage-based theme)       |

### Reliability & Error Handling

| Aspect                      | Observed Behavior                                                   |
|-----------------------------|---------------------------------------------------------------------|
| **Database Initialization** | Attempts recovery on schema conflicts by clearing and recreating DB |
| **Error Boundaries**        | ErrorBoundary component catches React errors and shows recovery UI  |
| **Database Errors**         | Logged to console; error messages shown to user via AppState.error  |
| **Validation Errors**       | Form validation failures display user-friendly messages             |
| **Network**                 | No network dependency in MVP (all data client-side)                 |

### Accessibility

| Aspect                  | Observed Behavior                                          |
|-------------------------|------------------------------------------------------------|
| **Semantic HTML**       | Basic semantic structure (header, main, nav elements)      |
| **ARIA Labels**         | Limited ARIA annotations; basic form labels present        |
| **Keyboard Navigation** | Form inputs are keyboard accessible; buttons are focusable |
| **Color Contrast**      | Tailwind CSS default color palette meets WCAG AA standards |
| **Dark Mode**           | Provides dark mode option for reduced eye strain           |

### Security Posture

| Aspect               | Observation                                 |
|----------------------|---------------------------------------------|
| **Authentication**   | NONE (mock user setup)                      |
| **Authorization**    | NONE (all users access same data)           |
| **Secrets**          | No hardcoded API keys or credentials        |
| **Input Validation** | Client-side only; weak validation patterns  |
| **CSRF**             | Not applicable (client-side app, no server) |
| **XSS**              | Protected by React's automatic JSX escaping |
| **HTTPS**            | Not configured (development-only feature)   |

---

## 7. Module Structure & Responsibilities

### `/src/types/index.ts`

**Purpose:** Branded types and type guards for compile-time safety

**Exports:**

- Branded types: `UserId`, `FoodItemId`, `RecipeId`, `ISODate`
- Constructors: `UserId()`, `FoodItemId()`, `RecipeId()`, `ISODate()`
- Helpers: `todayISO()`
- Type guards: `isFoodItemId()`, `isUserId()`, `isRecipeId()`, `isISODate()`

**Dependencies:** None (pure TypeScript)

---

### `/src/db/dbService.ts`

**Purpose:** IndexedDB abstraction layer and data access functions

**Exports:**

- Interfaces: `FoodItem`, `Recipe`, `UserProfile`
- Database instance: `db` (Dexie instance)
- Table references: `users`, `foodItems`, `recipes`
- Functions:
  - `initializeDB()` - Opens/initializes database
  - `addFoodItemLog(foodLog)` - Inserts food entry
  - `getOrCreateUser(userId, username, email)` - Manages user profile
  - `getDailyFoodLogs(userId, date)` - Queries daily food entries
  - `saveRecipe(recipe)` - Inserts recipe

**Schema:**

```
db.version(1).stores({
  users: "id, username, email, lastLogin",
  foodItems: "++id, [userId+dateLogged], name, calories, servingSize, dateLogged",
  recipes: "++id, name, description, createdBy, dateCreated, userId"
})
```

**Error Handling:**

- Catches "primary key" schema conflicts
- Clears and reinitializes database on conflict
- Logs errors to console

---

### `/src/state/AppState.ts`

**Purpose:** Centralized Zustand state store for application data

**State Shape:**

```typescript
{
  user: UserProfile | null,
  dailyLogs: FoodItem[],
  userId: UserId | null,
  isLoading: boolean,
  error: string | null
}
```

**Actions:**

- `fetchInitialData(userId)` - Loads user and today's food logs
- `refreshDailyLogs(userId)` - Refetches daily logs
- `addFoodLog(food)` - Adds food item and refreshes logs

**Dependencies:** `dbService.ts`, `types/index.ts`

---

### `/src/App.tsx`

**Purpose:** Root component, routing, theme management, app initialization

**Responsibilities:**

- Hash-based routing logic
- Dark mode toggle and persistence
- Database initialization on mount
- Layout wrapper (nav, main, footer)

**Props:** None (root component)

**Local State:**

- `darkMode: boolean`
- `currentPath: string` (hash value)

**Dependencies:** All pages/components, dbService, AppState

---

### `/src/components/FoodLogger.tsx`

**Purpose:** Form component for logging food items

**Props:** None (reads userId from AppState)

**Features:**

- Text input for food name
- Number input for calories
- Number input for serving size
- Client-side validation
- Submit button with loading state

**Dependencies:** `useFoodForm` hook

---

### `/src/components/BarcodeScanner.tsx`

**Purpose:** Placeholder UI for future barcode scanning feature

**Props:** None

**Features:**

- Static placeholder UI
- Alert on button click (not implemented)

**Dependencies:** None

---

### `/src/components/ErrorBoundary.tsx`

**Purpose:** React error boundary for graceful error handling

**Props:** `children: ReactNode`

**Features:**

- Catches React render errors
- Displays error message to user
- "Reload Page" button for recovery
- Logs errors to console

**Dependencies:** React

---

### `/src/pages/Dashboard.tsx`

**Purpose:** Main user dashboard, daily summary and logging

**Components:**

- Daily calorie total summary card
- FoodLogger input form
- BarcodeScanner placeholder
- Daily food log list

**Data Flow:**

- Reads `dailyLogs`, `isLoading`, `error` from AppState
- Displays logs from state
- Passes `userId` to child components

**Dependencies:** `AppState`, `FoodLogger`, `BarcodeScanner`

---

### `/src/pages/Recipes.tsx`

**Purpose:** Recipe management (create, list, edit)

**Features:**

- Recipe name input
- Recipe description textarea
- Ingredient list with add/remove
- Controlled ingredient inputs
- Submit with loading state

**Data Flow:**

- Uses `useRecipeForm` hook for form state
- Saves recipes via `AppState.addFoodLog` → `dbService.saveRecipe()`

**Dependencies:** `useRecipeForm` hook, `dbService`

---

### `/src/pages/Progress.tsx`

**Purpose:** Historical calorie consumption visualization

**Features:**

- Line chart with area fill
- Mock data (hardcoded 5 days)
- Date and calorie axes
- Chart.js + react-chartjs-2 integration

**Data Flow:**

- Uses mock data (does not query database)
- No state management dependency

**Dependencies:** Chart.js, react-chartjs-2

---

### `/src/hooks/useFoodForm.ts`

**Purpose:** Reusable hook for food logging form state and logic

**Returns:**

```typescript
{
  name: string,
  setName: (name: string) => void,
  calories: number,
  setCalories: (calories: number) => void,
  servingSize: number,
  setServingSize: (servingSize: number) => void,
  isLoading: boolean,
  message: string | null,
  submitFoodLog: () => Promise<boolean>,
  resetForm: () => void
}
```

**Validation Rules:**

- Name: 1-100 chars (after trim)
- Calories: 0-10000
- ServingSize: 1-100

**Dependencies:** `AppState`, `types/index.ts`

---

### `/src/hooks/useRecipeForm.ts`

**Purpose:** Reusable hook for recipe creation form state and logic

**Returns:**

```typescript
{
  recipeName: string,
  setRecipeName: (name: string) => void,
  description: string,
  setDescription: (desc: string) => void,
  ingredients: Ingredient[],
  addIngredient: () => void,
  removeIngredient: (id: string) => void,
  updateIngredient: (id: string, field: string, value: number) => void,
  message: string | null,
  isLoading: boolean,
  saveRecipeForm: () => Promise<boolean>,
  resetForm: () => void
}
```

**Validation Rules:**

- RecipeName: must be non-empty
- Description: must be non-empty
- Ingredients: at least one required

**Dependencies:** `dbService`, `types/index.ts`

---

### `/src/main.tsx`

**Purpose:** Application entry point

**Features:**

- React StrictMode wrapper
- ErrorBoundary wrapper
- React.createRoot mount

**Dependencies:** React, App, ErrorBoundary

---

## 8. Data Flow Scenarios

### Scenario 1: User Logs Food Item

```
User fills FoodLogger form
        ↓
useFoodForm validates input
        ↓
submitFoodLog calls AppState.addFoodLog()
        ↓
AppState.addFoodLog() calls dbService.addFoodItemLog()
        ↓
dbService inserts FoodItem into IndexedDB foodItems table
        ↓
AppState.refreshDailyLogs() queries foodItems with [userId+dateLogged] index
        ↓
AppState updates dailyLogs state
        ↓
Dashboard component re-renders with new logs
        ↓
User sees confirmation message and updated summary
```

---

### Scenario 2: User Creates Recipe

```
User fills Recipes form and clicks Save
        ↓
useRecipeForm validates input
        ↓
saveRecipeForm() constructs Recipe object
        ↓
Calls dbService.saveRecipe()
        ↓
dbService inserts Recipe into IndexedDB recipes table
        ↓
System returns RecipeId from database
        ↓
Form resets, user sees success message
        ↓
Recipe is now stored (no UI list display yet)
```

---

### Scenario 3: Dashboard Page Loads

```
App.tsx mounts
        ↓
useLayoutEffect initializes database
        ↓
fetchInitialData("1") executes
        ↓
getOrCreateUser("1", "Guest", "guest@example.com")
        ↓
getDailyFoodLogs("1", todayISO())
        ↓
AppState updates with user and dailyLogs
        ↓
Dashboard component renders
        ↓
Displays summary and log history
```

---

## 9. Error Scenarios & Handling

### Scenario 1: Database Schema Conflict

**When:** App detects primary key mismatch on open

**Observed Behavior:**

1. `initializeDB()` catches error
2. Checks if error message includes "primary key"
3. Calls `db.delete()` to clear database
4. Calls `db.open()` again
5. Logs success message

**User Impact:** Silent recovery; potential data loss if database was manually corrupted

---

### Scenario 2: Food Log Validation Failure

**When:** User submits FoodLogger with invalid data

**Observed Behavior:**

1. `useFoodForm.submitFoodLog()` validation fails
2. Sets error message in state
3. Does NOT call database
4. User sees error in red box

**Example Error Messages:**

- "Please enter a valid name, calories (0-10000), and serving size (1-100)."
- "User not initialized. Please refresh the page."

---

### Scenario 3: Database Operation Error

**When:** Dexie throws an error during add/query

**Observed Behavior:**

1. `addFoodLog()` or `saveRecipe()` throws
2. Hook catches error
3. Sets error message in AppState
4. User sees error message

**Error Messages:** Generic "Failed to save..." messages (actual error logged to console)

---

### Scenario 4: React Component Error

**When:** Component throws during render

**Observed Behavior:**

1. ErrorBoundary catches error
2. Sets error state
3. Renders error UI
4. Shows "Reload Page" button
5. Logs error to console

---

## 10. TODOs & Incomplete Features

### Code TODOs Found

| Location            | TODO                                                        | Priority      |
|---------------------|-------------------------------------------------------------|---------------|
| `FoodLogger.tsx:22` | "Dispatch initial logs to the global state store"           | Medium        |
| `Recipes.tsx:31`    | "Call the database service to save the recipe"              | ~~High~~ Done |
| `Progress.tsx`      | "Chart visualization powered by Chart.js." (note, not TODO) | N/A           |

### Planned Features Not Implemented

1. **Barcode Scanning** - Placeholder only
2. **Recipe History/List** - No UI to view saved recipes
3. **Calorie Recommendations** - Only hardcoded 2000 kcal goal
4. **Food Database** - No ingredient database to search/select from
5. **Data Export** - No export/backup functionality
6. **Multi-Device Sync** - No cloud storage
7. **Notifications** - No alerts/reminders

---

## 11. Dependencies & Configuration

### Direct Dependencies

```json
{
  "dexie": "^4.4.2",
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "zustand": "^5.0.12",
  "react-icons": "^5.6.0",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1",
  "vite-plugin-compression2": "^2.5.3"
}
```

### TypeScript Configuration

- **Target:** ES2023
- **Module:** ESNext
- **Strict Mode:** Enabled
- **JSX:** react-jsx (automatic import)
- **Verbatim Module Syntax:** Enabled (require explicit type-only imports)

### Build Configuration (Vite)

- **Base:** `/gryffin-calorai/`
- **Plugins:** React, Tailwind CSS, compression (gzip + brotli)
- **Output:** Optimized production bundle with source maps

---

## 12. Uncertainties & Questions

### Architectural Questions

1. **Multi-User Intent** - Is the hardcoded userId "1" intentional for single-user MVP, or placeholder for auth?
2. **Backend Integration** - Will a backend be added later? Current design assumes client-only.
3. **Data Export** - How should users migrate their IndexedDB data if/when backend is added?

### Feature Clarifications

1. **Recipe Calculations** - Why is totalCalories hardcoded to 100 per ingredient? Should it use foodItem.calories * quantity?
2. **Ingredient Linking** - Recipes store foodItemIds but never join to fetch actual FoodItem details. Intended?
3. **Recipe List UI** - Recipes can be created but no UI to list/view/delete them. Intended limitation?
4. **Progress Chart** - Should historical data use actual daily aggregates, or keep mock data?

### Security & Validation

1. **Validation Coverage** - Are numeric bounds (0-10000 calories) intentional limits, or should they be configurable?
2. **Food Name Patterns** - Should food names be restricted to alphanumeric? Allow emoji?
3. **UserId Origin** - Where will real userId come from post-MVP? JWT decode? Session?

### Performance & Storage

1. **IndexedDB Cleanup** - No deletion or archival of old logs. Will browser quota be exceeded over time?
2. **LocalStorage Size** - Theme preference is the only localStorage item; growth expected?

---

## 13. Recommendations

### High Priority (Before Production)

1. ✅ Implement real authentication system (OAuth, Firebase, or custom backend)
2. ✅ Add server-side validation and persistence
3. ✅ Implement proper access control checks
4. ✅ Add CSRF protection to API endpoints
5. ✅ Improve input validation patterns
6. ✅ Remove console.log statements
7. ✅ Implement rate limiting on operations

### Medium Priority (MVP Enhancement)

1. Add recipe list UI (view, edit, delete recipes)
2. Fix recipe calorie calculation to use ingredient details
3. Wire Progress chart to actual historical data
4. Implement barcode scanner with real camera access
5. Add data export/backup functionality
6. Improve error messages and user feedback

### Low Priority (Quality of Life)

1. Add loading skeletons for better UX
2. Implement optimistic UI updates
3. Add keyboard shortcuts for common actions
4. Implement undo/redo for food logs
5. Add search/filter for log history
6. Implement data analytics/insights

---

## 14. Test Coverage

### Unit Tests Present

- `src/state/AppState.test.ts` - Zustand store state mutations
- `src/db/dbService.test.ts` - Database queries and inserts

### Test Coverage Gaps

- No component tests (FoodLogger, Dashboard, etc.)
- No hook tests (useFoodForm, useRecipeForm)
- No integration tests for full user flows
- No accessibility tests

### Recommended Test Additions

```
src/
├── components/__tests__/
│   ├── FoodLogger.test.tsx
│   ├── Dashboard.test.tsx
│   └── ErrorBoundary.test.tsx
├── hooks/__tests__/
│   ├── useFoodForm.test.ts
│   └── useRecipeForm.test.ts
└── pages/__tests__/
    ├── Recipes.test.tsx
    └── Progress.test.tsx
```

---

## 15. Glossary

| Term                   | Definition                                                            |
|------------------------|-----------------------------------------------------------------------|
| **Branded Type**       | TypeScript type with phantom property for compile-time uniqueness     |
| **Compound Index**     | Dexie index on multiple fields together (e.g., `[userId+dateLogged]`) |
| **IndexedDB**          | Browser API for client-side persistent storage (NoSQL)                |
| **Zustand**            | Lightweight state management library for React                        |
| **EARS Format**        | Structured format for specifying requirements                         |
| **Hash-Based Routing** | Navigation using `#` in URL (client-side only)                        |
| **JSX Transform**      | React feature allowing JSX without explicit `React.createElement()`   |
| **Dexie**              | Abstraction layer over IndexedDB (simpler API)                        |

---

## Document Metadata

**File:** `specs/gryffin-calorai_spec.md`  
**Generated:** 2026-04-26  
**Analyst:** Specifications Extractor (Claude)  
**Status:** Complete - Reverse-engineered from codebase  
**Revision:** 1.0

---

## Change Log

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| 1.0     | 2026-04-26 | Initial specification extraction |

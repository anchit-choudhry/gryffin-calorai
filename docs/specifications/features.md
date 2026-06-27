# Gryffin Calorai: Feature Requirements, API, and Non-Functional Requirements

EARS-format feature requirements (Features 1-13), non-functional requirements,
user flows, API and query reference, build/deployment, known limitations, and open
questions.

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

**OBS-GOAL-005 - Dynamic TDEE source**
When a `tdeeProfile` exists, `calorieGoal` is derived from `calculateTDEE(profile).calorieGoal`
and stored on `UserProfile`. Dashboard falls back to `user.calorieGoal = 2000` if no profile set.

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
string is not yet used to fetch nutritional data. Planned for v0.4 (Open Food Facts API).

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
`fuzzyMatchFoodName(query, corpus, limit=3)` against `allFoodItems` and `favoriteFoods`.

**OBS-VOICE-004 - Pre-fill dialog**
When a match is found, the system shall open a shadcn/ui `<Dialog>` with a `<FoodLogger>`
pre-filled with the matched name.

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
measurements via `cmToIn()` when the user selects "in". Values converted back to metric before DB
write. Unit preference is local form state.

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
`computeStreaks(uniqueDates)` shall walk back from today (or yesterday if today has no log) to find
`currentStreak`; scan all sorted dates for the longest consecutive daily run (`longestStreak`).

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
On app load, dark mode state is initialized from `localStorage.getItem("darkMode")` via
`JSON.parse` with try/catch fallback to `window.matchMedia("(prefers-color-scheme: dark)").matches`.

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
`<Progress>`, `#/settings` renders `<Settings>`. Any unknown hash defaults to `#dashboard`.

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
`StepSchema` validates `steps` as an integer in range [1, 100000].

**OBS-STEP-003 - Quick-add presets**
The StepTracker shall provide quick-add buttons for predefined amounts (2000, 5000, 8000, 10000
steps) via `submitStepLog(stepsOverride)` without requiring form submission.

**OBS-STEP-004 - Custom amount**
The StepTracker shall provide a "Custom" toggle that reveals a numeric input field.

**OBS-STEP-005 - Daily goal**
The StepTracker shall display today's total steps against `stepGoal` from the Zustand store
(default `DAILY_STEP_GOAL = 10000`; user-configurable).

**OBS-STEP-006 - Goal editing**
The StepTracker shall allow inline editing of `stepGoal` (range [1000, 100000]) via `setStepGoal`;
persisted to `localStorage("stepGoal")`.

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
The system shall maintain a catalog of 19 achievements across 6 categories in
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
The Achievements section on the Progress page (Section 07) shall display all 19 achievements in a
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

### Feature 17: Product Tour (v0.2.0)

**Evidence:** `src/components/tour/ProductTourOverlay.tsx`, `src/components/tour/CoachmarkCard.tsx`,
`src/components/tour/tourSteps.ts`, `src/hooks/useSpotlightRect.ts`,
`src/state/AppState.ts` (tour slice)

**OBS-TOUR-001 - Steps**
The system shall maintain an 8-step guided tour in `tourSteps.ts`. Each step targets a DOM element
by selector, has a title and body copy, and specifies coachmark placement (top/bottom/left/right).

**OBS-TOUR-002 - Spotlight**
`useSpotlightRect` shall read the bounding rect of the current step's target element via
`getBoundingClientRect()` and return it as state, re-computing on window resize.

**OBS-TOUR-003 - Persistence**
When the user completes or skips the tour, the system shall persist a flag to `localStorage`
(key: `tourCompleted` or `tourSkipped`) so the tour does not re-appear on next visit.

**OBS-TOUR-004 - Tour state**
Tour state (`tourActive`, `tourStep`, `tourTotalSteps`) lives in the Zustand store. Actions:
`startTour`, `nextTourStep`, `prevTourStep`, `endTour`, `skipTour`.

**OBS-TOUR-005 - Scroll into view**
Before rendering each step's spotlight, the system shall scroll the target element into view if it
is outside the current viewport.

---

### Feature 18: Keyboard Shortcuts (v0.2.0)

**Evidence:** `src/hooks/useKeyboardShortcuts.ts`,
`src/components/KeyboardShortcutsOverlay.tsx`

**OBS-KBD-001 - Registry**
`useKeyboardShortcuts` shall maintain a command registry mapping key combinations to actions
(e.g., `?` -> toggle shortcuts help, `t` -> start tour, `d`/`r`/`p` -> navigate pages).

**OBS-KBD-002 - Overlay**
When the user presses `?`, the system shall toggle `KeyboardShortcutsOverlay`, which displays all
registered commands in a shadcn/ui `<Dialog>`.

**OBS-KBD-003 - Scope guard**
Keyboard shortcuts shall be disabled when focus is inside an input, textarea, or select element
to avoid interfering with form entry.

---

### Feature 19: Activity Logging (v0.3.0)

**Evidence:** `src/components/ActivityLogger.tsx`, `src/hooks/useActivityForm.ts`,
`src/lib/metTable.ts`, `src/db/dbService.ts:activityLogs`

**OBS-ACTIVITY-001 - Storage**
The system shall store activity log entries in the `activityLogs` table with `userId`,
`activityType`, `durationMin`, `caloriesBurned`, `dateLogged`, and `loggedAt`.

**OBS-ACTIVITY-002 - MET calorie formula**
`useActivityForm` shall compute
`caloriesBurned = getMET(activityType) * weightKg * (durationMin / 60)`.
`weightKg` is read from `tdeeProfile.weightKg` if available; falls back to 70 kg.

**OBS-ACTIVITY-003 - Validation**
`ActivitySchema` validates `activityType` (non-empty string) and `durationMin` (integer [1, 1440]).

**OBS-ACTIVITY-004 - Searchable dropdown**
`ActivityLogger` shall render a searchable dropdown listing all ~60 activities from `metTable.ts`.

**OBS-ACTIVITY-005 - Live calorie preview**
While the user types duration, `ActivityLogger` shall display a live calorie burn estimate computed
from the selected activity and current duration field value.

**OBS-ACTIVITY-006 - Delete with undo**
When the user deletes an activity log, the system shall display an undo toast with a short TTL
that re-inserts the entry if activated before expiry.

---

### Feature 20: Intermittent Fasting (v0.3.0)

**Evidence:** `src/components/FastingTimer.tsx`, `src/hooks/useFastingTimer.ts`,
`src/db/dbService.ts:fastingSessions`

**OBS-FASTING-001 - Storage**
The system shall store fasting sessions in the `fastingSessions` table with `userId`, `startTime`
(ISO 8601 with time), `endTime` (null while active), `targetHours`, `dateLogged`, and `completed`.

**OBS-FASTING-002 - Timer**
`useFastingTimer` shall use `setInterval` + `date-fns differenceInSeconds` to compute elapsed
seconds since `startTime`; update state every second while a fast is active.

**OBS-FASTING-003 - SVG ring**
`FastingTimer` shall render an SVG ring showing elapsed time as a proportion of `targetHours`;
the arc length is capped at 100% when the target is exceeded.

**OBS-FASTING-004 - Presets**
`FastingTimer` shall display 5 preset buttons from `FASTING_PRESETS`:
12:12, 14:10, 16:8, 18:6, OMAD (20 hours).

**OBS-FASTING-005 - Browser Notification**
When a fast reaches its `targetHours`, the system shall fire a browser `Notification`
(if permission was granted at fast start) notifying the user the target has been reached.

**OBS-FASTING-006 - Active session persistence**
The active fasting session is persisted to Dexie on start and end. On app reload,
`getActiveFastingSession` restores an in-progress fast; the timer resumes from the stored
`startTime`.

---

### Feature 21: TDEE / Goal Engine + Onboarding (v0.3.0)

**Evidence:** `src/lib/tdee.ts`, `src/components/OnboardingModal.tsx`,
`src/components/OnboardingBanner.tsx`, `src/hooks/useOnboarding.ts`,
`src/components/settings/TdeeProfilePanel.tsx`, `src/components/settings/GoalSettings.tsx`

**OBS-TDEE-001 - Formula**
`mifflinStJeorBMR(profile)` shall compute BMR using Mifflin-St Jeor:

- Male: `10 * weightKg + 6.25 * heightCm - 5 * age + 5`
- Female: `10 * weightKg + 6.25 * heightCm - 5 * age - 161`

`computeTDEE(profile)` = BMR * `ACTIVITY_LEVEL_FACTORS[activityLevel]`.
`computeCalorieGoal(profile)` = TDEE + `GOAL_OFFSETS[goal]` (-500/0/+300 kcal).

**OBS-TDEE-002 - Onboarding modal**
When `user.hasCompletedOnboarding` is false (or undefined), the system shall display
`OnboardingModal` on first launch. Modal persists a flag to `localStorage` on completion.

**OBS-TDEE-003 - Multi-step form**
`useOnboarding` shall manage 6 onboarding steps: age, sex, height, weight, activity level, goal.
`nextStep`/`prevStep`/`goToStep` navigate between them. Unit toggles (kg/lb, cm/in) auto-convert
entered values when switched.

**OBS-TDEE-004 - Onboarding banner**
`OnboardingBanner` shall display a persistent prompt when `tdeeProfile` is null in AppState,
directing the user to complete setup.

**OBS-TDEE-005 - Settings panel**
`TdeeProfilePanel` (in Settings > Profile) shall show a live preview of computed BMR, TDEE, and
daily calorie goal that updates as the user edits any field.

**OBS-TDEE-006 - Goals settings**
`GoalSettings` (in Settings > Goals) shall provide inline Save/Cancel edit for `waterGoalMl` and
`stepGoal`, each field independently editable.

---

### Feature 22: Data Export / Import (v0.3.0)

**Evidence:** `src/components/DataExportPanel.tsx`, `src/hooks/useDataExport.ts`,
`src/hooks/useDataImport.ts`, `src/forms/schemas.ts:BackupSchema`

**OBS-EXPORT-001 - JSON backup**
`downloadJSON` shall serialize all Dexie tables to a versioned JSON object (`BACKUP_VERSION = 1`)
and trigger a Blob URL download with filename `gryffin-backup-YYYY-MM-DDTHH:mm:ss.json`.

**OBS-EXPORT-002 - CSV ZIP**
`downloadCSVZip` shall use `fflate zipSync` to produce a ZIP file containing:
`foodItems.csv`, `waterLogs.csv`, `stepLogs.csv`, `bodyMeasurements.csv`,
`activityLogs.csv`, `fastingSessions.csv`.
Filename: `gryffin-csv-YYYY-MM-DD.zip`.

**OBS-EXPORT-003 - Shared loading state**
`useDataExport` shall expose a shared `isExporting` boolean covering both `downloadJSON` and
`downloadCSVZip` to prevent concurrent exports.

**OBS-IMPORT-001 - File picker**
`useDataImport` shall use a hidden `<input type="file">` to accept a `.json` file.

**OBS-IMPORT-002 - Schema validation**
The parsed JSON shall be validated against `BackupSchema` (zod); invalid or wrong-version files
shall display an error toast and abort.

**OBS-IMPORT-003 - Confirmation flow**
Before writing to Dexie, `useDataImport` shall set `pendingPayload` and show a confirmation
dialog summarizing what will be merged.

**OBS-IMPORT-004 - Upsert semantics**
`importData(payload)` shall upsert all tables (last-write-wins conflict resolution) and return
an `ImportResult` with row counts per table.

---

### Feature 23: Settings Page (v0.3.0)

**Evidence:** `src/pages/Settings.tsx`, `src/components/settings/TdeeProfilePanel.tsx`,
`src/components/settings/GoalSettings.tsx`

**OBS-SETTINGS-001 - Hash navigation**
The Settings page is accessible via hash `#/settings`; sub-sections use a secondary hash-based
tab bar within the page (Profile / Goals / Data / About).

**OBS-SETTINGS-002 - Lazy loading**
`TdeeProfilePanel` is lazy-loaded within Settings to keep the initial settings bundle lean.

**OBS-SETTINGS-003 - Version display**
The About section shall display the current app version (`0.3.0`) and a link to the GitHub
repository.

---

## 6. Non-Functional Requirements

### Security

**Evidence:** `vite.config.ts`, `public/_headers`, `src/db/dbService.ts`

#### HTTP Security Headers

| Layer          | Where applied                                                               |
|----------------|-----------------------------------------------------------------------------|
| Dev server     | `vite.config.ts` `server.headers` - CSP excluded (blocks Vite Fast Refresh) |
| Preview server | `vite.config.ts` `preview.headers` - full header set applied                |
| Static hosting | `public/_headers` (Cloudflare Pages / Netlify)                              |
| index.html     | `<meta http-equiv="Content-Security-Policy">` - stripped in dev             |

**Full header set (v0.3.0):**

| Header                         | Value                                                                                                                                                                                                              |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Content-Security-Policy`      | default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' |
| `X-Frame-Options`              | `DENY`                                                                                                                                                                                                             |
| `X-Content-Type-Options`       | `nosniff`                                                                                                                                                                                                          |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                                                                                                                                                                                  |
| `Permissions-Policy`           | `camera=(self), microphone=(self), geolocation=()`                                                                                                                                                                 |
| `Strict-Transport-Security`    | `max-age=31536000; includeSubDomains; preload`                                                                                                                                                                     |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                                                                                                                                                                                      |
| `Cross-Origin-Embedder-Policy` | `require-corp`                                                                                                                                                                                                     |
| `Cross-Origin-Resource-Policy` | `same-origin`                                                                                                                                                                                                      |

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
| Backup import validated against `BackupSchema` (zod) before any DB write                                              | `schemas.ts`     |

**Known gaps:**

| Gap                                                                                       | Severity | Location                       |
|-------------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                        | Medium   | `useRecipeForm`, `Recipes.tsx` |
| `getRecentFoodItems` and `getAllFoodLogs` use `where("userId")` only - not compound index | Low      | `dbService.ts`                 |

### Performance

| Observation                                                                  | Evidence         |
|------------------------------------------------------------------------------|------------------|
| `getDailyFoodLogs` uses compound index `[userId+dateLogged]`                 | `dbService.ts`   |
| `getDailyWaterLogs` uses compound index `[userId+dateLogged]`                | `dbService.ts`   |
| `getDailyStepLogs` uses compound index `[userId+dateLogged]`                 | `dbService.ts`   |
| `getDailyActivityLogs` uses compound index `[userId+dateLogged]`             | `dbService.ts`   |
| `fastingSessions` queried via compound index `[userId+startTime]`            | `dbService.ts`   |
| `getAllBodyMeasurements` uses `where("userId")` index                        | `dbService.ts`   |
| Build output compressed with Gzip and Brotli                                 | `vite.config.ts` |
| 9 vendor chunks keep per-page JS payloads small                              | `vite.config.ts` |
| `@zxing` deferred until BarcodeScanner is rendered                           | `Dashboard.tsx`  |
| `TdeeProfilePanel` lazy-loaded within Settings                               | `Settings.tsx`   |
| `motion/react` `useReducedMotion` hook disables animations for accessibility | `Dashboard.tsx`  |

### Offline Capability

- All data stored in `GryffinCaloraiDB` (IndexedDB) - persists across browser restarts
- No network requests in normal operation (barcode lookup API pending)
- No service worker in v0.3.0 (planned for v0.4)

### Error Handling

| Layer                     | Pattern                                                                         |
|---------------------------|---------------------------------------------------------------------------------|
| React render              | `ErrorBoundary` class component                                                 |
| Async actions in AppState | `try/catch`; calls `mapDbError`; sets `error` state                             |
| DB helpers                | No-op on ownership mismatch; throw on actual DB errors                          |
| DB init                   | Production: throws on schema conflict. Dev: auto-recovers with delete + re-open |
| Forms                     | react-hook-form + zod; field-level `<FormMessage />` errors; sonner for toast   |
| Import validation         | `BackupSchema.safeParse` before any Dexie write; error toast on failure         |

### Testing

| Module                 | Test file                                 | Status      |
|------------------------|-------------------------------------------|-------------|
| `dbService.ts`         | `src/db/dbService.test.ts`                | Implemented |
| `activityLogs` (DB)    | `src/db/activityLogs.test.ts`             | Implemented |
| `fastingSessions` (DB) | `src/db/fastingSessions.test.ts`          | Implemented |
| `tdeeProfiles` (DB)    | `src/db/tdeeProfiles.test.ts`             | Implemented |
| `AppState.ts`          | `src/state/AppState.test.ts`              | Implemented |
| `src/types/index.ts`   | `src/types/index.test.ts`                 | Implemented |
| `src/lib/tdee.ts`      | `src/lib/tdee.test.ts`                    | Implemented |
| `src/lib/metTable.ts`  | `src/lib/metTable.test.ts`                | Implemented |
| `useActivityForm`      | `src/hooks/useActivityForm.test.ts`       | Implemented |
| `useFastingTimer`      | `src/hooks/useFastingTimer.test.ts`       | Implemented |
| `useOnboarding`        | `src/hooks/useOnboarding.test.ts`         | Implemented |
| `useDataExport`        | `src/hooks/useDataExport.test.ts`         | Implemented |
| `useDataImport`        | `src/hooks/useDataImport.test.ts`         | Implemented |
| `ActivityLogger`       | `src/components/ActivityLogger.test.tsx`  | Implemented |
| `FastingTimer`         | `src/components/FastingTimer.test.tsx`    | Implemented |
| `OnboardingModal`      | `src/components/OnboardingModal.test.tsx` | Implemented |

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

### Scenario 1: First-Time User (with Onboarding)

1. User opens application at `/#dashboard`
2. `initializeDB()` creates `GryffinCaloraiDB` at schema v13
3. `getOrCreateUser("1", "Guest", "guest@example.com")` creates user with `calorieGoal = 2000`
4. `tdeeProfile` is null -> `OnboardingModal` appears (localStorage flag not set)
5. User completes 6-step onboarding; `saveTdeeProfile` writes to `tdeeProfiles` table
6. `calorieGoal` on Dashboard now reflects TDEE-computed target

### Scenario 2: Logging Food (Manual)

1. User fills `FoodLogger` form (name, calories, macros, meal type)
2. `useFoodForm.submitFoodLog()` invokes react-hook-form `handleSubmit` -> zod validation
3. Valid: `addFoodLog(food)` -> `addFoodItemLog` -> `refreshDailyLogs` ->
   `checkAndUnlockAchievements`
4. `dailyLogs` in AppState updates; Dashboard totals recalculate via `useMemo`
5. `toast.success` shown; form resets

### Scenario 3: Starting a Fast

1. User selects "16:8" preset on `FastingTimer` widget
2. `startFasting(16)` calls `startFastingSessionInDB` with `startTime = new Date().toISOString()`
3. Browser `Notification.requestPermission()` called; stored in session
4. `setInterval` fires every second; elapsed computed via `date-fns differenceInSeconds`
5. SVG ring arc updates live; when elapsed >= 16 hours, browser Notification fires
6. User clicks "End Fast" -> `endFasting(true)` writes `endTime` and `completed: true` to Dexie

### Scenario 4: Logging an Activity

1. User searches and selects "Running" in `ActivityLogger` dropdown
2. User enters 30 minutes
3. Live preview shows `getMET("Running") * 70kg * 0.5hr = ~315 kcal`
4. `submitActivityLog` -> `addActivityLog` writes to `activityLogs`
5. Dashboard activity summary updates

### Scenario 5: Exporting Data

1. User navigates to Settings > Data
2. Clicks "Export JSON Backup"
3. `downloadJSON` calls `exportAllData` -> serializes all Dexie tables
4. Blob URL download triggers; file named `gryffin-backup-2026-05-21T...json`

### Scenario 6: Earning an Achievement

1. User logs food every day for 7 consecutive days
2. On day 7, after `addFoodLog`, `checkAndUnlockAchievements()` is called
3. `getAllFoodLogs + getAllWaterLogs + getUnlockedAchievementIds` fetched in parallel
4. `evaluateAchievements(params, alreadyUnlocked)` computes `longestStreak >= 7` as true
5. `addUserAchievement({ userId, achievementId: "streak_7", ... })` written
6. `toast.success("🔥 Achievement Unlocked: Week Warrior")`

### Scenario 7: Using the Product Tour

1. On first visit, `ProductTourOverlay` activates (localStorage flag not set)
2. Step 1 targets `DashboardHero`; spotlight animates around the element
3. User clicks "Next" repeatedly through all 8 steps
4. On last step, `endTour()` writes `tourCompleted: true` to localStorage
5. Tour does not appear on subsequent visits

---

## 8. API and Query Reference

### Zod Schemas (`src/forms/schemas.ts`)

| Schema                                | Key validations                                                                             |
|---------------------------------------|---------------------------------------------------------------------------------------------|
| `FoodFormSchema`                      | name[1-100], calories[0-10000], servingSize[1-100], protein/carbs/fat[0-500]                |
| `makeBodySchema(weightUnit, lenUnit)` | weight>0, bodyFat[1-99], waist/chest/hips>0; unit-aware max                                 |
| `RecipeFormSchema`                    | recipeName[1-100], description[1-500 printable ASCII], ingredients[>=1]                     |
| `IngredientSchema`                    | foodItemId>0, calories[0-10000], quantity/serving[1-999]                                    |
| `WaterSchema`                         | amount integer [1, 5000] ml                                                                 |
| `StepSchema`                          | steps integer [1, 100000]                                                                   |
| `TdeeProfileSchema`                   | age int [13,120], sex enum, heightDisplay>0, weightDisplay>0, activityLevel enum, goal enum |
| `ActivitySchema`                      | activityType non-empty string, durationMin int [1, 1440]                                    |
| `BackupSchema`                        | version literal 1, exportedAt string, userId string, tables: BackupTableSchema              |

### DB Service Exports (`src/db/dbService.ts`)

**Initialization:**

```typescript
initializeDB(): Promise<void>
clearDatabase(): Promise<void>  // dev only
```

**User:**

```typescript
getOrCreateUser(userId, username, email): Promise<UserProfile>
updateUserProfile(profile, requestingUserId): Promise<void>  // throws on mismatch
completeOnboarding(userId): Promise<void>
```

**Food Items:**

```typescript
addFoodItemLog(foodLog: FoodItem): Promise<FoodItemId>
getDailyFoodLogs(userId, date): Promise<FoodItem[]>
getAllFoodLogs(userId): Promise<FoodItem[]>
getRecentFoodItems(userId): Promise<FoodItem[]>  // deduped by name
getFoodItemById(id, userId): Promise<FoodItem | undefined>
deleteFoodItem(id, userId): Promise<void>
toggleFavoriteFoodItem(id, isFavorite, userId): Promise<void>
getFavoriteFoodItems(userId): Promise<FoodItem[]>
updateFoodItem(id, updates, userId): Promise<void>
```

**Recipes:**

```typescript
saveRecipe(recipe): Promise<RecipeId>
getAllRecipes(userId): Promise<Recipe[]>
deleteRecipe(id, userId): Promise<void>
updateRecipe(recipe): Promise<void>
```

**Water Logs:**

```typescript
addWaterLog(log: WaterLog): Promise<WaterLogId>
getDailyWaterLogs(userId, date): Promise<WaterLog[]>
getAllWaterLogs(userId): Promise<WaterLog[]>
deleteWaterLog(id, userId): Promise<void>
```

**Body Measurements:**

```typescript
addBodyMeasurement(m: BodyMeasurement): Promise<BodyMeasurementId>
getAllBodyMeasurements(userId): Promise<BodyMeasurement[]>  // sorted by measuredAt asc
deleteBodyMeasurement(id, userId): Promise<void>
```

**User Achievements:**

```typescript
addUserAchievement(a: UserAchievement): Promise<UserAchievementId>
getUnlockedAchievements(userId): Promise<UserAchievement[]>
getUnlockedAchievementIds(userId): Promise<Set<string>>
```

**Step Logs:**

```typescript
addStepLog(log: StepLog): Promise<StepLogId>
getDailyStepLogs(userId, date): Promise<StepLog[]>
getAllStepLogs(userId): Promise<StepLog[]>
deleteStepLog(id, userId): Promise<void>
```

**TDEE Profiles:**

```typescript
getTdeeProfile(userId): Promise<TdeeProfile | undefined>
saveTdeeProfile(profile: Omit<TdeeProfile, "id">): Promise<void>
```

**Activity Logs:**

```typescript
addActivityLog(log: ActivityLog): Promise<ActivityLogId>
getDailyActivityLogs(userId, date): Promise<ActivityLog[]>
getAllActivityLogs(userId): Promise<ActivityLog[]>
deleteActivityLog(id, userId): Promise<void>
```

**Fasting Sessions:**

```typescript
startFastingSession(session: Omit<FastingSession, "id">): Promise<FastingSessionId>
endFastingSession(id, endTime, completed): Promise<void>
getActiveFastingSession(userId): Promise<FastingSession | undefined>
getAllFastingSessions(userId): Promise<FastingSession[]>
```

**Export / Import:**

```typescript
exportAllData(userId): Promise<BackupPayload>
importBackup(payload: BackupPayload): Promise<ImportResult>
```

### Custom Hooks

**`useFoodForm(initialFood?)`** - `src/hooks/useFoodForm.ts`

```typescript
{ form, isLoading, isEditMode, submitFoodLog(): Promise<boolean>, resetForm(): void }
```

**`useRecipeForm(userId)`** - `src/hooks/useRecipeForm.ts`

```typescript
{ form, fields, append(ingredient), remove(index), isLoading, saveRecipeForm(): Promise<boolean> }
```

**`useProgressData(days: 7 | 30)`** - `src/hooks/useProgressData.ts`

```typescript
{ labels: string[], data: number[], mealTypeData: {...} | null, macroData: {...} | null, isLoading }
```

**`useWaterHistoryData(days: 7 | 30)`** - `src/hooks/useWaterHistoryData.ts`

```typescript
{ labels: string[], data: number[], isLoading: boolean }
```

**`useWaterForm()`** - `src/hooks/useWaterForm.ts`

```typescript
{ form, isLoading, submitWaterLog(amountOverride?: number): Promise<boolean> }
```

**`useBodyForm()`** - `src/hooks/useBodyForm.ts`

```typescript
{ form, weightUnit, setWeightUnit, lengthUnit, setLengthUnit, isLoading, submitMeasurement(): Promise<boolean> }
```

**`useStepForm()`** - `src/hooks/useStepForm.ts`

```typescript
{ form, isLoading, submitStepLog(stepsOverride?: number): Promise<boolean> }
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
{ transcript, isListening, startListening(), stopListening(), isSupported: boolean }
```

**`useBarcodeScanner()`** - `src/hooks/useBarcodeScanner.ts`

```typescript
{ scannedCode: string | null, isScanning, startScanning(), stopScanning(), error: string | null }
```

**`useFastingTimer()`** - `src/hooks/useFastingTimer.ts`

```typescript
{ elapsedSeconds, isActive, startFasting(targetHours), endFasting(completed), activeSession }
```

**`useActivityForm()`** - `src/hooks/useActivityForm.ts`

```typescript
{ form, caloriesBurned: number, isLoading, submitActivityLog(): Promise<boolean> }
```

**`useOnboarding()`** - `src/hooks/useOnboarding.ts`

```typescript
{ form, step, totalSteps, nextStep(), prevStep(), goToStep(n), weightUnit, lengthUnit, submit(): Promise<void> }
```

**`useDataExport()`** - `src/hooks/useDataExport.ts`

```typescript
{ downloadJSON(): Promise<void>, downloadCSVZip(): Promise<void>, isExporting: boolean }
```

**`useDataImport()`** - `src/hooks/useDataImport.ts`

```typescript
{ openFilePicker(), pendingPayload, confirmImport(), cancelImport(), isImporting: boolean }
```

**`useSpotlightRect()`** - `src/hooks/useSpotlightRect.ts` (or `src/components/tour/`)

```typescript
{ rect: DOMRect | null }  // bounding rect of current tour step's target element
```

---

## 9. Build and Deployment

### Build Output

```bash
pnpm build  # -> dist/ (index.html + assets/ gzip + brotli compressed)
```

### Deployment

The app deploys at `/${packageJson.name}/` (sub-path; configured in `vite.config.ts` `base`).

**Static hosting security headers** are provided via `public/_headers` (Cloudflare Pages and
Netlify).

**Dev server:** CSP is intentionally excluded from dev headers because `@vitejs/plugin-react`
injects an inline `<script type="module">` for Fast Refresh that `script-src 'self'` would block.

### Deployment Checklist

- [ ] `pnpm build` succeeds with no TypeScript errors
- [ ] `pnpm audit` passes (no high/critical CVEs)
- [ ] `pnpm lint:fix` passes
- [ ] `pnpm test` passes with coverage report
- [ ] Deployed over HTTPS
- [ ] `public/_headers` present in `dist/` or equivalent host config
- [ ] IndexedDB persists across sessions
- [ ] Dark mode toggle works
- [ ] Onboarding modal appears on first load
- [ ] Fasting timer resumes after page reload if a session was active

---

## 10. Known Limitations and Technical Debt

### Pending Features (v0.4 Roadmap)

| Feature                                   | Status                                                             |
|-------------------------------------------|--------------------------------------------------------------------|
| Barcode food-lookup API (Open Food Facts) | Camera works; API not integrated; `connect-src` placeholder in CSP |
| Recurring meal logging (copy-yesterday)   | Not started                                                        |
| Micronutrient tracking (~25 nutrients)    | Not started                                                        |
| Diet profiles + restriction flags         | Not started                                                        |
| PWA + service worker                      | Not started; prereq for reminders                                  |
| Body Measurements UI refresh              | Charts done; edit/delete UI pending                                |
| Projected weight timeline card            | TDEE engine exists; UI pending                                     |
| Per-table conflict counts on import       | Merge summary shown; per-table row counts not displayed            |
| Multi-user auth                           | Single hardcoded user `UserId("1")`                                |
| Advanced filtering and search             | Not implemented                                                    |
| Food log pagination                       | All items loaded at once via `getAllFoodLogs`                      |
| WCAG 2.1 full compliance                  | Pending audit                                                      |

### Technical Debt

| Issue                                                                                | Severity | Location                       |
|--------------------------------------------------------------------------------------|----------|--------------------------------|
| Recipe `description` not sanitized                                                   | Medium   | `useRecipeForm`, `Recipes.tsx` |
| `getAllFoodLogs` and `getRecentFoodItems` use `where("userId")` - not compound index | Low      | `dbService.ts`                 |
| No schema migration tests                                                            | Low      | `dbService.test.ts`            |
| No optimistic updates                                                                | Low      | `AppState.ts`                  |
| Achievement `[userId+achievementId]` index not enforced as unique at DB level        | Low      | `dbService.ts`                 |

---

## 11. Uncertainties and Questions

- **Recipe calories UI:** The `calories` field on each ingredient row requires the user to manually
  enter the per-unit calorie value. Should this be auto-populated from `allFoodItems` when a food
  item is selected?
- **Barcode API choice:** Open Food Facts confirmed for v0.4 MVP; USDA FoodData Central as
  secondary source for whole foods (richer micronutrient data). CSP `connect-src` must be updated
  when integrated.
- **`getRecentFoodItems` deduplication:** Deduplication by name (most recent per name) - intended
  for ingredient selector corpus in recipes?
- **Achievement deduplication at DB level:** `addUserAchievement` does not check for duplicates;
  the `[userId+achievementId]` compound index exists but is not enforced as unique. Could lead to
  duplicate rows if `checkAndUnlockAchievements` is called concurrently. (Still open.)
- **PWA caching strategy:** Network-first for API calls, cache-first for assets - confirmed
  approach for v0.4. `vite-plugin-pwa` (Workbox) is the planned integration.
- **TDEE profile migration:** When the user changes their TDEE profile, historical calorie goals
  are not retroactively updated. Is that the intended behavior?

---

**Document Generated:** May 21, 2026
**Analysis Method:** Reverse-engineering from src/ folder, CLAUDE.md, and release notes
(v0.0.1 - v0.3.0)
**Source References:** src/types/index.ts, src/db/dbService.ts, src/state/AppState.ts,
src/lib/achievements.ts, src/lib/tdee.ts, src/lib/metTable.ts, src/lib/utils.ts,
src/forms/schemas.ts, src/App.tsx, src/pages/Dashboard.tsx, src/pages/Progress.tsx,
src/pages/Settings.tsx, src/hooks/*.ts, src/components/FastingTimer.tsx,
src/components/ActivityLogger.tsx, src/components/tour/*, vite.config.ts, package.json,
CLAUDE.md, release-notes/0.3.0.md

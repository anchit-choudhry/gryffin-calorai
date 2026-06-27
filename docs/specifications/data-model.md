# Gryffin Calorai: Data Model and Schema

IndexedDB schema (Dexie v20), table definitions, compound indices, branded ID types,
schema version history, and sync queue design.

---

## 4. Data Model and Schema

### Database: `GryffinCaloraiDB` (Dexie/IndexedDB)

**Current Schema Version: 13**

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
| v9      | `stepLogs` table                                    | -                                                 |
| v10     | (skipped/reserved)                                  | -                                                 |
| v11     | `tdeeProfiles` table                                | -                                                 |
| v12     | `activityLogs` table                                | -                                                 |
| v13     | `fastingSessions` table + `BACKUP_VERSION` constant | -                                                 |

---

#### Table: `users`

**Primary key:** `id` (UserId - string)
**Indices:** `id, username, email, lastLogin`

```typescript
interface UserProfile {
  id: UserId;                      // "1" (hardcoded single user)
  username: string;                // "Guest"
  email: string;                   // "guest@example.com"
  lastLogin: string;               // ISO 8601 timestamp, updated on every getOrCreateUser() call
  calorieGoal: number;             // default 2000 kcal; validated range [1, 99999]
  hasCompletedOnboarding?: boolean // set to true after TDEE onboarding flow
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

---

#### Table: `tdeeProfiles` (v11)

**Primary key:** `++id`
**Index:** `userId`

```typescript
interface TdeeProfile {
  id?: number;
  userId: UserId;
  age: number;
  sex: Sex;            // "male" | "female"
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;      // "lose" | "maintain" | "gain"
  updatedAt: string;   // ISO 8601 timestamp
}
```

`calorieGoal` is derived from this profile at read time via `calculateTDEE()` and stored on
`UserProfile` for quick access.

---

#### Table: `activityLogs` (v12)

**Primary key:** `++id` (auto-increment ActivityLogId)
**Compound index:** `[userId+dateLogged]`
**Other indices:** `userId, dateLogged`

```typescript
interface ActivityLog {
  id?: ActivityLogId;
  userId: UserId;
  activityType: string;      // matches a key in metTable.ts
  durationMin: number;       // 1-1440 minutes
  caloriesBurned: number;    // computed: MET * weightKg * (durationMin / 60)
  dateLogged: ISODate;       // YYYY-MM-DD
  loggedAt: string;          // ISO 8601 timestamp
}
```

---

#### Table: `fastingSessions` (v13)

**Primary key:** `++id` (auto-increment FastingSessionId)
**Compound index:** `[userId+startTime]`
**Other indices:** `userId, startTime`

```typescript
interface FastingSession {
  id?: FastingSessionId;
  userId: UserId;
  startTime: string;       // ISO 8601 with time (e.g. "2026-05-21T08:00:00.000Z")
  endTime: string | null;  // null while fasting is active
  targetHours: number;
  dateLogged: ISODate;     // YYYY-MM-DD of startTime
  completed: boolean;      // true when endTime >= startTime + targetHours
}
```

---

### Branded Type System

Compile-time ID safety via TypeScript intersection types. Zero runtime cost.

```typescript
// src/types/index.ts
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId             = Brand<string, "UserId">
export type FoodItemId         = Brand<number, "FoodItemId">
export type RecipeId           = Brand<number, "RecipeId">
export type WaterLogId         = Brand<number, "WaterLogId">
export type BodyMeasurementId  = Brand<number, "BodyMeasurementId">
export type UserAchievementId  = Brand<number, "UserAchievementId">
export type StepLogId          = Brand<number, "StepLogId">
export type ActivityLogId      = Brand<number, "ActivityLogId">
export type FastingSessionId   = Brand<number, "FastingSessionId">
export type ISODate            = Brand<string, "ISODate">
```

Each branded type has a constructor function (raw cast) and a type guard (runtime validation):

| Type                                                                                                                                                      | Guard logic                                                            |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| `isUserId`                                                                                                                                                | `typeof value === "string" && length [1, 128] && printable ASCII only` |
| `isFoodItemId` / `isRecipeId` / `isWaterLogId` / `isBodyMeasurementId` / `isStepLogId` / `isUserAchievementId` / `isActivityLogId` / `isFastingSessionId` | `typeof value === "number" && Number.isInteger && value > 0`           |
| `isISODate`                                                                                                                                               | regex `^\d{4}-\d{2}-\d{2}$` + `Date` validity check                    |

### Domain Types (`src/types/index.ts`)

```typescript
export type Sex           = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType      = "lose" | "maintain" | "gain";
export type WeightUnit    = "kg" | "lb";
export type LengthUnit    = "cm" | "in";
export type MealType      = "Breakfast" | "Lunch" | "Snacks" | "Dinner";
```

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

**Constants:**

| Constant                      | Value                                                                      |
|-------------------------------|----------------------------------------------------------------------------|
| `DAILY_WATER_GOAL_ML`         | `2000`                                                                     |
| `DAILY_STEP_GOAL`             | `10000`                                                                    |
| `MEAL_TYPES`                  | `["Breakfast", "Lunch", "Snacks", "Dinner"]` (readonly)                    |
| `DEFAULT_MEAL_TYPE`           | `"Breakfast"`                                                              |
| `WEIGHT_UNITS`                | `["kg", "lb"]` (readonly)                                                  |
| `LENGTH_UNITS`                | `["cm", "in"]` (readonly)                                                  |
| `ACTIVITY_LEVELS`             | `["sedentary", "light", "moderate", "active", "very_active"]` (readonly)   |
| `ACTIVITY_LEVEL_FACTORS`      | Record<ActivityLevel, number> - Mifflin-St Jeor multipliers (1.2 - 1.9)    |
| `ACTIVITY_LEVEL_LABELS`       | Record<ActivityLevel, string> - display labels                             |
| `ACTIVITY_LEVEL_DESCRIPTIONS` | Record<ActivityLevel, string> - help text                                  |
| `GOAL_OFFSETS`                | `{ lose: -500, maintain: 0, gain: 300 }` kcal/day                          |
| `GOAL_LABELS`                 | Record<GoalType, string> - display labels                                  |
| `FASTING_PRESETS`             | `[{12,"12:12"},{14,"14:10"},{16,"16:8"},{18,"18:6"},{20,"OMAD"}]` readonly |

### Utility Functions (`src/lib/utils.ts`)

| Export                        | Behavior                                                                                                          |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `cn(...inputs)`               | `clsx` + `tailwind-merge` utility for className composition                                                       |
| `EDITORIAL_INPUT_CLS`         | Shared Tailwind class string for editorial-style borderless inputs                                                |
| `groupLogsByMeal(logs)`       | Groups `FoodItem[]` by `MealType`; returns `GroupedMealLog[]` in `MEAL_TYPES` order, empty groups omitted         |
| `normalizeHash(raw)`          | Maps raw hash string to one of `"#dashboard"`, `"#recipes"`, `"#progress"`, `"#/settings"`; defaults to dashboard |
| `mapDbError(error, fallback)` | Maps Dexie errors to user-friendly messages (QuotaExceeded, ConstraintError, DatabaseClosed)                      |

### TDEE Engine (`src/lib/tdee.ts`)

```typescript
mifflinStJeorBMR(profile): number
computeTDEE(profile): number    // BMR * ACTIVITY_LEVEL_FACTORS[activityLevel]
computeCalorieGoal(profile): number  // TDEE + GOAL_OFFSETS[goal]
calculateTDEE(profile): { bmr, tdee, calorieGoal }
```

### MET Table (`src/lib/metTable.ts`)

Static lookup table of ~60 common activities with ACSM metabolic equivalent values.

```typescript
getMET(activityType: string): number
```

Calorie burn formula: `MET * weightKg * (durationMin / 60)`

---


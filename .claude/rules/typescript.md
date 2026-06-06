---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Style Rules

Source: Google TypeScript Style Guide (google.github.io/styleguide/tsguide.html).
Applied to all `.ts` and `.tsx` files in this project.

---

## Naming

| Symbol                                    | Convention                           | Examples                                   |
|-------------------------------------------|--------------------------------------|--------------------------------------------|
| Classes, interfaces, types, enums         | `UpperCamelCase`                     | `FoodItem`, `UserId`, `MealType`           |
| Variables, functions, methods, parameters | `lowerCamelCase`                     | `calorieGoal`, `useFoodForm()`             |
| Global constants, enum values             | `CONSTANT_CASE`                      | `DB_SCHEMA_VERSION`, `DAILY_WATER_GOAL_ML` |
| Generic type parameters                   | `T`, `TValue`, `TKey`                | `Array<T>`, `Record<TKey, TValue>`         |
| Private class members                     | No `_` prefix; use `private` keyword | `private readonly id: string`              |

**Booleans:** prefix with `is`, `has`, `can`, `should`, or `did`:

```typescript
// Good
const isLoading = false;
const hasError = true;
const canSubmit = isValid && !isLoading;

// Bad
const loading = false;
const error = true;
```

**Abbreviations:** treat acronyms as words in names:

```typescript
// Good
loadUrl();
exportHtml();

class XmlParser {
}

// Bad
loadURL();
exportHTML();

class XMLParser {
}
```

---

## Types

### Avoid `any`

Never use `any`. Use `unknown` when the type is truly unknown, then narrow it:

```typescript
// Good
function parseResponse(data: unknown): FoodItem {
  if (!isFoodItem(data)) throw new Error("Invalid response shape");
  return data;
}

// Bad - disables type checking completely
function parseResponse(data: any): FoodItem {
  return data;
}
```

### No wrapper object types

Use primitives, not their object counterparts:

```typescript
// Good
const name: string = "apple";
const count: number = 42;
const active: boolean = true;

// Bad
const name: String = "apple";
const count: Number = 42;
const active: Boolean = true;
```

### Prefer `interface` for object shapes, `type` for unions

```typescript
// Good - interface for object shapes
interface FoodEntry {
  id: FoodItemId;
  name: string;
  calories: number;
}

// Good - type alias for unions and intersections
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
type LoadingState = "idle" | "loading" | "error" | "success";
```

### Optional fields vs `| undefined`

Use optional `?` for truly optional fields; `| undefined` when the field must be
explicitly provided but can be undefined:

```typescript
// Good - truly optional (can be omitted)
interface UserSettings {
  theme?: "light" | "dark";
  calorieGoal?: number;
}

// Good - must be explicitly provided, can be undefined
function findItem(id: FoodItemId | undefined): FoodItem | undefined { ...
}
```

### Readonly and immutability

Use `readonly` for data that should not be mutated after creation:

```typescript
// Good
function getNames(items: readonly FoodItem[]): string[] {
  return items.map((i) => i.name);
}

const PRESETS = ["12:12", "14:10", "16:8"] as const;
type FastingPreset = (typeof PRESETS)[number];
```

### Non-null assertion (`!`)

Avoid `!`. Prefer optional chaining or explicit null checks:

```typescript
// Good
const name = item?.name ?? "Unknown";

// Bad - crashes at runtime if item is null/undefined
const name = item!.name;
```

Use `!` only when the non-null contract is enforced by the surrounding code and a
comment explains why (e.g., after a `find()` result is already checked).

### Type assertions

Use `as Type`, never the angle-bracket form in `.tsx` files:

```typescript
// Good
const el = document.getElementById("root") as HTMLElement;

// Bad (conflicts with JSX syntax in .tsx)
const el = <HTMLElement>document.getElementById("root");
```

Prefer type guards over assertions wherever possible:

```typescript
function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "status" in err;
}
```

### Prefer `undefined` over `null`

Use `undefined` as the "no value" sentinel. Avoid returning or storing `null` unless
interfacing with a DOM API that returns it:

```typescript
// Good
function findEntry(id: FoodItemId): FoodEntry | undefined {
  return entries.find((e) => e.id === id);
}

// Avoid - null adds a third state to reason about
function findEntry(id: FoodItemId): FoodEntry | null {
  return entries.find((e) => e.id === id) ?? null;
}
```

Never use `== null` to check for either; use strict `=== undefined` or `=== null`:

```typescript
// Good
if (value === undefined) { ...
}

// Bad - also matches null, hides intent
if (value == null) { ...
}
```

### Branded types

Use branded types for all domain IDs to prevent passing a `RecipeId` where a
`FoodItemId` is expected. The pattern uses an intersection with a unique phantom tag:

```typescript
// Declaration (in src/types/index.ts)
type FoodItemId = string & { readonly __brand: "FoodItemId" };

// Construction - only at the trust boundary (DB read or server response)
const id = row.id as FoodItemId;

// Usage - all other code receives the branded type; no casting needed
function deleteItem(id: FoodItemId): Promise<void> { ...
}
```

Never cast to a branded type inside component or hook code; construct only at the
DB/API layer where the value origin is known.

---

## Imports and exports

### Named exports only

Never use default exports; always use named exports:

```typescript
// Good
export function useFoodForm() { ...
}

export type {FoodItem};

// Bad
export default function useFoodForm() { ...
}
```

**Why:** default exports produce inconsistent import names across files and make
automated refactoring harder.

### Type-only imports

Use `import type` for types that are not needed at runtime:

```typescript
// Good
import type {FC, ReactNode} from "react";
import type {FoodItem, UserId} from "@/types";
import {useState, useCallback} from "react";

// Bad - imports the full module even for types
import {FC, ReactNode, useState} from "react";
```

### No namespace imports

Avoid `import * as foo` except for modules that export no named bindings:

```typescript
// Good
import {format, parseISO} from "date-fns";

// Bad
import * as dateFns from "date-fns";
```

### Import ordering (enforced by ESLint)

Group in this order, separated by blank lines:

1. Node/built-in modules
2. Third-party packages (`react`, `zustand`, `dexie`, ...)
3. Internal path aliases (`@/...`)
4. Relative imports (`./...`, `../...`)

---

## Language features

### Equality: always `===` and `!==`

Never use `==` or `!=`. JavaScript's abstract equality coerces types in ways that are
hard to predict (`0 == ""` is `true`; `null == undefined` is `true`):

```typescript
// Good
if (calories === 0) { ...
}
if (userId !== currentUserId) { ...
}

// Bad - type coercion silently hides bugs
if (calories == 0) { ...
}
if (userId != currentUserId) { ...
}
```

### Return type annotations for exported functions

Always annotate the return type of exported functions and hooks. Inferred return types
change silently when the body changes; explicit annotations make the contract clear:

```typescript
// Good - return type is part of the public API contract
export function computeTDEE(profile: TdeeProfile): number { ...
}

export function useFoodForm(): UseFoodFormReturn { ...
}

// Avoid - callers depend on inferred type that can drift
export function computeTDEE(profile: TdeeProfile) { ...
}
```

Private and local functions may omit return type annotations when inference is obvious.

### No nested ternaries

Ternaries are fine for simple conditional expressions. Beyond one level, use `if/else`
or an early-return pattern:

```typescript
// Good - one level, clearly readable
const label = isLoading ? "Saving..." : "Save";

// Good - multiple conditions use if/else
let label: string;
if (isLoading) {
  label = "Saving...";
} else if (hasError) {
  label = "Retry";
} else {
  label = "Save";
}

// Bad - deeply nested ternary is unreadable
const label = isLoading ? "Saving..." : hasError ? "Retry" : isDirty ? "Save*" : "Save";
```

### `const` and `let`; never `var`

```typescript
// Good
const userId = getCurrentUserId();
let retryCount = 0;

// Bad
var userId = getCurrentUserId();
```

### Arrow functions for callbacks

Prefer arrow functions over `function` expressions for callbacks and short functions:

```typescript
// Good
const doubled = items.map((x) => x * 2);

// Avoid (verbose and captures wrong `this` in class context)
const doubled = items.map(function (x) {
  return x * 2;
});
```

Use `function` declarations for top-level named functions to get hoisting and clearer
stack traces:

```typescript
// Good for module-level hooks and utilities
export function computeTDEE(profile: TdeeProfile): number { ...
}
```

### Template literals over concatenation

```typescript
// Good
const msg = `Logged ${calories} kcal for ${mealType}`;

// Bad
const msg = "Logged " + calories + " kcal for " + mealType;
```

### Destructuring

Use object and array destructuring to reduce repetition:

```typescript
// Good
const {name, calories, mealType} = foodItem;
const [first, ...rest] = entries;

// Bad
const name = foodItem.name;
const calories = foodItem.calories;
```

### Spread operator

Use spread instead of `Object.assign` for shallow copies:

```typescript
// Good
const updated = {...foodItem, calories: 350};

// Bad
const updated = Object.assign({}, foodItem, {calories: 350});
```

### Optional chaining and nullish coalescing

```typescript
// Good
const label = user?.displayName ?? "Guest";
const count = settings?.calorieGoal ?? 2000;

// Bad - verbose null checks
const label = user && user.displayName ? user.displayName : "Guest";
```

### `for...of` for iteration; avoid `for...in`

```typescript
// Good - iterates values
for (const entry of foodEntries) {
  process(entry);
}

// Avoid - iterates keys and includes prototype properties
for (const key in obj) { ...
}
```

### Async/await over raw Promises

```typescript
// Good
async function loadFood(id: FoodItemId): Promise<FoodItem | undefined> {
  try {
    return await db.foodItems.get(id);
  } catch (err) {
    console.error("Failed to load food item", err);
    return undefined;
  }
}

// Avoid (harder to read and debug)
function loadFood(id: FoodItemId): Promise<FoodItem | undefined> {
  return db.foodItems.get(id).catch((err) => {
    console.error("Failed to load food item", err);
    return undefined;
  });
}
```

### Throw only `Error` instances

Always throw an instance of `Error` (or a subclass). Never throw strings, numbers, or
plain objects - they have no `.stack` trace and `instanceof Error` checks fail:

```typescript
// Good
throw new Error(`Food item not found: ${id}`);
throw new TypeError(`Expected FoodItemId, got: ${typeof id}`);

// Bad - string has no stack trace
throw `Food item not found: ${id}`;

// Bad - plain object breaks instanceof checks
throw {message: "Not found", code: 404};
```

### Error handling

Always handle rejected Promises. Catch and rethrow unknown errors with context:

```typescript
// Good
try {
  await db.foodItems.add(item);
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  throw new Error(`Failed to add food item: ${message}`);
}

// Bad - swallows the error silently
try {
  await db.foodItems.add(item);
} catch (_) {
}
```

---

## Enums

Prefer string union types over TypeScript enums:

```typescript
// Good
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

// Avoid - numeric enums serialize poorly and have reverse-mapping quirks
enum MealType { Breakfast, Lunch, Dinner, Snacks }
```

Use `const` object with `as const` when an enum-like map is needed:

```typescript
// Good
const FASTING_PRESETS = {
  "12:12": {label: "12:12", hours: 12},
  "16:8": {label: "16:8", hours: 16},
} as const;

type FastingPresetKey = keyof typeof FASTING_PRESETS;
```

---

## Classes

### Constructor shorthand

Use access-modifier shorthand to declare and initialize fields:

```typescript
// Good
class FoodService {
  constructor(
    private readonly db: Dexie,
    private readonly userId: UserId,
  ) {
  }
}

// Verbose (avoid when shorthand works)
class FoodService {
  private readonly db: Dexie;
  private readonly userId: UserId;

  constructor(db: Dexie, userId: UserId) {
    this.db = db;
    this.userId = userId;
  }
}
```

### No empty constructors

Omit constructors that only call `super()` with no other logic.

---

## Comments and documentation

### JSDoc for public APIs

Use `/** */` JSDoc for all exported functions, types, and constants that are not
self-explanatory:

```typescript
/**
 * Computes the daily calorie goal based on TDEE and the user's goal type.
 * Uses a -500 kcal deficit for weight loss, 0 for maintenance, +300 for gain.
 */
export function computeCalorieGoal(tdee: number, goal: GoalType): number { ...
}
```

### Inline comments with `//`

Use `//` for implementation notes. Never explain WHAT; only explain WHY when the
reason is non-obvious:

```typescript
// Compound index required; full-table scans cause IndexedDB jank on large datasets.
return db.foodItems.where("[userId+dateLogged]").equals([userId, date]).toArray();
```

### No `@author` tags

Do not add `@author` tags to JSDoc. Use `git blame` for authorship.

---

## Formatting

- **Indentation:** 2 spaces (enforced by `.editorconfig` and Prettier)
- **Line length:** 100 characters max (Prettier `printWidth`)
- **Semicolons:** always (Prettier default)
- **Quotes:** double quotes for strings, backticks for templates (Prettier enforced)
- **Trailing commas:** always in multi-line structures (`trailingComma: "all"`)

Run `pnpm lint:fix` before every commit to auto-apply all Prettier + ESLint fixes.

---

**Last Updated:** June 6, 2026 | **Source:** Google TypeScript Style Guide

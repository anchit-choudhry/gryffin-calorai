import type { UserProfile } from "../db/dbService";

// Domain-specific branded types to prevent ID mix-ups at compile time
type Brand<T, B extends string> = T & { readonly __brand: B };

export type WaterLogId = Brand<number, "WaterLogId">;
export type BodyMeasurementId = Brand<number, "BodyMeasurementId">;
export type UserAchievementId = Brand<number, "UserAchievementId">;
export type StepLogId = Brand<number, "StepLogId">;

export const WaterLogId = (id: number): WaterLogId => id as WaterLogId;
export const BodyMeasurementId = (id: number): BodyMeasurementId => id as BodyMeasurementId;
export const UserAchievementId = (id: number): UserAchievementId => id as UserAchievementId;
export const StepLogId = (id: number): StepLogId => id as StepLogId;

export function isWaterLogId(value: unknown): value is WaterLogId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export function isBodyMeasurementId(value: unknown): value is BodyMeasurementId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export function isUserAchievementId(value: unknown): value is UserAchievementId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export function isStepLogId(value: unknown): value is StepLogId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export type ActivityLogId = Brand<number, "ActivityLogId">;
export type FastingSessionId = Brand<number, "FastingSessionId">;

export const ActivityLogId = (id: number): ActivityLogId => id as ActivityLogId;
export const FastingSessionId = (id: number): FastingSessionId => id as FastingSessionId;

export function isActivityLogId(value: unknown): value is ActivityLogId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export function isFastingSessionId(value: unknown): value is FastingSessionId {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

export const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;

export const ACTIVITY_LEVEL_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  active: "Very Active",
  very_active: "Extra Active",
};

export const ACTIVITY_LEVEL_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: "Little or no exercise, desk job",
  light: "Light exercise 1-3 days/week",
  moderate: "Moderate exercise 3-5 days/week",
  active: "Heavy exercise 6-7 days/week",
  very_active: "Very heavy exercise, physical job, or twice-daily training",
};

export const GOAL_OFFSETS: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export const GOAL_LABELS: Record<GoalType, string> = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
};

export const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  lose: "500 kcal/day deficit - lose ~0.5 kg/week",
  maintain: "Eat at maintenance - no change",
  gain: "300 kcal/day surplus - gain ~0.3 kg/week",
};

export const FASTING_PRESETS: readonly { hours: number; label: string }[] = [
  { hours: 12, label: "12:12" },
  { hours: 14, label: "14:10" },
  { hours: 16, label: "16:8" },
  { hours: 18, label: "18:6" },
  { hours: 20, label: "OMAD" },
] as const;

export type UserId = Brand<string, "UserId">;
export type FoodItemId = Brand<number, "FoodItemId">;
export type RecipeId = Brand<number, "RecipeId">;

// Date in ISO format (YYYY-MM-DD)
export type ISODate = Brand<string, "ISODate">;

// Constructor functions with branding
export const UserId = (id: string): UserId => {
  if (!isUserId(id)) throw new Error(`Invalid UserId`);
  return id as UserId;
};
export const FoodItemId = (id: number): FoodItemId => id as FoodItemId;
export const RecipeId = (id: number): RecipeId => id as RecipeId;
export const ISODate = (date: string): ISODate => {
  if (!isISODate(date)) throw new Error(`Invalid ISO date: "${date}"`);
  return date as ISODate;
};

// Helper to get ISO date for today
export const todayISO = (): ISODate => ISODate(new Date().toISOString().split("T")[0]!);

// Type guards
export function isFoodItemId(value: unknown): value is FoodItemId {
  return typeof value === "number" && value > 0;
}

const PRINTABLE_ASCII_ID_RE = /^[\x20-\x7E]+$/;

export function isUserId(value: unknown): value is UserId {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    PRINTABLE_ASCII_ID_RE.test(value)
  );
}

export function isRecipeId(value: unknown): value is RecipeId {
  return typeof value === "number" && value > 0;
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export const LENGTH_UNITS = ["cm", "in"] as const;

export function isWeightUnit(v: string): v is WeightUnit {
  return (WEIGHT_UNITS as readonly string[]).includes(v);
}

export function isLengthUnit(v: string): v is LengthUnit {
  return (LENGTH_UNITS as readonly string[]).includes(v);
}

const MAX_BARCODE_LENGTH = 100;
const PRINTABLE_ASCII_RE = /[^\x20-\x7E]/g;

export function sanitizeBarcodeInput(raw: string): string | null {
  const trimmed = raw.trim().replace(PRINTABLE_ASCII_RE, "");
  if (trimmed.length === 0 || trimmed.length > MAX_BARCODE_LENGTH) return null;
  return trimmed;
}

const MAX_TRANSCRIPT_LENGTH = 200;
const MULTI_SPACE_RE = /\s+/g;

export function sanitizeVoiceTranscript(raw: string): string | null {
  let cleaned = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) cleaned += ch;
  }
  cleaned = cleaned.replace(MULTI_SPACE_RE, " ").trim();
  if (cleaned.length === 0 || cleaned.length > MAX_TRANSCRIPT_LENGTH) return null;
  return cleaned;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]!;
      const cost = a[i - 1]! === b[j - 1]! ? 0 : 1;
      dp[j] = Math.min(dp[j - 1]! + 1, dp[j]! + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n]!;
}

export function fuzzyMatchFoodName<T extends { name: string }>(
  query: string,
  corpus: readonly T[],
  limit = 3,
): T[] {
  if (!query || corpus.length === 0) return [];
  if (query.length > MAX_TRANSCRIPT_LENGTH) return [];
  const q = query.toLowerCase();
  const threshold = Math.max(2, Math.floor(q.length / 4));

  const scored = corpus.map((item) => {
    const n = item.name.toLowerCase();
    let score: number;
    if (n === q) {
      score = 0;
    } else if (n.startsWith(q) || q.startsWith(n)) {
      score = 1;
    } else if (n.includes(q) || q.includes(n)) {
      score = 2;
    } else {
      score = levenshtein(q, n);
    }
    return { item, score };
  });

  return scored
    .filter(({ score }) => score <= threshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

export type MealType = "Breakfast" | "Lunch" | "Snacks" | "Dinner";
export const MEAL_TYPES: readonly MealType[] = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
export const DEFAULT_MEAL_TYPE: MealType = "Breakfast";

export const DAILY_WATER_GOAL_ML = 2000;
export const DAILY_STEP_GOAL = 10000;

export type WeightUnit = "kg" | "lb";
export type LengthUnit = "cm" | "in";

export const kgToLb = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbToKg = (lb: number): number => Math.round((lb / 2.20462) * 100) / 100;
export const cmToIn = (cm: number): number => Math.round((cm / 2.54) * 10) / 10;
export const inToCm = (inch: number): number => Math.round(inch * 2.54 * 10) / 10;

export function computeStreaks(uniqueDates: readonly string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dateSet = new Set(uniqueDates);
  const today = new Date().toISOString().split("T")[0]!;

  const shiftDay = (date: string, n: number): string => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0]!;
  };

  // Walk back from today (or yesterday if today has no log)
  const start = dateSet.has(today) ? today : shiftDay(today, -1);
  let currentStreak = 0;
  let cursor = start;
  while (dateSet.has(cursor)) {
    currentStreak++;
    cursor = shiftDay(cursor, -1);
  }

  // Longest consecutive run
  const sorted = [...uniqueDates].sort();
  let longest = sorted.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === shiftDay(sorted[i - 1]!, 1)) {
      longest = Math.max(longest, ++run);
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak: longest };
}

// Utility types for type-safe patterns
export type NonEmptyArray<T> = [T, ...T[]];

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export type AsyncResult<T> =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "resolved"; data: T }
  | { status: "rejected"; error: string };

export function assertDefined<T>(val: T | null | undefined, msg: string): asserts val is T {
  if (val == null) throw new Error(msg);
}

// App initialization state machine - prevents impossible state combinations
export type AppInitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; user: UserProfile }
  | { status: "error"; message: string };

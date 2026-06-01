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

function isPositiveIntegerId(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

export function isWaterLogId(value: unknown): value is WaterLogId {
  return isPositiveIntegerId(value);
}

export function isBodyMeasurementId(value: unknown): value is BodyMeasurementId {
  return isPositiveIntegerId(value);
}

export function isUserAchievementId(value: unknown): value is UserAchievementId {
  return isPositiveIntegerId(value);
}

export function isStepLogId(value: unknown): value is StepLogId {
  return isPositiveIntegerId(value);
}

export type ActivityLogId = Brand<number, "ActivityLogId">;
export type FastingSessionId = Brand<number, "FastingSessionId">;
export type DietProfileId = Brand<number, "DietProfileId">;
export type RecurringMealId = Brand<number, "RecurringMealId">;
export type ReminderId = Brand<number, "ReminderId">;
export type MealTemplateId = Brand<number, "MealTemplateId">;
export type MealPlanId = Brand<number, "MealPlanId">;

export const ActivityLogId = (id: number): ActivityLogId => id as ActivityLogId;
export const FastingSessionId = (id: number): FastingSessionId => id as FastingSessionId;
export const DietProfileId = (id: number): DietProfileId => id as DietProfileId;
export const RecurringMealId = (id: number): RecurringMealId => id as RecurringMealId;
export const ReminderId = (id: number): ReminderId => id as ReminderId;
export const MealTemplateId = (id: number): MealTemplateId => id as MealTemplateId;
export const MealPlanId = (id: number): MealPlanId => id as MealPlanId;

export function isActivityLogId(value: unknown): value is ActivityLogId {
  return isPositiveIntegerId(value);
}

export function isFastingSessionId(value: unknown): value is FastingSessionId {
  return isPositiveIntegerId(value);
}

export function isDietProfileId(value: unknown): value is DietProfileId {
  return isPositiveIntegerId(value);
}

export function isRecurringMealId(value: unknown): value is RecurringMealId {
  return isPositiveIntegerId(value);
}

export function isReminderId(value: unknown): value is ReminderId {
  return isPositiveIntegerId(value);
}

export function isMealTemplateId(value: unknown): value is MealTemplateId {
  return isPositiveIntegerId(value);
}

export function isMealPlanId(value: unknown): value is MealPlanId {
  return isPositiveIntegerId(value);
}

// --- Feature 17: Reminders ---

export type ReminderType = "log_meal" | "drink_water" | "weigh_in" | "log_steps" | "fasting_check";

export const REMINDER_TYPES: readonly ReminderType[] = [
  "log_meal",
  "drink_water",
  "weigh_in",
  "log_steps",
  "fasting_check",
] as const;

export const REMINDER_LABELS = {
  log_meal: "Log a Meal",
  drink_water: "Drink Water",
  weigh_in: "Weigh In",
  log_steps: "Log Steps",
  fasting_check: "Fasting Check",
} satisfies Record<ReminderType, string>;

// --- Feature 15: Diet Profiles ---

export type DietPreset =
  | "generic"
  | "keto"
  | "paleo"
  | "vegan"
  | "vegetarian"
  | "mediterranean"
  | "high_protein"
  | "low_sodium"
  | "low_carb";

export type RestrictionFlag =
  | "gluten"
  | "dairy"
  | "nuts"
  | "soy"
  | "eggs"
  | "shellfish"
  | "alcohol"
  | "pork";

export const DIET_PRESETS = {
  generic: { label: "Generic", macros: { protein: 25, carbs: 50, fat: 25 } },
  keto: { label: "Keto", macros: { protein: 25, carbs: 5, fat: 70 } },
  paleo: { label: "Paleo", macros: { protein: 30, carbs: 35, fat: 35 } },
  vegan: { label: "Vegan", macros: { protein: 20, carbs: 60, fat: 20 } },
  vegetarian: { label: "Vegetarian", macros: { protein: 20, carbs: 55, fat: 25 } },
  mediterranean: { label: "Mediterranean", macros: { protein: 20, carbs: 50, fat: 30 } },
  high_protein: { label: "High Protein", macros: { protein: 40, carbs: 35, fat: 25 } },
  low_sodium: { label: "Low Sodium", macros: { protein: 25, carbs: 50, fat: 25 } },
  low_carb: { label: "Low Carb", macros: { protein: 30, carbs: 20, fat: 50 } },
} satisfies Record<
  DietPreset,
  { label: string; macros: { protein: number; carbs: number; fat: number } }
>;

export const RESTRICTION_FLAGS = {
  gluten: {
    label: "Gluten",
    keywords: ["wheat", "gluten", "bread", "pasta", "flour", "barley", "rye", "oat", "cereal"],
  },
  dairy: {
    label: "Dairy",
    keywords: ["milk", "cheese", "yogurt", "butter", "cream", "whey", "lactose", "dairy"],
  },
  nuts: {
    label: "Nuts",
    keywords: ["nut", "almond", "cashew", "walnut", "peanut", "pecan", "pistachio", "hazelnut"],
  },
  soy: { label: "Soy", keywords: ["soy", "tofu", "edamame", "miso", "tempeh"] },
  eggs: { label: "Eggs", keywords: ["egg", "eggs"] },
  shellfish: {
    label: "Shellfish",
    keywords: ["shrimp", "crab", "lobster", "clam", "oyster", "mussel", "scallop", "shellfish"],
  },
  alcohol: {
    label: "Alcohol",
    keywords: ["beer", "wine", "whiskey", "vodka", "rum", "alcohol", "liquor", "spirits"],
  },
  pork: {
    label: "Pork",
    keywords: ["pork", "bacon", "ham", "sausage", "salami", "prosciutto"],
  },
} satisfies Record<RestrictionFlag, { label: string; keywords: readonly string[] }>;

export function checkFoodNameRestrictions(
  foodName: string,
  restrictions: readonly RestrictionFlag[],
): RestrictionFlag[] {
  const lower = foodName.toLowerCase();
  return restrictions.filter((flag) =>
    RESTRICTION_FLAGS[flag].keywords.some((kw) => lower.includes(kw)),
  );
}

// --- Feature 7: Recurring Meals ---

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayName = (typeof DAY_NAMES)[number];

// Returns 0=Mon ... 6=Sun matching the dayMask bit positions
export function getTodayDayIndex(): number {
  return (new Date().getDay() + 6) % 7;
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

export const ACTIVITY_LEVEL_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} satisfies Record<ActivityLevel, number>;

export const ACTIVITY_LEVEL_LABELS = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  active: "Very Active",
  very_active: "Extra Active",
} satisfies Record<ActivityLevel, string>;

export const ACTIVITY_LEVEL_DESCRIPTIONS = {
  sedentary: "Little or no exercise, desk job",
  light: "Light exercise 1-3 days/week",
  moderate: "Moderate exercise 3-5 days/week",
  active: "Heavy exercise 6-7 days/week",
  very_active: "Very heavy exercise, physical job, or twice-daily training",
} satisfies Record<ActivityLevel, string>;

export const GOAL_OFFSETS = {
  lose: -500,
  maintain: 0,
  gain: 300,
} satisfies Record<GoalType, number>;

export const GOAL_LABELS = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
} satisfies Record<GoalType, string>;

export const GOAL_DESCRIPTIONS = {
  lose: "500 kcal/day deficit - lose ~0.5 kg/week",
  maintain: "Eat at maintenance - no change",
  gain: "300 kcal/day surplus - gain ~0.3 kg/week",
} satisfies Record<GoalType, string>;

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

// --- Feature 14: Micronutrient Tracking ---

export interface NutritionData {
  // Vitamins
  vitaminA?: number; // mcg RAE
  vitaminB12?: number; // mcg
  vitaminB6?: number; // mg
  vitaminC?: number; // mg
  vitaminD?: number; // mcg
  vitaminE?: number; // mg
  vitaminK?: number; // mcg
  folate?: number; // mcg
  niacin?: number; // mg
  thiamine?: number; // mg
  // Minerals
  calcium?: number; // mg
  iron?: number; // mg
  magnesium?: number; // mg
  potassium?: number; // mg
  sodium?: number; // mg
  zinc?: number; // mg
  copper?: number; // mg
  iodine?: number; // mcg
  phosphorus?: number; // mg
  selenium?: number; // mcg
  // Other
  fiber?: number; // g
  sugar?: number; // g
  saturatedFat?: number; // g
  transFat?: number; // g
  cholesterol?: number; // mg
}

export type NutritionKey = keyof NutritionData;

export const MICRONUTRIENT_LABELS: Record<NutritionKey, string> = {
  vitaminA: "Vitamin A",
  vitaminB12: "Vitamin B12",
  vitaminB6: "Vitamin B6",
  vitaminC: "Vitamin C",
  vitaminD: "Vitamin D",
  vitaminE: "Vitamin E",
  vitaminK: "Vitamin K",
  folate: "Folate",
  niacin: "Niacin",
  thiamine: "Thiamine",
  calcium: "Calcium",
  iron: "Iron",
  magnesium: "Magnesium",
  potassium: "Potassium",
  sodium: "Sodium",
  zinc: "Zinc",
  copper: "Copper",
  iodine: "Iodine",
  phosphorus: "Phosphorus",
  selenium: "Selenium",
  fiber: "Fiber",
  sugar: "Sugar",
  saturatedFat: "Saturated Fat",
  transFat: "Trans Fat",
  cholesterol: "Cholesterol",
};

export const MICRONUTRIENT_UNITS: Record<NutritionKey, string> = {
  vitaminA: "mcg",
  vitaminB12: "mcg",
  vitaminB6: "mg",
  vitaminC: "mg",
  vitaminD: "mcg",
  vitaminE: "mg",
  vitaminK: "mcg",
  folate: "mcg",
  niacin: "mg",
  thiamine: "mg",
  calcium: "mg",
  iron: "mg",
  magnesium: "mg",
  potassium: "mg",
  sodium: "mg",
  zinc: "mg",
  copper: "mg",
  iodine: "mcg",
  phosphorus: "mg",
  selenium: "mcg",
  fiber: "g",
  sugar: "g",
  saturatedFat: "g",
  transFat: "g",
  cholesterol: "mg",
};

// US FDA daily reference values for adults
export const MICRONUTRIENT_RDA: Record<NutritionKey, number> = {
  vitaminA: 900,
  vitaminB12: 2.4,
  vitaminB6: 1.7,
  vitaminC: 90,
  vitaminD: 20,
  vitaminE: 15,
  vitaminK: 120,
  folate: 400,
  niacin: 16,
  thiamine: 1.2,
  calcium: 1300,
  iron: 18,
  magnesium: 420,
  potassium: 4700,
  sodium: 2300,
  zinc: 11,
  copper: 0.9,
  iodine: 150,
  phosphorus: 1250,
  selenium: 55,
  fiber: 28,
  sugar: 50,
  saturatedFat: 20,
  transFat: 2,
  cholesterol: 300,
};

export const MICRONUTRIENT_KEYS: readonly NutritionKey[] = Object.keys(
  MICRONUTRIENT_LABELS,
) as NutritionKey[];

// App initialization state machine - prevents impossible state combinations
export type AppInitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; user: UserProfile }
  | { status: "error"; message: string };

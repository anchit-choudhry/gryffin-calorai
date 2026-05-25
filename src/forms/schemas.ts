import { z } from "zod/v3";
import type { LengthUnit, WeightUnit } from "@/types";

// Food form schema
export const FoodFormSchema = z.object({
  name: z
    .string()
    .min(1, "Food name is required")
    .max(100, "Name must be 100 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]+$/,
      "Name may only contain letters, numbers, spaces, and common punctuation (- ' , . ( ) /)",
    ),
  calories: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative")
    .max(10000, "Cannot exceed 10,000 kcal"),
  servingSize: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(1, "Minimum 1 serving")
    .max(100, "Maximum 100 servings"),
  protein: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative")
    .max(500, "Cannot exceed 500g"),
  carbs: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative")
    .max(500, "Cannot exceed 500g"),
  fat: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative")
    .max(500, "Cannot exceed 500g"),
  mealType: z.enum(["Breakfast", "Lunch", "Snacks", "Dinner"] as const),
});

export type FoodFormValues = z.infer<typeof FoodFormSchema>;

// Body measurement form schema factory
export function makeBodySchema(weightUnit: WeightUnit, lengthUnit: LengthUnit) {
  const maxWeight = weightUnit === "kg" ? 500 : 1100;
  const maxLength = lengthUnit === "in" ? 500 : 1270;
  return z.object({
    weight: z
      .string()
      .min(1, "Weight is required")
      .max(20, "Please enter a valid weight")
      .refine((v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 && n <= maxWeight;
      }, "Please enter a valid weight"),
    bodyFat: z
      .string()
      .max(20, "Please enter a valid body fat")
      .refine((v) => {
        if (!v) return true;
        const n = parseFloat(v);
        return Number.isFinite(n) && n >= 1 && n <= 99;
      }, "Body fat must be between 1 and 99%"),
    waist: z
      .string()
      .max(20, "Please enter a valid waist measurement")
      .refine((v) => {
        if (!v) return true;
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 && n <= maxLength;
      }, "Please enter a valid waist measurement"),
    chest: z
      .string()
      .max(20, "Please enter a valid chest measurement")
      .refine((v) => {
        if (!v) return true;
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 && n <= maxLength;
      }, "Please enter a valid chest measurement"),
    hips: z
      .string()
      .max(20, "Please enter a valid hips measurement")
      .refine((v) => {
        if (!v) return true;
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 && n <= maxLength;
      }, "Please enter a valid hips measurement"),
  });
}

export type BodyFormValues = z.infer<ReturnType<typeof makeBodySchema>>;

// Recipe form schemas
export const IngredientSchema = z.object({
  foodItemId: z.number().int("Must be a whole number").min(1, "Must be a valid food item"),
  foodItemName: z
    .string()
    .max(100, "Name must be 100 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]*$/,
      "Name may only contain letters, numbers, spaces, and common punctuation (- ' , . ( ) /)",
    ),
  calories: z.number().min(0, "Cannot be negative").max(10000, "Cannot exceed 10,000 kcal"),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  quantity: z.number().min(1, "Min 1").max(999, "Max 999"),
  serving: z.number().min(1, "Min 1").max(999, "Max 999"),
});

export const RecipeFormSchema = z.object({
  recipeName: z
    .string()
    .min(1, "Recipe name is required")
    .max(100, "Name must be 100 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]+$/,
      "Name may only contain letters, numbers, spaces, and common punctuation (- ' , . ( ) /)",
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or fewer")
    .regex(/^[\x20-\x7E]+$/, "Description may only contain printable characters"),
  ingredients: z
    .array(IngredientSchema)
    .min(1, "At least one ingredient is required")
    .refine(
      (items) => items.every((item) => item.foodItemId !== 0),
      "All ingredients must be linked to a food item",
    ),
});

export type RecipeFormValues = z.infer<typeof RecipeFormSchema>;

// Water intake form schema
export const WaterSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .int("Amount must be a whole number")
    .min(1, "Amount must be at least 1 ml")
    .max(5000, "Amount cannot exceed 5000 ml"),
});

export type WaterFormValues = z.infer<typeof WaterSchema>;

// Step intake form schema
export const StepSchema = z.object({
  steps: z
    .number({ invalid_type_error: "Steps must be a number" })
    .int("Steps must be a whole number")
    .min(1, "Must be at least 1 step")
    .max(100000, "Cannot exceed 100,000 steps"),
});

export type StepFormValues = z.infer<typeof StepSchema>;

// TDEE profile schema - stores values in display units; conversion happens in the hook
export const TdeeProfileSchema = z.object({
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int("Age must be a whole number")
    .min(13, "Must be at least 13")
    .max(120, "Must be at most 120"),
  sex: z.enum(["male", "female"] as const),
  // stored in display units; hook converts to metric before saving
  heightDisplay: z
    .number({ invalid_type_error: "Height must be a number" })
    .min(1, "Height required")
    .max(10000, "Invalid height"),
  weightDisplay: z
    .number({ invalid_type_error: "Weight must be a number" })
    .min(1, "Weight required")
    .max(10000, "Invalid weight"),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"] as const),
  goal: z.enum(["lose", "maintain", "gain"] as const),
  targetWeightDisplay: z
    .number({ invalid_type_error: "Target weight must be a number" })
    .min(1, "Weight required")
    .max(10000, "Invalid weight")
    .optional(),
});

export type TdeeProfileFormValues = z.infer<typeof TdeeProfileSchema>;

// Activity logging schema
export const ActivitySchema = z.object({
  activityType: z.string().min(1, "Select an activity"),
  durationMin: z
    .number({ invalid_type_error: "Duration must be a number" })
    .int("Duration must be a whole number")
    .min(1, "Must be at least 1 minute")
    .max(1440, "Cannot exceed 1440 minutes"),
});

export type ActivityFormValues = z.infer<typeof ActivitySchema>;

// Diet profile schema (feature 15)
export const DietProfileSchema = z.object({
  preset: z.enum([
    "generic",
    "keto",
    "paleo",
    "vegan",
    "vegetarian",
    "mediterranean",
    "high_protein",
    "low_sodium",
    "low_carb",
  ] as const),
  restrictions: z.array(
    z.enum(["gluten", "dairy", "nuts", "soy", "eggs", "shellfish", "alcohol", "pork"] as const),
  ),
});

export type DietProfileFormValues = z.infer<typeof DietProfileSchema>;

// Recurring meal schema (feature 7)
export const RecurringMealSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]+$/,
      "Name may only contain letters, numbers, spaces, and common punctuation",
    ),
  dayMask: z.number().int().min(1, "Select at least one day").max(127, "Invalid day mask"),
  mealType: z.enum(["Breakfast", "Lunch", "Snacks", "Dinner"] as const),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:MM)"),
  foods: z
    .array(
      z.object({
        name: z.string().min(1),
        calories: z.number().min(0).max(10000),
        servingSize: z.number().min(1).max(100),
        protein: z.number().min(0).max(500),
        carbs: z.number().min(0).max(500),
        fat: z.number().min(0).max(500),
        mealType: z.enum(["Breakfast", "Lunch", "Snacks", "Dinner"] as const),
      }),
    )
    .min(1, "Add at least one food item"),
});

export type RecurringMealFormValues = z.infer<typeof RecurringMealSchema>;

// Reminder schema (feature 17)
export const ReminderSchema = z.object({
  type: z.enum(["log_meal", "drink_water", "weigh_in", "log_steps", "fasting_check"] as const),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:MM)"),
  daysOfWeek: z.number().int().min(1, "Select at least one day").max(127, "Invalid day mask"),
  enabled: z.boolean(),
});

export type ReminderFormValues = z.infer<typeof ReminderSchema>;

// Meal template schema (feature 16)
export const MealTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]+$/,
      "Name may only contain letters, numbers, spaces, and common punctuation",
    ),
});

export type MealTemplateFormValues = z.infer<typeof MealTemplateSchema>;

// Meal plan schema (feature 16)
export const MealPlanSchema = z.object({
  name: z
    .string()
    .min(1, "Plan name is required")
    .max(80, "Name must be 80 characters or fewer")
    .regex(
      /^[\w\s\-',.()/]+$/,
      "Name may only contain letters, numbers, spaces, and common punctuation",
    ),
  days: z
    .array(
      z.object({
        dayIndex: z.number().int().min(0).max(6),
        templateId: z.number().int().min(1).nullable(),
      }),
    )
    .length(7, "A meal plan must have exactly 7 days"),
});

export type MealPlanFormValues = z.infer<typeof MealPlanSchema>;

// Per-table backup row schemas - enforce critical value ranges on imported data

const BackupFoodItemRowSchema = z.object({
  name: z.string().max(100),
  calories: z.number().min(0).max(10_000),
  servingSize: z.number().min(0).max(100),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  dateLogged: z.string().max(10),
  isFavorite: z.boolean(),
  mealType: z.enum(["Breakfast", "Lunch", "Snacks", "Dinner"]).optional(),
});

const BackupIngredientRowSchema = z.object({
  foodItemId: z.number().min(1),
  quantity: z.number().min(0).max(999),
  serving: z.number().min(0).max(999),
});

const BackupRecipeRowSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500),
  ingredients: z.array(BackupIngredientRowSchema).max(50),
  totalCalories: z.number().min(0).max(100_000),
  createdBy: z.number().int().min(1),
  dateCreated: z.string().max(30),
});

const BackupWaterLogRowSchema = z.object({
  amount: z.number().min(1).max(5_000),
  dateLogged: z.string().max(10),
  loggedAt: z.string().max(30),
});

const BackupBodyMeasurementRowSchema = z.object({
  measuredAt: z.string().max(10),
  weight: z.number().min(0).max(500).optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  waist: z.number().min(0).max(500).optional(),
  chest: z.number().min(0).max(500).optional(),
  hips: z.number().min(0).max(500).optional(),
});

const BackupUserAchievementRowSchema = z.object({
  achievementId: z.string().max(100),
  unlockedAt: z.string().max(30),
});

const BackupStepLogRowSchema = z.object({
  steps: z.number().min(0).max(100_000),
  dateLogged: z.string().max(10),
  loggedAt: z.string().max(30),
});

const BackupTdeeProfileRowSchema = z.object({
  age: z.number().min(13).max(120),
  sex: z.enum(["male", "female"]),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(10).max(500),
  targetWeightKg: z.number().min(0).max(500).optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  updatedAt: z.string().max(30),
});

const BackupActivityLogRowSchema = z.object({
  activityType: z.string().max(100),
  durationMin: z.number().min(1).max(1_440),
  caloriesBurned: z.number().min(0).max(5_000),
  dateLogged: z.string().max(10),
  loggedAt: z.string().max(30),
});

const BackupFastingSessionRowSchema = z.object({
  startTime: z.string().max(30),
  endTime: z.string().max(30).nullable(),
  targetHours: z.number().min(0).max(24),
  dateLogged: z.string().max(10),
  completed: z.boolean(),
});

export const BackupTableSchema = z.object({
  foodItems: z.array(BackupFoodItemRowSchema).max(50_000),
  recipes: z.array(BackupRecipeRowSchema).max(1_000),
  waterLogs: z.array(BackupWaterLogRowSchema).max(50_000),
  bodyMeasurements: z.array(BackupBodyMeasurementRowSchema).max(5_000),
  userAchievements: z.array(BackupUserAchievementRowSchema).max(500),
  stepLogs: z.array(BackupStepLogRowSchema).max(50_000),
  tdeeProfile: BackupTdeeProfileRowSchema.nullable(),
  activityLogs: z.array(BackupActivityLogRowSchema).max(50_000),
  fastingSessions: z.array(BackupFastingSessionRowSchema).max(10_000),
});

export const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().max(40),
  userId: z.string().min(1).max(128),
  tables: BackupTableSchema,
});

export type ParsedBackup = z.infer<typeof BackupSchema>;

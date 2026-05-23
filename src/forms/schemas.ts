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

// Backup import schema (structural validation only; value ranges not re-checked)
export const BackupTableSchema = z.object({
  foodItems: z.array(z.record(z.unknown())),
  recipes: z.array(z.record(z.unknown())),
  waterLogs: z.array(z.record(z.unknown())),
  bodyMeasurements: z.array(z.record(z.unknown())),
  userAchievements: z.array(z.record(z.unknown())),
  stepLogs: z.array(z.record(z.unknown())),
  tdeeProfile: z.record(z.unknown()).nullable(),
  activityLogs: z.array(z.record(z.unknown())),
  fastingSessions: z.array(z.record(z.unknown())),
});

export const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  userId: z.string(),
  tables: BackupTableSchema,
});

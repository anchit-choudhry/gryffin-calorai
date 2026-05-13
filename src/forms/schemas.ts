import { z } from "zod/v3";
import type { LengthUnit, WeightUnit } from "@/types";

// Food form schema
export const FoodFormSchema = z.object({
  name: z.string().min(1, "Food name is required").max(100, "Name must be 100 characters or fewer"),
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
  foodItemName: z.string().max(100, "Name must be 100 characters or fewer"),
  calories: z.number().min(0, "Cannot be negative").max(10000, "Cannot exceed 10,000 kcal"),
  quantity: z.number().min(1, "Min 1").max(999, "Max 999"),
  serving: z.number().min(1, "Min 1").max(999, "Max 999"),
});

export const RecipeFormSchema = z.object({
  recipeName: z
    .string()
    .min(1, "Recipe name is required")
    .max(100, "Name must be 100 characters or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or fewer"),
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

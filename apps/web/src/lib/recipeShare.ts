import { strToU8, strFromU8, deflateSync, inflateSync } from "fflate";
import { addFoodItemLog, saveRecipe, type FoodItem, type Recipe } from "@/db/dbService";
import { ISODate, FoodItemId, type UserId } from "@/types";

export const RECIPE_SHARE_SCHEMA_VERSION = 1;

export interface ShareableIngredient {
  name: string;
  quantity: number;
  serving: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface ShareableRecipe {
  v: number;
  name: string;
  description: string;
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  ingredients: ShareableIngredient[];
}

/** Resolves a Recipe's ingredient IDs against allFoodItems and returns a shareable payload. */
export function buildShareableRecipe(
  recipe: Recipe,
  allFoodItems: readonly FoodItem[],
): ShareableRecipe {
  const foodMap = new Map(allFoodItems.map((f) => [f.id, f]));
  const ingredients: ShareableIngredient[] = recipe.ingredients.map((ing) => {
    const food = foodMap.get(ing.foodItemId);
    return {
      name: food?.name ?? "Unknown ingredient",
      quantity: ing.quantity,
      serving: ing.serving,
      calories: food?.calories ?? 0,
      protein: food?.protein,
      carbs: food?.carbs,
      fat: food?.fat,
    };
  });

  return {
    v: RECIPE_SHARE_SCHEMA_VERSION,
    name: recipe.name,
    description: recipe.description,
    totalCalories: recipe.totalCalories,
    totalProtein: recipe.totalProtein,
    totalCarbs: recipe.totalCarbs,
    totalFat: recipe.totalFat,
    ingredients,
  };
}

/** Encodes a ShareableRecipe to a base64url string (fflate deflate compressed). */
export function encodeSharePayload(recipe: ShareableRecipe): string {
  const json = JSON.stringify(recipe);
  const compressed = deflateSync(strToU8(json));
  return btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decodes a base64url string back to a ShareableRecipe. Returns undefined on any error. */
export function decodeSharePayload(encoded: string): ShareableRecipe | undefined {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = strFromU8(inflateSync(bytes));
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "name" in parsed &&
      "totalCalories" in parsed &&
      "ingredients" in parsed
    ) {
      return parsed as ShareableRecipe;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** Builds the full share URL for a recipe. */
export function buildShareUrl(recipe: Recipe, allFoodItems: readonly FoodItem[]): string {
  const payload = buildShareableRecipe(recipe, allFoodItems);
  const encoded = encodeSharePayload(payload);
  const base = window.location.origin + window.location.pathname;
  return `${base}#recipes?share=${encoded}`;
}

/**
 * Imports a shared recipe by creating food items for each ingredient, then creating the recipe.
 * Ingredient food items are created with today's date and captureMethod "template".
 */
export async function importSharedRecipe(
  payload: ShareableRecipe,
  userId: UserId,
): Promise<Recipe> {
  const today = ISODate(new Date().toISOString().slice(0, 10));

  const ingredientIds = await Promise.all(
    payload.ingredients.map((ing) =>
      addFoodItemLog({
        name: ing.name,
        calories: ing.calories,
        servingSize: ing.serving,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        dateLogged: today,
        userId,
        isFavorite: true,
        captureMethod: "template",
      }),
    ),
  );

  const recipe: Recipe = {
    name: payload.name,
    description: payload.description,
    totalCalories: payload.totalCalories,
    totalProtein: payload.totalProtein,
    totalCarbs: payload.totalCarbs,
    totalFat: payload.totalFat,
    ingredients: payload.ingredients.map((ing, i) => ({
      foodItemId: FoodItemId(Number(ingredientIds[i])),
      quantity: ing.quantity,
      serving: ing.serving,
    })),
    createdBy: userId,
    dateCreated: today,
    userId,
  };

  const id = await saveRecipe(recipe);
  return { ...recipe, id };
}

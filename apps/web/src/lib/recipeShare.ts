import { addFoodItemLog, type FoodItem, type Recipe, saveRecipe } from "@/db/dbService";
import { FoodItemId, ISODate, type UserId } from "@/types";

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

async function transformBytes(
  stream: CompressionStream | DecompressionStream,
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const writer = stream.writable.getWriter();
  await writer.write(data);
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

async function deflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return transformBytes(new CompressionStream("deflate-raw"), data);
}

async function inflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return transformBytes(new DecompressionStream("deflate-raw"), data);
}

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

/** Encodes a ShareableRecipe to a base64url string (deflate-raw compressed). */
export async function encodeSharePayload(recipe: ShareableRecipe): Promise<string> {
  const json = JSON.stringify(recipe);
  const compressed = await deflate(new TextEncoder().encode(json));
  return uint8ToBase64url(compressed);
}

/** Decodes a base64url string back to a ShareableRecipe. Returns undefined on any error. */
export async function decodeSharePayload(encoded: string): Promise<ShareableRecipe | undefined> {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decompressed = await inflate(bytes);
    const json = new TextDecoder().decode(decompressed);
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
export async function buildShareUrl(
  recipe: Recipe,
  allFoodItems: readonly FoodItem[],
): Promise<string> {
  const payload = buildShareableRecipe(recipe, allFoodItems);
  const encoded = await encodeSharePayload(payload);
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

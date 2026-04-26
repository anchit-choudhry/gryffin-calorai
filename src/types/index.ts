// Domain-specific branded types to prevent ID mix-ups at compile time
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">;
export type FoodItemId = Brand<number, "FoodItemId">;
export type RecipeId = Brand<number, "RecipeId">;

// Date in ISO format (YYYY-MM-DD)
export type ISODate = Brand<string, "ISODate">;

// Constructor functions with branding
export const UserId = (id: string): UserId => id as UserId;
export const FoodItemId = (id: number): FoodItemId => id as FoodItemId;
export const RecipeId = (id: number): RecipeId => id as RecipeId;
export const ISODate = (date: string): ISODate => date as ISODate;

// Helper to get ISO date for today
export const todayISO = (): ISODate => ISODate(new Date().toISOString().split("T")[0]);

// Type guards
export function isFoodItemId(value: unknown): value is FoodItemId {
  return typeof value === "number" && value > 0;
}

export function isUserId(value: unknown): value is UserId {
  return typeof value === "string" && value.length > 0;
}

export function isRecipeId(value: unknown): value is RecipeId {
  return typeof value === "number" && value > 0;
}

export function isISODate(value: unknown): value is ISODate {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

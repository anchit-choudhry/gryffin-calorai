import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Dexie } from "dexie";
import type { FoodItem } from "../db/dbService";
import { MEAL_TYPES, type MealType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EDITORIAL_INPUT_CLS =
  "border-0 border-b border-rule rounded-none bg-transparent dark:bg-paper font-mono text-sm text-ink " +
  "focus-visible:ring-0 focus-visible:border-persimmon placeholder:text-ink-soft/50 py-1 h-auto";

export interface GroupedMealLog {
  meal: MealType;
  items: FoodItem[];
}

export function groupLogsByMeal(logs: FoodItem[]): GroupedMealLog[] {
  return MEAL_TYPES.map((meal) => ({
    meal,
    items: logs.filter((log) => log.mealType === meal),
  })).filter((group) => group.items.length > 0);
}

const VALID_HASHES = new Set(["#dashboard", "#recipes", "#progress"] as const);
export type ValidHash = "#dashboard" | "#recipes" | "#progress";

export function normalizeHash(raw: string): ValidHash {
  const h = raw.toLowerCase();
  return (VALID_HASHES.has(h as ValidHash) ? h : "#dashboard") as ValidHash;
}

export function mapDbError(error: unknown, fallback: string): string {
  if (error instanceof Dexie.DexieError) {
    if (error.name === "QuotaExceededError")
      return "Storage is full. Please free up space and try again.";
    if (error.name === "ConstraintError") return "A duplicate entry already exists.";
    if (error.name === "DatabaseClosedError") return "Database connection lost. Please reload.";
  }
  return fallback;
}

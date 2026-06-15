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

export const LABEL_MONO_CLS = "font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft";

export const SERIF_TITLE_CLS = "font-serif text-ink font-light tracking-tight lining-nums";

export const ICON_BTN_CLS =
  "flex items-center justify-center size-9 rounded-none hover:bg-paper-muted transition-colors " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-persimmon " +
  "focus-visible:ring-offset-1 active:scale-[0.97]";

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

const VALID_HASHES = new Set(["#dashboard", "#recipes", "#progress", "#settings"] as const);
export type ValidHash = "#dashboard" | "#recipes" | "#progress" | "#settings";

export function normalizeHash(raw: string): ValidHash {
  const h = raw.toLowerCase();
  return (VALID_HASHES.has(h as ValidHash) ? h : "#dashboard") as ValidHash;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Dexie } from "dexie";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

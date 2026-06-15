import type { ISODate, MealType } from "@/types";

/** Parsed row ready for insertion into the food log. */
export interface ImportedFoodEntry {
  name: string;
  calories: number;
  dateLogged: string;
  mealType?: MealType;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export type CsvFormat = "mfp" | "cronometer" | "loseit" | "unknown";

export interface ParseResult {
  entries: ImportedFoodEntry[];
  skippedRows: number;
}

/** Splits a CSV line respecting double-quoted fields with escaped quotes. */
export function splitCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === "," && !insideQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/** Detects CSV format from the header row fields. */
export function detectFormat(headers: string[]): CsvFormat {
  const n = headers.map((h) => h.toLowerCase().trim());
  if (n.includes("meal") && n.includes("calories") && n.includes("date")) return "mfp";
  if (n.some((h) => h.includes("energy (kcal)")) || n.includes("food name")) return "cronometer";
  if (n.includes("type") && n.includes("quantity") && n.includes("unit")) return "loseit";
  return "unknown";
}

/** Type guard that validates YYYY-MM-DD format and calendar validity. */
export function isISODate(s: string): s is ISODate {
  return /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(s) && !isNaN(Date.parse(s));
}

/** Parses a number from a string, returning undefined if falsy or NaN. */
export function parseNum(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

/** Maps meal name strings to the app's MealType union. */
export function normalizeMealType(raw: string | undefined): MealType | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase().trim();
  if (lower === "breakfast") return "Breakfast";
  if (lower === "lunch") return "Lunch";
  if (lower === "dinner" || lower === "supper") return "Dinner";
  if (lower === "snack" || lower === "snacks") return "Snacks";
  return undefined;
}

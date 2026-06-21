import type { ImportedFoodEntry, ParseResult } from "./utils";
import { parseNum, splitCsvRow } from "./utils";

/**
 * Parses a Cronometer food diary CSV export.
 *
 * Expected headers (case-insensitive, may vary by export type):
 * Day, Food Name, Amount, Unit, Energy (kcal), Protein (g), Net Carbs (g),
 * Carbs (g), Fat (g), Sodium (mg), Sugar (g), Fiber (g)
 */
export function parseCronometerCsv(csv: string): ParseResult {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { entries: [], skippedRows: 0 };

  const headers = splitCsvRow(lines[0]!).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.indexOf(name);

  const iDate = idx("day");
  const iName = idx("food name");
  const iEnergy = idx("energy (kcal)");
  const iProtein = idx("protein (g)");
  const iCarbs = idx("carbs (g)");
  const iFat = idx("fat (g)");
  const iSodium = idx("sodium (mg)");
  const iSugar = idx("sugars (g)");
  const iFiber = idx("fiber (g)");

  if (iDate === -1 || iName === -1 || iEnergy === -1) {
    return { entries: [], skippedRows: lines.length - 1 };
  }

  const entries: ImportedFoodEntry[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    const cells = splitCsvRow(line);
    const date = cells[iDate];
    const name = cells[iName];
    const cal = parseNum(cells[iEnergy]);

    if (!date || !name || cal === undefined || !Number.isFinite(cal) || cal <= 0) {
      skippedRows++;
      continue;
    }

    entries.push({
      dateLogged: date,
      name,
      calories: Math.round(cal),
      protein: iProtein !== -1 ? parseNum(cells[iProtein]) : undefined,
      carbs: iCarbs !== -1 ? parseNum(cells[iCarbs]) : undefined,
      fat: iFat !== -1 ? parseNum(cells[iFat]) : undefined,
      sodium: iSodium !== -1 ? parseNum(cells[iSodium]) : undefined,
      sugar: iSugar !== -1 ? parseNum(cells[iSugar]) : undefined,
      fiber: iFiber !== -1 ? parseNum(cells[iFiber]) : undefined,
    });
  }

  return { entries, skippedRows };
}

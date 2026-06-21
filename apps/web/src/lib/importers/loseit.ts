import type { ImportedFoodEntry, ParseResult } from "./utils";
import { normalizeMealType, parseNum, splitCsvRow } from "./utils";

/**
 * Parses a Lose It! food diary CSV export.
 *
 * Expected headers (case-insensitive):
 * Date, Name, Type, Quantity, Unit, Calories, Fat (g), Protein (g),
 * Carbohydrates (g), Cholesterol (mg), Sodium (mg), Sugars (g), Fiber (g)
 */
export function parseLoseItCsv(csv: string): ParseResult {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { entries: [], skippedRows: 0 };

  const headers = splitCsvRow(lines[0]!).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.indexOf(name);

  const iDate = idx("date");
  const iName = idx("name");
  const iType = idx("type");
  const iCal = idx("calories");
  const iProtein = idx("protein (g)");
  const iCarbs = idx("carbohydrates (g)");
  const iFat = idx("fat (g)");
  const iSodium = idx("sodium (mg)");
  const iSugar = idx("sugars (g)");
  const iFiber = idx("fiber (g)");

  if (iDate === -1 || iName === -1 || iCal === -1) {
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
    const cal = parseNum(cells[iCal]);

    if (!date || !name || cal === undefined || !Number.isFinite(cal) || cal <= 0) {
      skippedRows++;
      continue;
    }

    entries.push({
      dateLogged: date,
      name,
      calories: Math.round(cal),
      mealType: iType !== -1 ? normalizeMealType(cells[iType]) : undefined,
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

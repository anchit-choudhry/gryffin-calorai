import { normalizeMealType, parseNum, splitCsvRow } from "./utils";
import type { ImportedFoodEntry, ParseResult } from "./utils";

/**
 * Parses a MyFitnessPal food diary CSV export.
 *
 * Expected headers (case-insensitive):
 * Date, Meal, Calories, Carbohydrates (g), Fat (g), Protein (g), Sodium (mg),
 * Sugar (g), Name
 */
export function parseMfpCsv(csv: string): ParseResult {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { entries: [], skippedRows: 0 };

  const headers = splitCsvRow(lines[0]!).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.indexOf(name);

  const iDate = idx("date");
  const iMeal = idx("meal");
  const iName = idx("name");
  const iCal = idx("calories");
  const iProtein = idx("protein (g)");
  const iCarbs = idx("carbohydrates (g)");
  const iFat = idx("fat (g)");
  const iSodium = idx("sodium (mg)");
  const iSugar = idx("sugar (g)");
  const iFiber = idx("dietary fiber (g)");

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
      mealType: iMeal !== -1 ? normalizeMealType(cells[iMeal]) : undefined,
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

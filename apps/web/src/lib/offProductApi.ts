import type { FoodItem } from "../db/dbService";
import type { ISODate, UserId } from "../types";
import { api, ApiError } from "./apiClient";

/** Shape of the OFF product response from the backend. All nutrient values are per 100g. */
export interface OffProductResponse {
  code: string;
  productName: string | null;
  brands: string | null;
  servingSize: string | null;
  servingSizeG: number | null;
  nutritionGrade: string | null;
  mainCategory: string | null;
  imageSmallUrl: string | null;
  allergensTags: string | null;
  tracesTags: string | null;
  energyKcal100g: number | null;
  energyKj100g: number | null;
  proteins100g: number | null;
  carbohydrates100g: number | null;
  sugars100g: number | null;
  fat100g: number | null;
  saturatedFat100g: number | null;
  transFat100g: number | null;
  monounsaturatedFat100g: number | null;
  polyunsaturatedFat100g: number | null;
  omega3Fat100g: number | null;
  cholesterol100g: number | null;
  fiber100g: number | null;
  sodium100g: number | null;
  calcium100g: number | null;
  iron100g: number | null;
  potassium100g: number | null;
  magnesium100g: number | null;
  phosphorus100g: number | null;
  zinc100g: number | null;
  selenium100g: number | null;
  copper100g: number | null;
  manganese100g: number | null;
  iodine100g: number | null;
  vitaminA100g: number | null;
  vitaminB1100g: number | null;
  vitaminB2100g: number | null;
  vitaminB6100g: number | null;
  vitaminB9100g: number | null;
  vitaminB12100g: number | null;
  vitaminC100g: number | null;
  vitaminD100g: number | null;
  vitaminE100g: number | null;
  vitaminK100g: number | null;
  offLastModifiedAt: string | null;
}

/**
 * Looks up an OFF product by barcode code.
 * Returns null when the barcode is not in the OFF database (404).
 * Re-throws other API errors (network, 401, 500) so callers can surface them.
 */
export async function lookupBarcode(code: string): Promise<OffProductResponse | null> {
  try {
    return await api.get<OffProductResponse>(
      `/api/v1/off-products/barcode/${encodeURIComponent(code)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Searches the OFF database by product name or brand.
 * Returns an empty array on any error (network, 401, 500) so callers can treat it as
 * a best-effort enrichment rather than a required data source.
 */
export async function searchOff(query: string, limit = 6): Promise<OffProductResponse[]> {
  try {
    return await api.get<OffProductResponse[]>(
      `/api/v1/off-products/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  } catch {
    return [];
  }
}

/** Converts a g/100g OFF nutrient value to mg (× 1000). */
const mg = (v: number | null): number | undefined => (v != null ? v * 1000 : undefined);

/** Converts a g/100g OFF nutrient value to mcg (× 1,000,000). */
const mcg = (v: number | null): number | undefined => (v != null ? v * 1_000_000 : undefined);

/**
 * Maps an OFF product response to a FoodItem suitable for pre-filling the food log form.
 *
 * Nutrient unit conversions: OFF data is stored as g/100g.
 * - Minerals and mg-vitamins: × 1000 (g → mg)
 * - Vitamins and minerals stored as mcg: × 1,000,000 (g → mcg)
 * - Macros and fiber/sugar/saturated fat/trans fat: stored as g, used directly
 *
 * The returned item uses dummy values for userId/dateLogged/isFavorite because
 * useFoodForm reads these from the Zustand store on submit, not from initialFood.
 */
export function offProductToFoodItem(p: OffProductResponse): FoodItem {
  return {
    name: p.productName ?? `Product ${p.code}`,
    calories: Math.round(p.energyKcal100g ?? 0),
    servingSize: 1,
    protein: p.proteins100g ?? undefined,
    carbs: p.carbohydrates100g ?? undefined,
    fat: p.fat100g ?? undefined,
    dateLogged: "" as ISODate,
    userId: "" as UserId,
    isFavorite: false,
    nutritionData: {
      fiber: p.fiber100g ?? undefined,
      sugar: p.sugars100g ?? undefined,
      saturatedFat: p.saturatedFat100g ?? undefined,
      transFat: p.transFat100g ?? undefined,
      cholesterol: mg(p.cholesterol100g),
      sodium: mg(p.sodium100g),
      calcium: mg(p.calcium100g),
      iron: mg(p.iron100g),
      potassium: mg(p.potassium100g),
      magnesium: mg(p.magnesium100g),
      phosphorus: mg(p.phosphorus100g),
      zinc: mg(p.zinc100g),
      copper: mg(p.copper100g),
      selenium: mcg(p.selenium100g),
      iodine: mcg(p.iodine100g),
      vitaminA: mcg(p.vitaminA100g),
      thiamine: mg(p.vitaminB1100g),
      vitaminB6: mg(p.vitaminB6100g),
      folate: mcg(p.vitaminB9100g),
      vitaminB12: mcg(p.vitaminB12100g),
      vitaminC: mg(p.vitaminC100g),
      vitaminD: mcg(p.vitaminD100g),
      vitaminE: mg(p.vitaminE100g),
      vitaminK: mcg(p.vitaminK100g),
    },
  };
}

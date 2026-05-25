import { MICRONUTRIENT_RDA, type NutritionKey } from "@/types";
import type { TdeeProfile } from "../db/dbService";

export function getPersonalizedRDA(key: NutritionKey, profile: TdeeProfile): number {
  const { sex, age } = profile;

  if (key === "iron") {
    return sex === "female" && age <= 50 ? 18 : 8;
  }

  if (key === "calcium") {
    if (age >= 71) return 1200;
    if (sex === "female" && age >= 51) return 1200;
    return 1000;
  }

  return MICRONUTRIENT_RDA[key];
}

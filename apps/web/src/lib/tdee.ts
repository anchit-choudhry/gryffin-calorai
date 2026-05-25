import type { ActivityLevel, DietPreset, GoalType } from "@/types";
import { ACTIVITY_LEVEL_FACTORS, DIET_PRESETS, GOAL_OFFSETS } from "@/types";

export function mifflinStJeorBMR(
  sex: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function computeTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_LEVEL_FACTORS[activityLevel]);
}

export function computeCalorieGoal(tdee: number, goal: GoalType): number {
  return Math.max(1200, tdee + GOAL_OFFSETS[goal]);
}

export function computeMacroTargets(
  calorieGoal: number,
  preset: DietPreset,
): { protein: number; carbs: number; fat: number } {
  const { macros } = DIET_PRESETS[preset];
  return {
    protein: Math.round((calorieGoal * macros.protein) / 100 / 4),
    carbs: Math.round((calorieGoal * macros.carbs) / 100 / 4),
    fat: Math.round((calorieGoal * macros.fat) / 100 / 9),
  };
}

// Returns null when target equals current or deficit is zero
export function projectedDateForWeightChange(
  currentKg: number,
  targetKg: number,
  dailyDeficitKcal: number,
): Date | null {
  const diffKg = Math.abs(currentKg - targetKg);
  if (diffKg < 0.01 || Math.abs(dailyDeficitKcal) < 1) return null;
  // 7700 kcal ~ 1 kg of body fat
  const daysNeeded = Math.round((diffKg * 7700) / Math.abs(dailyDeficitKcal));
  const result = new Date();
  result.setDate(result.getDate() + daysNeeded);
  return result;
}

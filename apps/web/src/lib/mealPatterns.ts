import type { FoodItem } from "@/db/dbService";
import type { MealType } from "@/types";
import { shiftISODate, todayISO } from "@/types";

export interface MealPattern {
  name: string;
  mealType: MealType;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize: number;
  count: number;
}

export function getCurrentMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Breakfast";
  if (hour >= 11 && hour < 14) return "Lunch";
  if (hour >= 14 && hour < 17) return "Snacks";
  return "Dinner";
}

export function getMealPatterns(
  foodLogs: FoodItem[],
  windowDays = 14,
  minCount = 3,
): MealPattern[] {
  const cutoff = shiftISODate(todayISO(), -windowDays);

  const tally = new Map<string, { pattern: MealPattern; count: number }>();

  for (const item of foodLogs) {
    if (!item.mealType) continue;
    if (item.dateLogged < cutoff) continue;

    const key = `${item.name.toLowerCase().trim()}|${item.mealType}`;
    const existing = tally.get(key);
    if (existing) {
      existing.count++;
    } else {
      tally.set(key, {
        count: 1,
        pattern: {
          name: item.name,
          mealType: item.mealType,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servingSize: item.servingSize,
          count: 0,
        },
      });
    }
  }

  return Array.from(tally.values())
    .filter((e) => e.count >= minCount)
    .map((e) => ({ ...e.pattern, count: e.count }))
    .sort((a, b) => b.count - a.count);
}

export function getMealSuggestions(
  foodLogs: FoodItem[],
  mealType?: MealType,
  windowDays = 14,
  minCount = 3,
): MealPattern[] {
  const target = mealType ?? getCurrentMealType();
  return getMealPatterns(foodLogs, windowDays, minCount).filter((p) => p.mealType === target);
}

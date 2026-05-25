import { computeStreaks, MEAL_TYPES } from "@/types";
import type { BodyMeasurement, FoodItem, Recipe, WaterLog } from "../db/dbService";

export type AchievementCategory =
  | "streak"
  | "calorie"
  | "hydration"
  | "milestone"
  | "body"
  | "recipe";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streaks
  {
    id: "streak_3",
    title: "Three-Peat",
    description: "Log food 3 days in a row",
    icon: "⚡",
    category: "streak",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Log food 7 days in a row",
    icon: "🔥",
    category: "streak",
  },
  {
    id: "streak_14",
    title: "Fortnight",
    description: "Log food 14 days in a row",
    icon: "💪",
    category: "streak",
  },
  {
    id: "streak_30",
    title: "Monthly Committed",
    description: "Log food 30 days in a row",
    icon: "🏆",
    category: "streak",
  },
  // Calorie Goals
  {
    id: "calorie_goal_hit",
    title: "On Target",
    description: "Stay within 10% of your calorie goal",
    icon: "🎯",
    category: "calorie",
  },
  {
    id: "full_day",
    title: "Full Day",
    description: "Log all 4 meal types in one day",
    icon: "🍽️",
    category: "calorie",
  },
  {
    id: "calorie_goal_3_days",
    title: "Triple Crown",
    description: "Hit your calorie goal 3 days in a row",
    icon: "👑",
    category: "calorie",
  },
  // Hydration
  {
    id: "water_first",
    title: "First Sip",
    description: "Log water for the first time",
    icon: "💧",
    category: "hydration",
  },
  {
    id: "water_goal_hit",
    title: "Hydration Hero",
    description: "Hit your daily water goal",
    icon: "🌊",
    category: "hydration",
  },
  {
    id: "water_streak_3",
    title: "Water Warrior",
    description: "Hit your water goal 3 days in a row",
    icon: "🏄",
    category: "hydration",
  },
  // Milestones
  {
    id: "log_1",
    title: "First Bite",
    description: "Log your first food entry",
    icon: "🌱",
    category: "milestone",
  },
  {
    id: "log_10",
    title: "Getting Started",
    description: "Log 10 food entries",
    icon: "📝",
    category: "milestone",
  },
  {
    id: "log_50",
    title: "Dedicated",
    description: "Log 50 food entries",
    icon: "📊",
    category: "milestone",
  },
  {
    id: "log_100",
    title: "Centurion",
    description: "Log 100 food entries",
    icon: "💯",
    category: "milestone",
  },
  // Body Tracking
  {
    id: "body_first",
    title: "Body Check",
    description: "Log your first body measurement",
    icon: "📏",
    category: "body",
  },
  {
    id: "body_5",
    title: "Consistent",
    description: "Log 5 body measurements",
    icon: "📈",
    category: "body",
  },
  {
    id: "body_10",
    title: "Check-In Pro",
    description: "Log 10 body measurements",
    icon: "🔬",
    category: "body",
  },
  // Recipes
  {
    id: "recipe_first",
    title: "Chef in Training",
    description: "Create your first recipe",
    icon: "👨‍🍳",
    category: "recipe",
  },
  {
    id: "recipe_5",
    title: "Recipe Book",
    description: "Create 5 recipes",
    icon: "📖",
    category: "recipe",
  },
];

export interface EvaluationParams {
  allFoodLogs: FoodItem[];
  allWaterLogs: WaterLog[];
  bodyMeasurements: BodyMeasurement[];
  recipes: Recipe[];
  calorieGoal: number;
  waterGoalMl: number;
}

export function evaluateAchievements(
  params: EvaluationParams,
  alreadyUnlocked: Set<string>,
): string[] {
  const { allFoodLogs, allWaterLogs, bodyMeasurements, recipes, calorieGoal, waterGoalMl } = params;

  const earned: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (!alreadyUnlocked.has(id) && condition) earned.push(id);
  };

  // --- Streak ---
  const uniqueFoodDates = [...new Set(allFoodLogs.map((l) => l.dateLogged))];
  const { longestStreak: foodLongest } = computeStreaks(uniqueFoodDates);
  check("streak_3", foodLongest >= 3);
  check("streak_7", foodLongest >= 7);
  check("streak_14", foodLongest >= 14);
  check("streak_30", foodLongest >= 30);

  // --- Calorie Goals ---
  const calByDate = new Map<string, { total: number; mealTypes: Set<string> }>();
  for (const log of allFoodLogs) {
    const d = calByDate.get(log.dateLogged) ?? { total: 0, mealTypes: new Set() };
    d.total += log.calories;
    if (log.mealType) d.mealTypes.add(log.mealType);
    calByDate.set(log.dateLogged, d);
  }

  const isNearGoal = (total: number) => total >= calorieGoal * 0.9 && total <= calorieGoal * 1.1;

  const goalHitDays = [...calByDate.entries()]
    .filter(([, d]) => isNearGoal(d.total))
    .map(([date]) => date);
  check("calorie_goal_hit", goalHitDays.length >= 1);

  const fullDayExists = [...calByDate.values()].some((d) =>
    MEAL_TYPES.every((mt) => d.mealTypes.has(mt)),
  );
  check("full_day", fullDayExists);

  const sortedGoalDates = [...goalHitDays].sort();
  const { longestStreak: goalLongest } = computeStreaks(sortedGoalDates);
  check("calorie_goal_3_days", goalLongest >= 3);

  // --- Hydration ---
  check("water_first", allWaterLogs.length >= 1);

  const waterByDate = new Map<string, number>();
  for (const log of allWaterLogs) {
    waterByDate.set(log.dateLogged, (waterByDate.get(log.dateLogged) ?? 0) + log.amount);
  }
  const waterGoalDates = [...waterByDate.entries()]
    .filter(([, total]) => total >= waterGoalMl)
    .map(([date]) => date);
  check("water_goal_hit", waterGoalDates.length >= 1);

  const { longestStreak: waterLongest } = computeStreaks([...waterGoalDates].sort());
  check("water_streak_3", waterLongest >= 3);

  // --- Milestones ---
  check("log_1", allFoodLogs.length >= 1);
  check("log_10", allFoodLogs.length >= 10);
  check("log_50", allFoodLogs.length >= 50);
  check("log_100", allFoodLogs.length >= 100);

  // --- Body Tracking ---
  check("body_first", bodyMeasurements.length >= 1);
  check("body_5", bodyMeasurements.length >= 5);
  check("body_10", bodyMeasurements.length >= 10);

  // --- Recipes ---
  check("recipe_first", recipes.length >= 1);
  check("recipe_5", recipes.length >= 5);

  return earned;
}

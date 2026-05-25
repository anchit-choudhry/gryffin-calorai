import { describe, expect, it } from "vitest";
import type { EvaluationParams } from "./achievements";
import { evaluateAchievements } from "./achievements";
import type { BodyMeasurement, FoodItem, Recipe, WaterLog } from "../db/dbService";
import type { BodyMeasurementId, FoodItemId, RecipeId, UserId } from "@/types";
import { ISODate as makeISODate } from "../types";

const makeFood = (
  overrides: Partial<Omit<FoodItem, "dateLogged">> & { dateLogged?: string } = {},
): FoodItem => {
  const { dateLogged, ...rest } = overrides;
  return {
    name: "Test Food",
    calories: 500,
    servingSize: 1,
    protein: 20,
    carbs: 50,
    fat: 10,
    dateLogged: makeISODate(dateLogged ?? "2026-05-12"),
    userId: "user123" as UserId,
    isFavorite: false,
    mealType: "Breakfast",
    ...(rest as Partial<FoodItem>),
  };
};

const makeWater = (
  overrides: Partial<Omit<WaterLog, "dateLogged">> & { dateLogged?: string } = {},
): WaterLog => {
  const { dateLogged, ...rest } = overrides;
  return {
    userId: "user123" as UserId,
    amount: 500,
    dateLogged: makeISODate(dateLogged ?? "2026-05-12"),
    loggedAt: new Date().toISOString(),
    ...(rest as Partial<WaterLog>),
  };
};

const makeBodyMeasurement = (
  overrides: Partial<Omit<BodyMeasurement, "measuredAt">> & { measuredAt?: string } = {},
): BodyMeasurement => {
  const { measuredAt, ...rest } = overrides;
  return {
    userId: "user123" as UserId,
    measuredAt: makeISODate(measuredAt ?? "2026-05-12"),
    weight: 70,
    ...(rest as Partial<BodyMeasurement>),
  };
};

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  name: "Test Recipe",
  description: "Test",
  ingredients: [],
  totalCalories: 1000,
  createdBy: "user123" as UserId,
  dateCreated: new Date().toISOString(),
  userId: "user123" as UserId,
  ...overrides,
});

const baseParams = (overrides: Partial<EvaluationParams> = {}): EvaluationParams => ({
  allFoodLogs: [],
  allWaterLogs: [],
  bodyMeasurements: [],
  recipes: [],
  calorieGoal: 2000,
  waterGoalMl: 2000,
  ...overrides,
});

describe("evaluateAchievements", () => {
  describe("empty state", () => {
    it("returns no achievements for empty data", () => {
      const earned = evaluateAchievements(baseParams(), new Set());
      expect(earned).toStrictEqual([]);
    });

    it("does not re-unlock already unlocked achievements", () => {
      const params = baseParams({
        allFoodLogs: [makeFood()],
      });
      const alreadyUnlocked = new Set(["log_1"]);
      const earned = evaluateAchievements(params, alreadyUnlocked);
      expect(earned).not.toContain("log_1");
    });
  });

  describe("milestone achievements", () => {
    it("fires log_1 with exactly 1 food log", () => {
      const params = baseParams({
        allFoodLogs: [makeFood()],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("log_1");
    });

    it("does not fire log_1 with 0 logs", () => {
      const params = baseParams({
        allFoodLogs: [],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("log_1");
    });

    it("fires log_10 with exactly 10 logs", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeFood({ name: `Food ${i}`, id: (i + 1) as FoodItemId }),
      );
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("log_10");
    });

    it("does not fire log_10 with 9 logs", () => {
      const logs = Array.from({ length: 9 }, (_, i) =>
        makeFood({ name: `Food ${i}`, id: (i + 1) as FoodItemId }),
      );
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("log_10");
    });

    it("fires log_50 and log_100 at appropriate thresholds", () => {
      const logs50 = Array.from({ length: 50 }, (_, i) =>
        makeFood({ name: `Food ${i}`, id: (i + 1) as FoodItemId }),
      );
      const params = baseParams({ allFoodLogs: logs50 });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("log_50");
      expect(earned).not.toContain("log_100");

      const logs100 = Array.from({ length: 100 }, (_, i) =>
        makeFood({ name: `Food ${i}`, id: (i + 1) as FoodItemId }),
      );
      const params100 = baseParams({ allFoodLogs: logs100 });
      const earned100 = evaluateAchievements(params100, new Set());
      expect(earned100).toContain("log_100");
    });
  });

  describe("food streaks", () => {
    it("fires streak_3 for 3-day consecutive streak", () => {
      const logs = [
        makeFood({ dateLogged: "2026-05-10" }),
        makeFood({ dateLogged: "2026-05-11", name: "Food2" }),
        makeFood({ dateLogged: "2026-05-12", name: "Food3" }),
      ];
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("streak_3");
    });

    it("does not fire streak_3 with only 2 consecutive days", () => {
      const logs = [
        makeFood({ dateLogged: "2026-05-11" }),
        makeFood({ dateLogged: "2026-05-12", name: "Food2" }),
      ];
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("streak_3");
    });

    it("does not fire streak_7 with only a 3-day streak", () => {
      const logs = [
        makeFood({ dateLogged: "2026-05-10" }),
        makeFood({ dateLogged: "2026-05-11", name: "Food2" }),
        makeFood({ dateLogged: "2026-05-12", name: "Food3" }),
      ];
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("streak_7");
    });

    it("fires streak_7 for 7-day consecutive streak", () => {
      // 7-day streak: 2026-05-06 through 2026-05-12
      const dates = [
        "2026-05-06",
        "2026-05-07",
        "2026-05-08",
        "2026-05-09",
        "2026-05-10",
        "2026-05-11",
        "2026-05-12",
      ];
      const logs = dates.map((date, i) =>
        makeFood({
          dateLogged: date,
          name: `Food ${i}`,
          id: (i + 1) as FoodItemId,
        }),
      );
      const params = baseParams({ allFoodLogs: logs });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("streak_7");
    });

    it("fires streak_14 and streak_30 at appropriate streak lengths", () => {
      // 14-day streak: 2026-04-29 through 2026-05-12
      const dates14 = [
        "2026-04-29",
        "2026-04-30",
        "2026-05-01",
        "2026-05-02",
        "2026-05-03",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
        "2026-05-07",
        "2026-05-08",
        "2026-05-09",
        "2026-05-10",
        "2026-05-11",
        "2026-05-12",
      ];
      const logs14 = dates14.map((date, i) =>
        makeFood({
          dateLogged: date,
          name: `Food ${i}`,
          id: (i + 1) as FoodItemId,
        }),
      );
      const params = baseParams({ allFoodLogs: logs14 });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("streak_14");
      expect(earned).not.toContain("streak_30");

      // 30-day streak: 2026-04-13 through 2026-05-12
      const dates30 = [
        "2026-04-13",
        "2026-04-14",
        "2026-04-15",
        "2026-04-16",
        "2026-04-17",
        "2026-04-18",
        "2026-04-19",
        "2026-04-20",
        "2026-04-21",
        "2026-04-22",
        "2026-04-23",
        "2026-04-24",
        "2026-04-25",
        "2026-04-26",
        "2026-04-27",
        "2026-04-28",
        "2026-04-29",
        "2026-04-30",
        "2026-05-01",
        "2026-05-02",
        "2026-05-03",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
        "2026-05-07",
        "2026-05-08",
        "2026-05-09",
        "2026-05-10",
        "2026-05-11",
        "2026-05-12",
      ];
      const logs30 = dates30.map((date, i) =>
        makeFood({
          dateLogged: date,
          name: `Food ${i}`,
          id: (i + 1) as FoodItemId,
        }),
      );
      const params30 = baseParams({ allFoodLogs: logs30 });
      const earned30 = evaluateAchievements(params30, new Set());
      expect(earned30).toContain("streak_30");
    });
  });

  describe("calorie goal achievements", () => {
    it("fires calorie_goal_hit when a single day is within 10% of goal", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-12", calories: 2000 }), // exactly at goal
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("calorie_goal_hit");
    });

    it("fires calorie_goal_hit at 90% of goal", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 1800 })],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("calorie_goal_hit");
    });

    it("fires calorie_goal_hit at 110% of goal", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 2200 })],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("calorie_goal_hit");
    });

    it("does not fire calorie_goal_hit below 90% of goal", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 1799 })],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("calorie_goal_hit");
    });

    it("does not fire calorie_goal_hit above 110% of goal", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 2201 })],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("calorie_goal_hit");
    });

    it("does not fire calorie_goal_hit when all days are under 90%", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-10", calories: 1000 }),
          makeFood({ dateLogged: "2026-05-11", calories: 1500, name: "Food2" }),
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("calorie_goal_hit");
    });

    it("aggregates multiple logs per day for calorie calculation", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-12", calories: 1000 }),
          makeFood({ dateLogged: "2026-05-12", calories: 1000, name: "Food2", mealType: "Lunch" }),
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("calorie_goal_hit");
    });
  });

  describe("full day achievement", () => {
    it("fires full_day when all 4 meal types logged on same day", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-12", mealType: "Breakfast" }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Lunch",
            name: "Lunch",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Snacks",
            name: "Snacks",
            id: 3 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Dinner",
            name: "Dinner",
            id: 4 as FoodItemId,
          }),
        ],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("full_day");
    });

    it("does not fire full_day with only 3 meal types", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-12", mealType: "Breakfast" }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Lunch",
            name: "Lunch",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Snacks",
            name: "Snacks",
            id: 3 as FoodItemId,
          }),
        ],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("full_day");
    });

    it("fires full_day for any day that has all 4 meal types, not just first day", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-11", mealType: "Breakfast" }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Breakfast",
            name: "Food2",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Lunch",
            name: "Food3",
            id: 3 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Snacks",
            name: "Food4",
            id: 4 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            mealType: "Dinner",
            name: "Food5",
            id: 5 as FoodItemId,
          }),
        ],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("full_day");
    });
  });

  describe("calorie goal 3-day streak", () => {
    it("fires calorie_goal_3_days for 3 consecutive goal-hit days", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-10", calories: 2000 }),
          makeFood({
            dateLogged: "2026-05-11",
            calories: 2000,
            name: "Food2",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            calories: 2000,
            name: "Food3",
            id: 3 as FoodItemId,
          }),
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("calorie_goal_3_days");
    });

    it("does not fire calorie_goal_3_days with only 2 consecutive goal-hit days", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-11", calories: 2000 }),
          makeFood({
            dateLogged: "2026-05-12",
            calories: 2000,
            name: "Food2",
            id: 2 as FoodItemId,
          }),
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("calorie_goal_3_days");
    });

    it("does not fire with non-consecutive goal-hit days", () => {
      const params = baseParams({
        allFoodLogs: [
          makeFood({ dateLogged: "2026-05-10", calories: 2000 }),
          makeFood({
            dateLogged: "2026-05-11",
            calories: 1000,
            name: "Food2",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            calories: 2000,
            name: "Food3",
            id: 3 as FoodItemId,
          }),
        ],
        calorieGoal: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("calorie_goal_3_days");
    });
  });

  describe("hydration achievements", () => {
    it("fires water_first with at least 1 water log", () => {
      const params = baseParams({
        allWaterLogs: [makeWater()],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("water_first");
    });

    it("does not fire water_first with no water logs", () => {
      const params = baseParams({ allWaterLogs: [] });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("water_first");
    });

    it("fires water_goal_hit when a day's total meets waterGoalMl", () => {
      const params = baseParams({
        allWaterLogs: [makeWater({ dateLogged: "2026-05-12", amount: 2000 })],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("water_goal_hit");
    });

    it("fires water_goal_hit when a day's total exceeds waterGoalMl", () => {
      const params = baseParams({
        allWaterLogs: [makeWater({ dateLogged: "2026-05-12", amount: 2500 })],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("water_goal_hit");
    });

    it("does not fire water_goal_hit when a day's total is below waterGoalMl", () => {
      const params = baseParams({
        allWaterLogs: [makeWater({ dateLogged: "2026-05-12", amount: 1999 })],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("water_goal_hit");
    });

    it("aggregates multiple water logs per day for goal calculation", () => {
      const params = baseParams({
        allWaterLogs: [
          makeWater({ dateLogged: "2026-05-12", amount: 1000 }),
          makeWater({
            dateLogged: "2026-05-12",
            amount: 1000,
            loggedAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        ],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("water_goal_hit");
    });

    it("fires water_streak_3 for 3 consecutive water goal-hit days", () => {
      const params = baseParams({
        allWaterLogs: [
          makeWater({ dateLogged: "2026-05-10", amount: 2000 }),
          makeWater({
            dateLogged: "2026-05-11",
            amount: 2000,
            loggedAt: new Date(Date.now() + 3600000).toISOString(),
          }),
          makeWater({
            dateLogged: "2026-05-12",
            amount: 2000,
            loggedAt: new Date(Date.now() + 7200000).toISOString(),
          }),
        ],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("water_streak_3");
    });

    it("does not fire water_streak_3 with only 2 consecutive goal-hit days", () => {
      const params = baseParams({
        allWaterLogs: [
          makeWater({ dateLogged: "2026-05-11", amount: 2000 }),
          makeWater({
            dateLogged: "2026-05-12",
            amount: 2000,
            loggedAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        ],
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("water_streak_3");
    });
  });

  describe("body measurement achievements", () => {
    it("fires body_first with at least 1 measurement", () => {
      const params = baseParams({
        bodyMeasurements: [makeBodyMeasurement()],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("body_first");
    });

    it("does not fire body_first with no measurements", () => {
      const params = baseParams({ bodyMeasurements: [] });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("body_first");
    });

    it("fires body_5 with exactly 5 measurements", () => {
      const measurements = Array.from({ length: 5 }, (_, i) =>
        makeBodyMeasurement({
          measuredAt: `2026-05-${String(8 + i).padStart(2, "0")}`,
          id: (i + 1) as BodyMeasurementId,
        }),
      );
      const params = baseParams({ bodyMeasurements: measurements });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("body_5");
    });

    it("does not fire body_5 with 4 measurements", () => {
      const measurements = Array.from({ length: 4 }, (_, i) =>
        makeBodyMeasurement({
          measuredAt: `2026-05-${String(8 + i).padStart(2, "0")}`,
          id: (i + 1) as BodyMeasurementId,
        }),
      );
      const params = baseParams({ bodyMeasurements: measurements });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("body_5");
    });

    it("fires body_10 with 10 measurements", () => {
      const measurements = Array.from({ length: 10 }, (_, i) =>
        makeBodyMeasurement({
          measuredAt: `2026-05-${String(3 + i).padStart(2, "0")}`,
          id: (i + 1) as BodyMeasurementId,
        }),
      );
      const params = baseParams({ bodyMeasurements: measurements });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("body_10");
    });
  });

  describe("recipe achievements", () => {
    it("fires recipe_first with at least 1 recipe", () => {
      const params = baseParams({
        recipes: [makeRecipe()],
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("recipe_first");
    });

    it("does not fire recipe_first with no recipes", () => {
      const params = baseParams({ recipes: [] });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("recipe_first");
    });

    it("fires recipe_5 with exactly 5 recipes", () => {
      const recipes = Array.from({ length: 5 }, (_, i) =>
        makeRecipe({ name: `Recipe ${i}`, id: (i + 1) as RecipeId }),
      );
      const params = baseParams({ recipes });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("recipe_5");
    });

    it("does not fire recipe_5 with 4 recipes", () => {
      const recipes = Array.from({ length: 4 }, (_, i) =>
        makeRecipe({ name: `Recipe ${i}`, id: (i + 1) as RecipeId }),
      );
      const params = baseParams({ recipes });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).not.toContain("recipe_5");
    });
  });

  describe("unlocked achievement exclusion", () => {
    it("excludes multiple already-unlocked achievements", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 2000 })],
        calorieGoal: 2000,
      });
      const alreadyUnlocked = new Set(["calorie_goal_hit", "log_1"]);
      const earned = evaluateAchievements(params, alreadyUnlocked);
      expect(earned).not.toContain("calorie_goal_hit");
      expect(earned).not.toContain("log_1");
    });

    it("still includes newly earned achievements not in alreadyUnlocked", () => {
      const params = baseParams({
        allFoodLogs: [makeFood({ dateLogged: "2026-05-12", calories: 2000 })],
        calorieGoal: 2000,
      });
      const alreadyUnlocked = new Set(["log_1"]);
      const earned = evaluateAchievements(params, alreadyUnlocked);
      expect(earned).toContain("calorie_goal_hit");
    });
  });

  describe("combined scenarios", () => {
    it("fires multiple achievements in a single evaluation", () => {
      const params = baseParams({
        allFoodLogs: [
          // Full day on 2026-05-10 with 500 cal each = 2000 total
          makeFood({ dateLogged: "2026-05-10", calories: 500, mealType: "Breakfast" }),
          makeFood({
            dateLogged: "2026-05-10",
            calories: 500,
            mealType: "Lunch",
            name: "Lunch",
            id: 2 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-10",
            calories: 500,
            mealType: "Snacks",
            name: "Snacks",
            id: 3 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-10",
            calories: 500,
            mealType: "Dinner",
            name: "Dinner",
            id: 4 as FoodItemId,
          }),
          // 3-day streak: 2026-05-10, 2026-05-11, 2026-05-12 (within calorie goal)
          makeFood({
            dateLogged: "2026-05-11",
            calories: 2000,
            name: "Food5",
            id: 5 as FoodItemId,
          }),
          makeFood({
            dateLogged: "2026-05-12",
            calories: 2000,
            name: "Food6",
            id: 6 as FoodItemId,
          }),
        ],
        allWaterLogs: [
          makeWater({ dateLogged: "2026-05-10", amount: 2000 }),
          makeWater({
            dateLogged: "2026-05-11",
            amount: 2000,
            loggedAt: new Date(Date.now() + 3600000).toISOString(),
          }),
          makeWater({
            dateLogged: "2026-05-12",
            amount: 2000,
            loggedAt: new Date(Date.now() + 7200000).toISOString(),
          }),
        ],
        bodyMeasurements: [makeBodyMeasurement()],
        recipes: [makeRecipe()],
        calorieGoal: 2000,
        waterGoalMl: 2000,
      });
      const earned = evaluateAchievements(params, new Set());
      expect(earned).toContain("log_1");
      expect(earned).toContain("full_day");
      expect(earned).toContain("calorie_goal_hit");
      expect(earned).toContain("calorie_goal_3_days");
      expect(earned).toContain("streak_3");
      expect(earned).toContain("water_first");
      expect(earned).toContain("water_goal_hit");
      expect(earned).toContain("water_streak_3");
      expect(earned).toContain("body_first");
      expect(earned).toContain("recipe_first");
    });
  });
});

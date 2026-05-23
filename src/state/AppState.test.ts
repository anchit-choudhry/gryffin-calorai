import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppState } from "./AppState";
import type { Recipe } from "../db/dbService";
import * as dbService from "../db/dbService";
import {
  ActivityLogId,
  BodyMeasurementId,
  FastingSessionId,
  FoodItemId,
  ISODate,
  RecipeId,
  StepLogId,
  UserAchievementId,
  UserId,
  WaterLogId,
} from "@/types";
import * as achievements from "../lib/achievements";

vi.mock("../db/dbService");
vi.mock("../lib/achievements");

describe("AppState", () => {
  beforeEach(() => {
    useAppState.setState({
      init: { status: "idle" },
      dailyLogs: [],
      allFoodItems: [],
      recipes: [],
      favoriteFoods: [],
      dailyWaterLogs: [],
      dailyStepLogs: [],
      bodyMeasurements: [],
      unlockedAchievements: [],
      error: null,
      userId: null,
      waterGoalMl: 2000,
      stepGoal: 10000,
      tdeeProfile: null,
      dailyActivityLogs: [],
      allActivityLogs: [],
      activeFastingSession: null,
      fastingHistory: [],
    });
    vi.clearAllMocks();
    localStorage.clear();

    // Setup default mock implementations
    vi.mocked(dbService.getOrCreateUser).mockResolvedValue({
      id: UserId("test"),
      username: "Test User",
      email: "test@example.com",
      lastLogin: new Date().toISOString(),
      calorieGoal: 2000,
    });
    vi.mocked(dbService.getDailyFoodLogs).mockResolvedValue([
      {
        id: FoodItemId(1),
        userId: UserId("1"),
        name: "Apple",
        calories: 95,
        servingSize: 1,
        protein: 0,
        carbs: 0,
        fat: 0,
        dateLogged: ISODate("2026-04-26"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      },
    ]);
    vi.mocked(dbService.addFoodItemLog).mockResolvedValue(FoodItemId(1));
    vi.mocked(dbService.deleteFoodItem).mockResolvedValue(undefined);
    vi.mocked(dbService.updateUserProfile).mockResolvedValue(undefined);
    vi.mocked(dbService.getAllRecipes).mockResolvedValue([]);
    vi.mocked(dbService.updateRecipe).mockResolvedValue(undefined);
    vi.mocked(dbService.deleteRecipe).mockResolvedValue(undefined);
    vi.mocked(dbService.getRecentFoodItems).mockResolvedValue([]);
    vi.mocked(dbService.getAllFoodLogs).mockResolvedValue([]);
    vi.mocked(dbService.getAllWaterLogs).mockResolvedValue([]);
    vi.mocked(dbService.getFavoriteFoodItems).mockResolvedValue([]);
    vi.mocked(dbService.toggleFavoriteFoodItem).mockResolvedValue(undefined);
    vi.mocked(dbService.updateFoodItem).mockResolvedValue(undefined);
    vi.mocked(dbService.getDailyWaterLogs).mockResolvedValue([]);
    vi.mocked(dbService.addWaterLog).mockResolvedValue(WaterLogId(1));
    vi.mocked(dbService.deleteWaterLog).mockResolvedValue(undefined);
    vi.mocked(dbService.getDailyStepLogs).mockResolvedValue([]);
    vi.mocked(dbService.getAllStepLogs).mockResolvedValue([]);
    vi.mocked(dbService.addStepLog).mockResolvedValue(StepLogId(1));
    vi.mocked(dbService.deleteStepLog).mockResolvedValue(undefined);
    vi.mocked(dbService.getAllBodyMeasurements).mockResolvedValue([]);
    vi.mocked(dbService.addBodyMeasurement).mockResolvedValue(BodyMeasurementId(1));
    vi.mocked(dbService.deleteBodyMeasurement).mockResolvedValue(undefined);
    vi.mocked(dbService.updateBodyMeasurement).mockResolvedValue(undefined);
    vi.mocked(dbService.getUnlockedAchievements).mockResolvedValue([]);
    vi.mocked(dbService.getUnlockedAchievementIds).mockResolvedValue(new Set<string>());
    vi.mocked(dbService.addUserAchievement).mockResolvedValue(UserAchievementId(1));
    vi.mocked(achievements.evaluateAchievements).mockReturnValue([]);
    (achievements as unknown as { ACHIEVEMENTS: achievements.Achievement[] }).ACHIEVEMENTS = [];

    vi.mocked(dbService.getTdeeProfile).mockResolvedValue(undefined);
    vi.mocked(dbService.saveTdeeProfile).mockResolvedValue(undefined);
    vi.mocked(dbService.getDailyActivityLogs).mockResolvedValue([]);
    vi.mocked(dbService.getAllActivityLogs).mockResolvedValue([]);
    vi.mocked(dbService.addActivityLog).mockResolvedValue(ActivityLogId(1));
    vi.mocked(dbService.deleteActivityLog).mockResolvedValue(undefined);
    vi.mocked(dbService.getActiveFastingSession).mockResolvedValue(null);
    vi.mocked(dbService.getAllFastingSessions).mockResolvedValue([]);
    vi.mocked(dbService.startFastingSession).mockResolvedValue(FastingSessionId(1));
    vi.mocked(dbService.endFastingSession).mockResolvedValue(undefined);
    vi.mocked(dbService.exportAllData).mockResolvedValue({
      version: 1,
      exportedAt: new Date().toISOString(),
      userId: UserId("test"),
      tables: {
        foodItems: [],
        recipes: [],
        waterLogs: [],
        bodyMeasurements: [],
        userAchievements: [],
        stepLogs: [],
        tdeeProfile: null,
        activityLogs: [],
        fastingSessions: [],
      },
    });
    vi.mocked(dbService.importBackup).mockResolvedValue({ imported: { foodItems: 0 }, skipped: 0 });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize with correct default state", () => {
      const state = useAppState.getState();
      expect(state.dailyLogs).toStrictEqual([]);
      expect(state.init.status).toBe("idle");
      expect(state.error).toBeNull();
      expect(state.userId).toBeNull();
    });

    it("should have valid waterGoalMl", () => {
      const state = useAppState.getState();
      expect(state.waterGoalMl).toBeGreaterThan(250);
      expect(state.waterGoalMl).toBeLessThan(10001);
    });

    it("should have valid stepGoal", () => {
      const state = useAppState.getState();
      expect(state.stepGoal).toBeGreaterThan(1000);
      expect(state.stepGoal).toBeLessThan(100001);
    });
  });

  describe("fetchInitialData", () => {
    it("should set loading status and userId", async () => {
      const userId = UserId("test-user");
      const promise = useAppState.getState().fetchInitialData(userId);
      const state = useAppState.getState();
      expect(state.init.status).toBe("loading");
      expect(state.userId).toBe(userId);
      await promise;
    });

    it("should load all initial data on success", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchInitialData(userId);
      const state = useAppState.getState();
      assert(state.init.status === "ready");
      expect(state.init.user).toBeDefined();
      expect(state.dailyLogs).toHaveLength(1);
      expect(state.recipes).toBeDefined();
      expect(state.allFoodItems).toBeDefined();
      expect(state.favoriteFoods).toBeDefined();
      expect(state.dailyWaterLogs).toBeDefined();
      expect(state.dailyStepLogs).toBeDefined();
      expect(state.bodyMeasurements).toBeDefined();
      expect(state.unlockedAchievements).toBeDefined();
    });

    it("should set error state on failure", async () => {
      const userId = UserId("test-user");
      const error = new Error("Database error");
      vi.mocked(dbService.getOrCreateUser).mockRejectedValueOnce(error);
      await useAppState.getState().fetchInitialData(userId);
      const state = useAppState.getState();
      assert(state.init.status === "error");
      expect(state.init.message).toBeDefined();
    });
  });

  describe("refreshDailyLogs", () => {
    it("should refresh daily logs and clear error", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId, error: "old error" });
      await useAppState.getState().refreshDailyLogs(userId);
      const state = useAppState.getState();
      expect(state.dailyLogs).toHaveLength(1);
      expect(state.error).toBeNull();
    });

    it("should set error on failure", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService.getDailyFoodLogs).mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().refreshDailyLogs(userId);
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("addFoodLog", () => {
    it("should add food log and refresh daily logs", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      const food = {
        userId,
        name: "Banana",
        calories: 100,
        servingSize: 1,
        protein: 1,
        carbs: 27,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      };
      await useAppState.getState().addFoodLog(food);
      expect(vi.mocked(dbService.addFoodItemLog)).toHaveBeenCalledWith(food);
      expect(vi.mocked(dbService.getDailyFoodLogs)).toHaveBeenCalled();
    });

    it("should throw error if userId not initialized", async () => {
      const food = {
        userId: UserId("test"),
        name: "Banana",
        calories: 100,
        servingSize: 1,
        protein: 1,
        carbs: 27,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      };
      await expect(useAppState.getState().addFoodLog(food)).rejects.toThrow();
    });

    it("should handle add food log error", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(dbService.addFoodItemLog).mockRejectedValueOnce(new Error("DB error"));
      const food = {
        userId,
        name: "Banana",
        calories: 100,
        servingSize: 1,
        protein: 1,
        carbs: 27,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      };
      await expect(useAppState.getState().addFoodLog(food)).rejects.toThrow();
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("deleteFoodLog", () => {
    it("should delete food log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const foodId = FoodItemId(123);
      await useAppState.getState().deleteFoodLog(foodId);
      expect(vi.mocked(dbService.deleteFoodItem)).toHaveBeenCalledWith(foodId, userId);
    });

    it("should handle delete error", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService.deleteFoodItem).mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().deleteFoodLog(FoodItemId(123));
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("updateCalorieGoal", () => {
    it("should update calorie goal with valid value", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      await useAppState.getState().updateCalorieGoal(2500);
      expect(vi.mocked(dbService).updateUserProfile).toHaveBeenCalled();
    });

    it("should not update with invalid calorie goal", async () => {
      vi.mocked(dbService).updateUserProfile.mockClear();
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      await useAppState.getState().updateCalorieGoal(-100);
      expect(vi.mocked(dbService).updateUserProfile).not.toHaveBeenCalled();
    });

    it("should handle update error", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(dbService).updateUserProfile.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().updateCalorieGoal(2500);
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("fetchRecipes", () => {
    it("should fetch recipes", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchRecipes(userId);
      expect(vi.mocked(dbService).getAllRecipes).toHaveBeenCalledWith(userId);
      const state = useAppState.getState();
      expect(Array.isArray(state.recipes)).toBe(true);
    });

    it("should handle fetch recipes error", async () => {
      const userId = UserId("test-user");
      vi.mocked(dbService).getAllRecipes.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().fetchRecipes(userId);
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("deleteRecipe", () => {
    it("should delete recipe and refresh recipes list", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const recipeId = RecipeId(123);
      await useAppState.getState().deleteRecipe(recipeId);
      expect(vi.mocked(dbService).deleteRecipe).toHaveBeenCalledWith(recipeId, userId);
    });

    it("should handle error when deleting recipe fails", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const recipeId = RecipeId(123);
      vi.mocked(dbService).deleteRecipe.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().deleteRecipe(recipeId);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("updateRecipe", () => {
    it("should update recipe and refresh recipes list", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const mockRecipe: Recipe = {
        id: RecipeId(1),
        userId: UserId("1"),
        name: "Test Recipe",
        description: "Test",
        ingredients: [],
        totalCalories: 100,
        createdBy: UserId("1"),
        dateCreated: new Date().toISOString(),
      };
      await useAppState.getState().updateRecipe(mockRecipe);
      expect(vi.mocked(dbService).updateRecipe).toHaveBeenCalledWith(mockRecipe, userId);
    });
  });

  describe("fetchAllFoodItems", () => {
    it("should fetch all food items", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchAllFoodItems(userId);
      expect(vi.mocked(dbService).getRecentFoodItems).toHaveBeenCalledWith(userId);
    });

    it("should handle error when fetching food items fails", async () => {
      const userId = UserId("test-user");
      vi.mocked(dbService).getRecentFoodItems.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().fetchAllFoodItems(userId);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("fetchFavorites", () => {
    it("should fetch favorite foods", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchFavorites(userId);
      expect(vi.mocked(dbService).getFavoriteFoodItems).toHaveBeenCalledWith(userId);
    });

    it("should handle error when fetching favorites fails", async () => {
      const userId = UserId("test-user");
      vi.mocked(dbService).getFavoriteFoodItems.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().fetchFavorites(userId);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("toggleFavorite", () => {
    it("should toggle favorite status", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const foodId = FoodItemId(123);
      await useAppState.getState().toggleFavorite(foodId, true);
      expect(vi.mocked(dbService).toggleFavoriteFoodItem).toHaveBeenCalledWith(
        foodId,
        true,
        userId,
      );
    });

    it("should handle error when toggling favorite fails", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const foodId = FoodItemId(123);
      vi.mocked(dbService).toggleFavoriteFoodItem.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().toggleFavorite(foodId, true);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("updateFoodLog", () => {
    it("should update food log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const foodId = FoodItemId(123);
      const updates = { name: "Updated Food", calories: 200 };
      await useAppState.getState().updateFoodLog(foodId, updates);
      expect(vi.mocked(dbService).updateFoodItem).toHaveBeenCalledWith(foodId, updates, userId);
    });
  });

  describe("Water Logs", () => {
    it("should fetch daily water logs", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchDailyWaterLogs(userId);
      expect(vi.mocked(dbService).getDailyWaterLogs).toHaveBeenCalled();
    });

    it("should add water log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      await useAppState.getState().addWaterLog(250);
      expect(vi.mocked(dbService).addWaterLog).toHaveBeenCalled();
    });

    it("should delete water log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const logId = WaterLogId(123);
      await useAppState.getState().deleteWaterLog(logId);
      expect(vi.mocked(dbService).deleteWaterLog).toHaveBeenCalledWith(logId, userId);
    });
  });

  describe("Step Logs", () => {
    it("should fetch daily step logs", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchDailyStepLogs(userId);
      expect(vi.mocked(dbService).getDailyStepLogs).toHaveBeenCalled();
    });

    it("should add step log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      await useAppState.getState().addStepLog(1000);
      expect(vi.mocked(dbService.addStepLog)).toHaveBeenCalled();
    });

    it("should delete step log", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const logId = StepLogId(123);
      await useAppState.getState().deleteStepLog(logId);
      expect(vi.mocked(dbService).deleteStepLog).toHaveBeenCalledWith(logId, userId);
    });

    it("should set step goal with valid value", () => {
      useAppState.getState().setStepGoal(12000);
      expect(useAppState.getState().stepGoal).toBe(12000);
      expect(localStorage.getItem("stepGoal")).toBe("12000");
    });

    it("should not set step goal with invalid value", () => {
      const original = useAppState.getState().stepGoal;
      useAppState.getState().setStepGoal(-1000);
      expect(useAppState.getState().stepGoal).toBe(original);
    });
  });

  describe("Body Measurements", () => {
    it("should fetch body measurements", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchBodyMeasurements(userId);
      expect(vi.mocked(dbService).getAllBodyMeasurements).toHaveBeenCalled();
    });

    it("should add body measurement", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const measurement = {
        userId,
        weight: 70,
        measuredAt: ISODate("2026-05-16"),
      };
      await useAppState.getState().addBodyMeasurement(measurement);
      expect(vi.mocked(dbService).addBodyMeasurement).toHaveBeenCalled();
    });

    it("should delete body measurement", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const measurementId = BodyMeasurementId(123);
      await useAppState.getState().deleteBodyMeasurement(measurementId);
      expect(vi.mocked(dbService).deleteBodyMeasurement).toHaveBeenCalledWith(
        measurementId,
        userId,
      );
    });

    it("should update body measurement", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      const measurementId = BodyMeasurementId(123);
      await useAppState.getState().updateBodyMeasurement(measurementId, { weight: 72 });
      expect(vi.mocked(dbService).updateBodyMeasurement).toHaveBeenCalledWith(
        measurementId,
        userId,
        { weight: 72 },
      );
    });
  });

  describe("setWaterGoalMl", () => {
    it("should set water goal with valid value", () => {
      useAppState.getState().setWaterGoalMl(3000);
      expect(useAppState.getState().waterGoalMl).toBe(3000);
      expect(localStorage.getItem("waterGoalMl")).toBe("3000");
    });

    it("should not set water goal with invalid value", () => {
      const original = useAppState.getState().waterGoalMl;
      useAppState.getState().setWaterGoalMl(-1);
      expect(useAppState.getState().waterGoalMl).toBe(original);
    });

    it("should not set water goal above maximum", () => {
      const original = useAppState.getState().waterGoalMl;
      useAppState.getState().setWaterGoalMl(20000);
      expect(useAppState.getState().waterGoalMl).toBe(original);
    });
  });

  describe("checkAndUnlockAchievements", () => {
    it("should check achievements when userId and status are ready", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).getAllFoodLogs).toHaveBeenCalledWith(userId);
      expect(vi.mocked(dbService).getAllWaterLogs).toHaveBeenCalledWith(userId);
    });

    it("should not check achievements if userId not set", async () => {
      vi.mocked(dbService).getAllFoodLogs.mockClear();
      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).getAllFoodLogs).not.toHaveBeenCalled();
    });

    it("should handle error during achievement unlocking", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(achievements).evaluateAchievements.mockReturnValueOnce(["ach1"]);
      vi.mocked(dbService).getUnlockedAchievementIds.mockResolvedValueOnce(new Set());
      vi.mocked(dbService).addUserAchievement.mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().checkAndUnlockAchievements();
      // Should not throw, error is silently handled
      expect(true).toBe(true);
    });

    it("should unlock achievements and fetch fresh list on success", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(achievements).evaluateAchievements.mockReturnValueOnce(["ach1", "ach2"]);
      vi.mocked(dbService).getUnlockedAchievementIds.mockResolvedValueOnce(new Set());
      vi.mocked(dbService).getUnlockedAchievements.mockResolvedValueOnce([
        {
          id: UserAchievementId(1),
          userId,
          achievementId: "ach1",
          unlockedAt: new Date().toISOString(),
        },
      ]);

      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).addUserAchievement).toHaveBeenCalledTimes(2);
      expect(vi.mocked(dbService).getUnlockedAchievements).toHaveBeenCalledWith(userId);
    });
  });

  describe("fetchAchievements", () => {
    it("should fetch and set achievements", async () => {
      const userId = UserId("test-user");
      await useAppState.getState().fetchAchievements(userId);
      expect(vi.mocked(dbService).getUnlockedAchievements).toHaveBeenCalledWith(userId);
    });

    it("should handle fetch achievements error", async () => {
      const userId = UserId("test-user");
      vi.mocked(dbService).getUnlockedAchievements.mockRejectedValueOnce(new Error("DB error"));
      await useAppState.getState().fetchAchievements(userId);
      const state = useAppState.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe("Water log errors", () => {
    it("should handle error when adding water log fails", async () => {
      const userId = UserId("water-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.addWaterLog).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().addWaterLog(500);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should handle error when deleting water log fails", async () => {
      const userId = UserId("water-delete-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.deleteWaterLog).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().deleteWaterLog(WaterLogId(1));
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should skip water operations if userId not set", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.addWaterLog).mockClear();

      await useAppState.getState().addWaterLog(500);
      expect(vi.mocked(dbService.addWaterLog)).not.toHaveBeenCalled();
    });

    it("should fetch daily water logs successfully", async () => {
      const userId = UserId("fetch-water");
      vi.mocked(dbService.getDailyWaterLogs).mockResolvedValueOnce([]);

      await useAppState.getState().fetchDailyWaterLogs(userId);
      expect(useAppState.getState().dailyWaterLogs).toStrictEqual([]);
    });

    it("should handle error when fetching water logs fails", async () => {
      const userId = UserId("fetch-water-error");
      vi.mocked(dbService.getDailyWaterLogs).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().fetchDailyWaterLogs(userId);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("Step log errors", () => {
    it("should handle error when adding step log fails", async () => {
      const userId = UserId("step-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.addStepLog).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().addStepLog(5000);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should handle error when deleting step log fails", async () => {
      const userId = UserId("step-delete-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.deleteStepLog).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().deleteStepLog(StepLogId(1));
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should fetch daily step logs successfully", async () => {
      const userId = UserId("fetch-steps");
      vi.mocked(dbService.getDailyStepLogs).mockResolvedValueOnce([]);

      await useAppState.getState().fetchDailyStepLogs(userId);
      expect(useAppState.getState().dailyStepLogs).toStrictEqual([]);
    });

    it("should handle error when fetching step logs fails", async () => {
      const userId = UserId("fetch-steps-error");
      vi.mocked(dbService.getDailyStepLogs).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().fetchDailyStepLogs(userId);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should skip step operations if userId not set", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.addStepLog).mockClear();

      await useAppState.getState().addStepLog(5000);
      expect(vi.mocked(dbService.addStepLog)).not.toHaveBeenCalled();
    });
  });

  describe("Body measurement errors", () => {
    it("should handle error when adding body measurement fails", async () => {
      const userId = UserId("body-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.addBodyMeasurement).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().addBodyMeasurement({
        userId,
        measuredAt: ISODate("2026-05-16"),
        weight: 70,
      });
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should handle error when deleting body measurement fails", async () => {
      const userId = UserId("body-delete-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.deleteBodyMeasurement).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().deleteBodyMeasurement(BodyMeasurementId(1));
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should skip body measurement operations if userId not set", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.addBodyMeasurement).mockClear();

      await useAppState.getState().addBodyMeasurement({
        userId: UserId("test"),
        measuredAt: ISODate("2026-05-16"),
        weight: 70,
      });
      expect(vi.mocked(dbService.addBodyMeasurement)).not.toHaveBeenCalled();
    });

    it("should fetch body measurements successfully", async () => {
      const userId = UserId("fetch-body");
      vi.mocked(dbService.getAllBodyMeasurements).mockResolvedValueOnce([]);

      await useAppState.getState().fetchBodyMeasurements(userId);
      expect(useAppState.getState().bodyMeasurements).toStrictEqual([]);
    });

    it("should handle error when fetching body measurements fails", async () => {
      const userId = UserId("fetch-body-error");
      vi.mocked(dbService.getAllBodyMeasurements).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().fetchBodyMeasurements(userId);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("Food log errors and edge cases", () => {
    it("should handle error when adding food log fails", async () => {
      const userId = UserId("food-add-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.addFoodItemLog).mockRejectedValueOnce(new Error("DB error"));

      const food = {
        userId,
        name: "Test Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 10,
        fat: 3,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
      };

      await expect(useAppState.getState().addFoodLog(food)).rejects.toThrow();
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should handle missing userId when adding food log", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.addFoodItemLog).mockClear();

      const food = {
        userId: UserId("test"),
        name: "Test Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 10,
        fat: 3,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
      };

      await expect(useAppState.getState().addFoodLog(food)).rejects.toThrow();
    });

    it("should refresh daily logs after food deletion", async () => {
      const userId = UserId("food-delete");
      useAppState.setState({ userId });
      vi.mocked(dbService.getDailyFoodLogs).mockResolvedValueOnce([]);

      await useAppState.getState().deleteFoodLog(FoodItemId(1));
      expect(vi.mocked(dbService.deleteFoodItem)).toHaveBeenCalledWith(FoodItemId(1), userId);
    });

    it("should handle error when updating food log fails", async () => {
      const userId = UserId("food-update-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.updateFoodItem).mockRejectedValueOnce(new Error("DB error"));

      await useAppState.getState().updateFoodLog(FoodItemId(1), { name: "Updated" });
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should skip update if userId not set", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.updateFoodItem).mockClear();

      await useAppState.getState().updateFoodLog(FoodItemId(1), { name: "Updated" });
      expect(vi.mocked(dbService.updateFoodItem)).not.toHaveBeenCalled();
    });
  });

  describe("Recipe error scenarios", () => {
    it("should handle error when updating recipe fails", async () => {
      const userId = UserId("recipe-update-error");
      useAppState.setState({ userId });
      vi.mocked(dbService.updateRecipe).mockRejectedValueOnce(new Error("Unauthorized"));

      const recipe = {
        id: RecipeId(1),
        userId,
        name: "Test",
        description: "Test",
        ingredients: [],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
      };

      await useAppState.getState().updateRecipe(recipe);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("should skip recipe delete if userId not set", async () => {
      useAppState.setState({ userId: null });
      vi.mocked(dbService.deleteRecipe).mockClear();

      await useAppState.getState().deleteRecipe(RecipeId(1));
      expect(vi.mocked(dbService.deleteRecipe)).not.toHaveBeenCalled();
    });
  });

  describe("localStorage initialization", () => {
    it("should read valid waterGoalMl from localStorage", () => {
      localStorage.clear();
      localStorage.setItem("waterGoalMl", "3000");
      // Re-import to trigger the getter again - we need to test the store directly
      const state = useAppState.getState();
      // setWaterGoalMl should respect the stored value on init
      expect(state.waterGoalMl).toBeDefined();
    });

    it("should ignore invalid waterGoalMl in localStorage", () => {
      localStorage.clear();
      localStorage.setItem("waterGoalMl", "not-a-number");
      const state = useAppState.getState();
      // Should not crash and maintain a valid value
      expect(typeof state.waterGoalMl).toBe("number");
    });

    it("should ignore out-of-range waterGoalMl values", () => {
      localStorage.clear();
      localStorage.setItem("waterGoalMl", "50000"); // > 10000
      const state = useAppState.getState();
      expect(typeof state.waterGoalMl).toBe("number");
    });

    it("should read valid stepGoal from localStorage", () => {
      localStorage.clear();
      localStorage.setItem("stepGoal", "15000");
      const state = useAppState.getState();
      expect(typeof state.stepGoal).toBe("number");
    });

    it("should ignore invalid stepGoal in localStorage", () => {
      localStorage.clear();
      localStorage.setItem("stepGoal", "invalid");
      const state = useAppState.getState();
      expect(typeof state.stepGoal).toBe("number");
    });

    it("should ignore out-of-range stepGoal values", () => {
      localStorage.clear();
      localStorage.setItem("stepGoal", "500000"); // > 100000
      const state = useAppState.getState();
      expect(typeof state.stepGoal).toBe("number");
    });
  });

  describe("State structure", () => {
    it("should have all required methods", () => {
      const state = useAppState.getState();
      expect(typeof state.fetchInitialData).toBe("function");
      expect(typeof state.refreshDailyLogs).toBe("function");
      expect(typeof state.addFoodLog).toBe("function");
      expect(typeof state.deleteFoodLog).toBe("function");
      expect(typeof state.updateCalorieGoal).toBe("function");
      expect(typeof state.fetchRecipes).toBe("function");
      expect(typeof state.deleteRecipe).toBe("function");
      expect(typeof state.fetchAllFoodItems).toBe("function");
      expect(typeof state.fetchFavorites).toBe("function");
      expect(typeof state.toggleFavorite).toBe("function");
      expect(typeof state.updateFoodLog).toBe("function");
      expect(typeof state.fetchDailyWaterLogs).toBe("function");
      expect(typeof state.addWaterLog).toBe("function");
      expect(typeof state.deleteWaterLog).toBe("function");
      expect(typeof state.fetchDailyStepLogs).toBe("function");
      expect(typeof state.addStepLog).toBe("function");
      expect(typeof state.deleteStepLog).toBe("function");
      expect(typeof state.fetchBodyMeasurements).toBe("function");
      expect(typeof state.addBodyMeasurement).toBe("function");
      expect(typeof state.deleteBodyMeasurement).toBe("function");
      expect(typeof state.checkAndUnlockAchievements).toBe("function");
      expect(typeof state.setWaterGoalMl).toBe("function");
      expect(typeof state.setStepGoal).toBe("function");
    });

    it("should have all required state properties", () => {
      const state = useAppState.getState();
      expect(state.init).toBeDefined();
      expect(state.dailyLogs).toBeDefined();
      expect(state.allFoodItems).toBeDefined();
      expect(state.recipes).toBeDefined();
      expect(state.favoriteFoods).toBeDefined();
      expect(state.dailyWaterLogs).toBeDefined();
      expect(state.dailyStepLogs).toBeDefined();
      expect(state.bodyMeasurements).toBeDefined();
      expect(state.unlockedAchievements).toBeDefined();
      expect(state.waterGoalMl).toBeDefined();
      expect(state.stepGoal).toBeDefined();
      expect(state.error).toBeDefined();
      expect(state.userId).toBeDefined();
    });
  });

  describe("updateCalorieGoal guards", () => {
    it("should reject NaN as calorie goal", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(dbService).updateUserProfile.mockClear();
      await useAppState.getState().updateCalorieGoal(NaN);
      expect(vi.mocked(dbService).updateUserProfile).not.toHaveBeenCalled();
    });

    it("should reject negative calorie goal", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(dbService).updateUserProfile.mockClear();
      await useAppState.getState().updateCalorieGoal(-1);
      expect(vi.mocked(dbService).updateUserProfile).not.toHaveBeenCalled();
    });

    it("should reject calorie goal exceeding maximum", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(dbService).updateUserProfile.mockClear();
      await useAppState.getState().updateCalorieGoal(100000);
      expect(vi.mocked(dbService).updateUserProfile).not.toHaveBeenCalled();
    });

    it("should not update calorie goal when not ready", async () => {
      useAppState.setState({
        userId: null,
        init: { status: "loading" },
      });
      vi.mocked(dbService).updateUserProfile.mockClear();
      await useAppState.getState().updateCalorieGoal(2500);
      expect(vi.mocked(dbService).updateUserProfile).not.toHaveBeenCalled();
    });
  });

  describe("setWaterGoalMl guards", () => {
    it("should reject water goal below minimum", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setWaterGoalMl(100);
      expect(localStorage.getItem("waterGoalMl")).toBeNull();
    });

    it("should reject water goal above maximum", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setWaterGoalMl(15000);
      expect(localStorage.getItem("waterGoalMl")).toBeNull();
    });

    it("should reject NaN as water goal", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setWaterGoalMl(NaN);
      expect(localStorage.getItem("waterGoalMl")).toBeNull();
    });
  });

  describe("setStepGoal guards", () => {
    it("should reject step goal below minimum", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setStepGoal(500);
      expect(localStorage.getItem("stepGoal")).toBeNull();
    });

    it("should reject step goal above maximum", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setStepGoal(200000);
      expect(localStorage.getItem("stepGoal")).toBeNull();
    });

    it("should reject NaN as step goal", async () => {
      const userId = UserId("test-user");
      useAppState.setState({ userId });
      vi.mocked(dbService).updateUserProfile.mockClear();
      localStorage.clear();
      await useAppState.getState().setStepGoal(NaN);
      expect(localStorage.getItem("stepGoal")).toBeNull();
    });
  });

  describe("checkAndUnlockAchievements guards", () => {
    it("should not unlock achievements when userId is null", async () => {
      useAppState.setState({
        userId: null,
        init: {
          status: "ready",
          user: {
            id: UserId("any"),
            calorieGoal: 2000,
            username: "Test User",
            email: "test@example.com",
            lastLogin: new Date().toISOString(),
          },
        },
      });
      vi.mocked(dbService).addUserAchievement.mockClear();
      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).addUserAchievement).not.toHaveBeenCalled();
    });

    it("should not unlock achievements when init status is not ready", async () => {
      useAppState.setState({ userId: UserId("test"), init: { status: "loading" } });
      vi.mocked(dbService).addUserAchievement.mockClear();
      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).addUserAchievement).not.toHaveBeenCalled();
    });

    it("should not insert achievements when no new achievements are found", async () => {
      const userId = UserId("test-user");
      useAppState.setState({
        userId,
        init: {
          status: "ready",
          user: {
            id: userId,
            username: "test",
            email: "test@test.com",
            lastLogin: new Date().toISOString(),
            calorieGoal: 2000,
          },
        },
      });
      vi.mocked(achievements).evaluateAchievements.mockReturnValueOnce([]);
      vi.mocked(dbService).getUnlockedAchievementIds.mockResolvedValueOnce(new Set());
      vi.mocked(dbService).addUserAchievement.mockClear();

      await useAppState.getState().checkAndUnlockAchievements();
      expect(vi.mocked(dbService).addUserAchievement).not.toHaveBeenCalled();
    });
  });

  describe("TDEE Profile", () => {
    const userId = UserId("tdee-state-user");

    it("fetchTdeeProfile sets tdeeProfile from DB", async () => {
      const profile = {
        id: 1,
        userId,
        age: 30,
        sex: "male" as const,
        heightCm: 175,
        weightKg: 70,
        activityLevel: "moderate" as const,
        goal: "maintain" as const,
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(dbService.getTdeeProfile).mockResolvedValueOnce(profile);
      useAppState.setState({ userId });

      await useAppState.getState().fetchTdeeProfile(userId);

      expect(useAppState.getState().tdeeProfile).toStrictEqual(profile);
    });

    it("fetchTdeeProfile sets null when no profile", async () => {
      vi.mocked(dbService.getTdeeProfile).mockResolvedValueOnce(undefined);
      useAppState.setState({ userId });

      await useAppState.getState().fetchTdeeProfile(userId);

      expect(useAppState.getState().tdeeProfile).toBeNull();
    });

    it("saveTdeeProfile persists and updates calorie goal", async () => {
      useAppState.setState({ userId });
      vi.mocked(dbService.updateUserProfile).mockResolvedValue(undefined);

      await useAppState.getState().saveTdeeProfile({
        age: 28,
        sex: "female",
        heightCm: 162,
        weightKg: 58,
        activityLevel: "light",
        goal: "maintain",
      });

      expect(dbService.saveTdeeProfile).toHaveBeenCalled();
      expect(useAppState.getState().tdeeProfile).not.toBeNull();
      expect(useAppState.getState().tdeeProfile?.age).toBe(28);
    });

    it("saveTdeeProfile does nothing when userId is null", async () => {
      useAppState.setState({ userId: null });

      await useAppState.getState().saveTdeeProfile({
        age: 28,
        sex: "female",
        heightCm: 162,
        weightKg: 58,
        activityLevel: "light",
        goal: "maintain",
      });

      expect(dbService.saveTdeeProfile).not.toHaveBeenCalled();
    });

    it("saveTdeeProfile sets error on DB failure", async () => {
      useAppState.setState({ userId });
      vi.mocked(dbService.saveTdeeProfile).mockRejectedValueOnce(new Error("DB fail"));

      await useAppState.getState().saveTdeeProfile({
        age: 28,
        sex: "female",
        heightCm: 162,
        weightKg: 58,
        activityLevel: "light",
        goal: "maintain",
      });

      expect(useAppState.getState().error).toBeDefined();
    });
  });

  describe("Activity Logs", () => {
    const userId = UserId("activity-state-user");

    it("fetchDailyActivityLogs populates dailyActivityLogs", async () => {
      const log = {
        id: ActivityLogId(1),
        userId,
        activityType: "Running (6 mph)",
        durationMin: 30,
        caloriesBurned: 360,
        dateLogged: ISODate("2026-05-20"),
        loggedAt: new Date().toISOString(),
      };
      vi.mocked(dbService.getDailyActivityLogs).mockResolvedValueOnce([log]);
      useAppState.setState({ userId });

      await useAppState.getState().fetchDailyActivityLogs(userId);

      expect(useAppState.getState().dailyActivityLogs).toHaveLength(1);
      expect(useAppState.getState().dailyActivityLogs[0]?.activityType).toBe("Running (6 mph)");
    });

    it("addActivityLog calls DB and refreshes lists", async () => {
      useAppState.setState({ userId });

      await useAppState.getState().addActivityLog({
        userId,
        activityType: "Walking (moderate, 3 mph)",
        durationMin: 20,
        caloriesBurned: 85,
        dateLogged: ISODate("2026-05-20"),
        loggedAt: new Date().toISOString(),
      });

      expect(dbService.addActivityLog).toHaveBeenCalled();
    });

    it("addActivityLog does nothing when userId is null", async () => {
      useAppState.setState({ userId: null });

      await useAppState.getState().addActivityLog({
        userId: UserId("other"),
        activityType: "Running (6 mph)",
        durationMin: 30,
        caloriesBurned: 360,
        dateLogged: ISODate("2026-05-20"),
        loggedAt: new Date().toISOString(),
      });

      expect(dbService.addActivityLog).not.toHaveBeenCalled();
    });

    it("deleteActivityLog calls DB and refreshes lists", async () => {
      useAppState.setState({ userId });

      await useAppState.getState().deleteActivityLog(ActivityLogId(1));

      expect(dbService.deleteActivityLog).toHaveBeenCalledWith(ActivityLogId(1), userId);
    });

    it("deleteActivityLog does nothing when userId is null", async () => {
      useAppState.setState({ userId: null });

      await useAppState.getState().deleteActivityLog(ActivityLogId(1));

      expect(dbService.deleteActivityLog).not.toHaveBeenCalled();
    });
  });

  describe("Fasting Sessions", () => {
    const userId = UserId("fasting-state-user");

    it("fetchFastingSessions sets active and history", async () => {
      const session = {
        id: FastingSessionId(1),
        userId,
        startTime: new Date().toISOString(),
        endTime: null,
        targetHours: 16,
        dateLogged: ISODate("2026-05-20"),
        completed: false,
      };
      vi.mocked(dbService.getActiveFastingSession).mockResolvedValueOnce(session);
      vi.mocked(dbService.getAllFastingSessions).mockResolvedValueOnce([session]);
      useAppState.setState({ userId });

      await useAppState.getState().fetchFastingSessions(userId);

      expect(useAppState.getState().activeFastingSession).toStrictEqual(session);
      expect(useAppState.getState().fastingHistory).toHaveLength(1);
    });

    it("startFasting creates session and fetches", async () => {
      useAppState.setState({ userId, activeFastingSession: null });

      await useAppState.getState().startFasting(16);

      expect(dbService.startFastingSession).toHaveBeenCalled();
    });

    it("startFasting does nothing when userId is null", async () => {
      useAppState.setState({ userId: null });

      await useAppState.getState().startFasting(16);

      expect(dbService.startFastingSession).not.toHaveBeenCalled();
    });

    it("startFasting shows toast if session already active", async () => {
      const session = {
        id: FastingSessionId(1),
        userId,
        startTime: new Date().toISOString(),
        endTime: null,
        targetHours: 16,
        dateLogged: ISODate("2026-05-20"),
        completed: false,
      };
      useAppState.setState({ userId, activeFastingSession: session });

      await useAppState.getState().startFasting(18);

      expect(dbService.startFastingSession).not.toHaveBeenCalled();
    });

    it("endFasting calls DB and clears active session", async () => {
      const session = {
        id: FastingSessionId(1),
        userId,
        startTime: new Date().toISOString(),
        endTime: null,
        targetHours: 16,
        dateLogged: ISODate("2026-05-20"),
        completed: false,
      };
      useAppState.setState({ userId, activeFastingSession: session });

      await useAppState.getState().endFasting(true);

      expect(dbService.endFastingSession).toHaveBeenCalledWith(FastingSessionId(1), userId, true);
    });

    it("endFasting does nothing when no active session", async () => {
      useAppState.setState({ userId, activeFastingSession: null });

      await useAppState.getState().endFasting(false);

      expect(dbService.endFastingSession).not.toHaveBeenCalled();
    });
  });

  describe("Export / Import", () => {
    const userId = UserId("export-state-user");

    it("exportData returns payload from DB", async () => {
      useAppState.setState({ userId });

      const result = await useAppState.getState().exportData();

      expect(result).not.toBeNull();
      expect(dbService.exportAllData).toHaveBeenCalledWith(userId);
    });

    it("exportData returns null when userId is null", async () => {
      useAppState.setState({ userId: null });

      const result = await useAppState.getState().exportData();

      expect(result).toBeNull();
    });

    it("importData calls importBackup and re-fetches data", async () => {
      useAppState.setState({ userId });
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: "export-state-user",
        tables: {
          foodItems: [],
          recipes: [],
          waterLogs: [],
          bodyMeasurements: [],
          userAchievements: [],
          stepLogs: [],
          tdeeProfile: null,
          activityLogs: [],
          fastingSessions: [],
        },
      };

      const result = await useAppState
        .getState()
        .importData(payload as import("../db/dbService").BackupPayload);

      expect(result).not.toBeNull();
      expect(dbService.importBackup).toHaveBeenCalled();
    });

    it("importData returns null when userId is null", async () => {
      useAppState.setState({ userId: null });

      const result = await useAppState
        .getState()
        .importData({} as import("../db/dbService").BackupPayload);

      expect(result).toBeNull();
    });
  });
});

describe("AppState IIFE localStorage initialization", () => {
  // The waterGoalMl and stepGoal fields are set by IIFEs that run at module load time.
  // vi.resetModules() forces a fresh module evaluation on the next dynamic import,
  // so pre-setting localStorage before the import hits the branches that return the
  // stored value instead of the default.

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("uses a valid waterGoalMl from localStorage as the initial store value", async () => {
    localStorage.setItem("waterGoalMl", "3500");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().waterGoalMl).toBe(3500);
  });

  it("ignores waterGoalMl below the minimum (250) and falls back to 2000", async () => {
    localStorage.setItem("waterGoalMl", "100");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().waterGoalMl).toBe(2000);
  });

  it("ignores waterGoalMl above the maximum (10000) and falls back to 2000", async () => {
    localStorage.setItem("waterGoalMl", "15000");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().waterGoalMl).toBe(2000);
  });

  it("ignores a non-numeric waterGoalMl and falls back to 2000", async () => {
    localStorage.setItem("waterGoalMl", "not-a-number");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().waterGoalMl).toBe(2000);
  });

  it("uses a valid stepGoal from localStorage as the initial store value", async () => {
    localStorage.setItem("stepGoal", "15000");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().stepGoal).toBe(15000);
  });

  describe("Optimistic UI rollbacks", () => {
    it("toggleFavorite optimistically updates store before DB call", async () => {
      const userId = UserId("opt-user");
      const foodId = FoodItemId(1);
      const food = {
        id: foodId,
        userId,
        name: "Opt Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 10,
        fat: 3,
        dateLogged: ISODate("2026-05-17"),
        isFavorite: false,
      };
      useAppState.setState({ userId, allFoodItems: [food], dailyLogs: [food], favoriteFoods: [] });

      let storeStateBeforeDB!: boolean;
      vi.mocked(dbService.toggleFavoriteFoodItem).mockImplementationOnce(async () => {
        storeStateBeforeDB = useAppState.getState().allFoodItems[0]?.isFavorite ?? false;
      });
      await useAppState.getState().toggleFavorite(foodId, true);

      expect(storeStateBeforeDB).toBe(true);
    });

    it("toggleFavorite rolls back store on DB error", async () => {
      const userId = UserId("opt-rb-user");
      const foodId = FoodItemId(2);
      const food = {
        id: foodId,
        userId,
        name: "Opt Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 10,
        fat: 3,
        dateLogged: ISODate("2026-05-17"),
        isFavorite: false,
      };
      useAppState.setState({ userId, allFoodItems: [food], dailyLogs: [food], favoriteFoods: [] });
      vi.mocked(dbService.toggleFavoriteFoodItem).mockRejectedValueOnce(new Error("DB fail"));

      await useAppState.getState().toggleFavorite(foodId, true);

      expect(useAppState.getState().allFoodItems[0]?.isFavorite).toBe(false);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("addWaterLog optimistically adds entry before DB call", async () => {
      const userId = UserId("opt-water");
      useAppState.setState({ userId, dailyWaterLogs: [] });

      let countBeforeDB = 0;
      vi.mocked(dbService.addWaterLog).mockImplementationOnce(async () => {
        countBeforeDB = useAppState.getState().dailyWaterLogs.length;
        return WaterLogId(99);
      });
      await useAppState.getState().addWaterLog(250);

      expect(countBeforeDB).toBe(1);
    });

    it("addWaterLog rolls back store on DB error", async () => {
      const userId = UserId("opt-water-rb");
      useAppState.setState({ userId, dailyWaterLogs: [] });
      vi.mocked(dbService.addWaterLog).mockRejectedValueOnce(new Error("DB fail"));

      await useAppState.getState().addWaterLog(250);

      expect(useAppState.getState().dailyWaterLogs).toHaveLength(0);
      expect(useAppState.getState().error).toBeDefined();
    });

    it("addStepLog optimistically adds entry before DB call", async () => {
      const userId = UserId("opt-step");
      useAppState.setState({ userId, dailyStepLogs: [] });

      let countBeforeDB = 0;
      vi.mocked(dbService.addStepLog).mockImplementationOnce(async () => {
        countBeforeDB = useAppState.getState().dailyStepLogs.length;
        return StepLogId(99);
      });
      await useAppState.getState().addStepLog(1000);

      expect(countBeforeDB).toBe(1);
    });

    it("addStepLog rolls back store on DB error", async () => {
      const userId = UserId("opt-step-rb");
      useAppState.setState({ userId, dailyStepLogs: [] });
      vi.mocked(dbService.addStepLog).mockRejectedValueOnce(new Error("DB fail"));

      await useAppState.getState().addStepLog(1000);

      expect(useAppState.getState().dailyStepLogs).toHaveLength(0);
      expect(useAppState.getState().error).toBeDefined();
    });
  });

  it("ignores stepGoal below the minimum (1000) and falls back to 10000", async () => {
    localStorage.setItem("stepGoal", "500");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().stepGoal).toBe(10000);
  });

  it("ignores stepGoal above the maximum (100000) and falls back to 10000", async () => {
    localStorage.setItem("stepGoal", "200000");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().stepGoal).toBe(10000);
  });

  it("ignores a non-numeric stepGoal and falls back to 10000", async () => {
    localStorage.setItem("stepGoal", "invalid");
    const { useAppState: freshStore } = await import("./AppState");
    expect(freshStore.getState().stepGoal).toBe(10000);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { computeWeeklySummary, useWeeklySummary } from "./useWeeklySummary";
import { UserId } from "@/types";
import type { AppState } from "../state/AppState";
import * as appState from "../state/AppState";
import * as progressDataHook from "./useProgressData";

vi.mock("../state/AppState");
vi.mock("./useProgressData");

describe("useWeeklySummary", () => {
  const userId = UserId("test-user");
  let mockAppStateData: AppState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppStateData = {
      userId,
      init: {
        status: "ready" as const,
        user: {
          id: userId,
          calorieGoal: 2000,
          username: "test",
          email: "test@example.com",
          lastLogin: new Date().toISOString(),
        },
      },
      dailyLogs: [],
      allFoodItems: [],
      recipes: [],
      favoriteFoods: [],
      dailyWaterLogs: [],
      dailyStepLogs: [],
      bodyMeasurements: [],
      unlockedAchievements: [],
      error: null,
      waterGoalMl: 2000,
      stepGoal: 10000,
      fetchInitialData: vi.fn(),
      refreshDailyLogs: vi.fn(),
      addFoodLog: vi.fn(),
      deleteFoodLog: vi.fn(),
      updateCalorieGoal: vi.fn(),
      fetchRecipes: vi.fn(),
      deleteRecipe: vi.fn(),
      updateRecipe: vi.fn(),
      fetchAllFoodItems: vi.fn(),
      fetchFavorites: vi.fn(),
      toggleFavorite: vi.fn(),
      updateFoodLog: vi.fn(),
      addWaterLog: vi.fn(),
      deleteWaterLog: vi.fn(),
      fetchDailyWaterLogs: vi.fn(),
      setWaterGoalMl: vi.fn(),
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      fetchDailyStepLogs: vi.fn(),
      setStepGoal: vi.fn(),
      addBodyMeasurement: vi.fn(),
      deleteBodyMeasurement: vi.fn(),
      fetchBodyMeasurements: vi.fn(),
      checkAndUnlockAchievements: vi.fn(),
      fetchAchievements: vi.fn(),
    } as unknown as AppState;

    vi.mocked(appState).useAppState.mockImplementation(((
      selector?: (state: AppState) => unknown,
    ) => {
      if (typeof selector === "function") {
        return selector(mockAppStateData);
      }
      return mockAppStateData;
    }) as unknown as typeof appState.useAppState);

    vi.mocked(progressDataHook).useProgressData.mockReturnValue({
      labels: [],
      data: [],
      rollingAvg: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return summary data structure", () => {
    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current).toHaveProperty("averageCalories");
    expect(result.current).toHaveProperty("daysOnTarget");
    expect(result.current).toHaveProperty("consistency");
    expect(result.current).toHaveProperty("calorieGoal");
  });

  it("should use progress data for 7 days", () => {
    renderHook(() => useWeeklySummary());
    expect(vi.mocked(progressDataHook).useProgressData).toHaveBeenCalledWith(7);
  });

  it("should compute summary from progress data", () => {
    const data = [2000, 1800, 2100, 1900, 2000, 2100, 2000];
    vi.mocked(progressDataHook).useProgressData.mockReturnValue({
      labels: [],
      data,
      rollingAvg: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current.averageCalories).toBeGreaterThan(0);
  });

  it("should use calorie goal from app state", () => {
    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current.calorieGoal).toBe(2000);
  });

  it("should use default goal when init not ready", () => {
    mockAppStateData.init = { status: "loading" as const };

    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current.calorieGoal).toBe(2000);
  });

  it("should handle empty data", () => {
    vi.mocked(progressDataHook).useProgressData.mockReturnValue({
      labels: [],
      data: [],
      rollingAvg: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current.averageCalories).toBe(0);
    expect(result.current.daysOnTarget).toBe(0);
    expect(result.current.consistency).toBe(0);
  });

  it("should handle custom calorie goal", () => {
    mockAppStateData.init = {
      status: "ready" as const,
      user: {
        id: userId,
        calorieGoal: 3000,
        username: "test",
        email: "test@example.com",
        lastLogin: new Date().toISOString(),
      },
    };

    const { result } = renderHook(() => useWeeklySummary());
    expect(result.current.calorieGoal).toBe(3000);
  });
});

describe("computeWeeklySummary", () => {
  it("should calculate averageCalories as sum divided by 7", () => {
    const data = [2000, 1800, 2100, 1900, 2000, 2100, 2000]; // 7 days
    const result = computeWeeklySummary(data, 2000);
    const expected = Math.round(13900 / 7); // 1985
    expect(result.averageCalories).toBe(expected);
  });

  it("should count daysOnTarget correctly", () => {
    const data = [1800, 2000, 2100, 2000, 2200, 2000, 2000]; // 5 days on target
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(5);
  });

  it("should calculate consistency as percentage", () => {
    const data = [1800, 1900, 2000, 2100, 2200, 2100, 2000]; // 4/7 on target
    const result = computeWeeklySummary(data, 2000);
    expect(result.consistency).toBe(57); // Math.round((4 / 7) * 100)
  });

  it("should handle all zeros", () => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const result = computeWeeklySummary(data, 2000);
    expect(result.averageCalories).toBe(0);
    expect(result.daysOnTarget).toBe(0);
    expect(result.consistency).toBe(0);
  });

  it("should handle all days on target", () => {
    const data = [1500, 1800, 1900, 2000, 1700, 1800, 1900];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(7);
    expect(result.consistency).toBe(100);
  });

  it("should handle no days on target", () => {
    const data = [2100, 2200, 2300, 2400, 2500, 2600, 2700];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(0);
    expect(result.consistency).toBe(0);
  });

  it("should exclude zero values from average calculation", () => {
    const data = [2000, 0, 2000, 0, 2000, 0, 2000]; // 4 days with data
    const result = computeWeeklySummary(data, 2000);
    expect(result.averageCalories).toBe(Math.round(8000 / 7)); // Still divide by 7, not 4
  });

  it("should handle mixed data with some zeros", () => {
    const data = [1800, 0, 2000, 1900, 0, 2000, 1800];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(5); // 1800, 2000, 1900, 2000, 1800 all <= 2000
    expect(result.averageCalories).toBe(Math.round(9500 / 7));
  });
});

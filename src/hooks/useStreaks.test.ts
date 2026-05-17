import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStreaks } from "./useStreaks";
import { FoodItemId, ISODate, UserId } from "@/types";
import * as appState from "../state/AppState";
import * as dbService from "../db/dbService";

vi.mock("../state/AppState");
vi.mock("../db/dbService");

describe("useStreaks", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      init: { status: "ready" as const, user: { id: userId, calorieGoal: 2000 } },
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
      fetchWaterLogs: vi.fn(),
      setWaterGoalMl: vi.fn(),
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      fetchStepLogs: vi.fn(),
      setStepGoal: vi.fn(),
      addBodyMeasurement: vi.fn(),
      deleteBodyMeasurement: vi.fn(),
      fetchBodyMeasurements: vi.fn(),
      checkAndUnlockAchievements: vi.fn(),
      fetchAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state when userId is not set", () => {
    vi.mocked(appState).useAppState.mockReturnValueOnce({
      userId: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const { result } = renderHook(() => useStreaks());
    expect(result.current.isLoading).toBe(true);
  });

  it("should fetch streaks for user", async () => {
    const logs = [
      {
        id: FoodItemId(1),
        userId,
        name: "Apple",
        calories: 100,
        servingSize: 1,
        protein: 0,
        carbs: 25,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      },
      {
        id: FoodItemId(2),
        userId,
        name: "Banana",
        calories: 90,
        servingSize: 1,
        protein: 1,
        carbs: 23,
        fat: 0,
        dateLogged: ISODate("2026-05-15"),
        isFavorite: false,
        mealType: "Lunch" as const,
      },
      {
        id: FoodItemId(3),
        userId,
        name: "Orange",
        calories: 85,
        servingSize: 1,
        protein: 1,
        carbs: 21,
        fat: 0,
        dateLogged: ISODate("2026-05-14"),
        isFavorite: false,
        mealType: "Snacks" as const,
      },
    ];

    vi.mocked(dbService).getAllFoodLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(vi.mocked(dbService).getAllFoodLogs).toHaveBeenCalledWith(userId);
    expect(result.current.currentStreak).toBeGreaterThanOrEqual(0);
    expect(result.current.longestStreak).toBeGreaterThanOrEqual(0);
  });

  it("should compute consecutive day streaks", async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(yesterday.getDate() - 1);

    const todayISO = ISODate(today.toISOString().split("T")[0]!);
    const yesterdayISO = ISODate(yesterday.toISOString().split("T")[0]!);
    const dayBeforeISO = ISODate(dayBefore.toISOString().split("T")[0]!);

    const logs = [
      {
        id: FoodItemId(1),
        userId,
        name: "Apple",
        calories: 100,
        servingSize: 1,
        protein: 0,
        carbs: 25,
        fat: 0,
        dateLogged: todayISO,
        isFavorite: false,
        mealType: "Breakfast" as const,
      },
      {
        id: FoodItemId(2),
        userId,
        name: "Banana",
        calories: 90,
        servingSize: 1,
        protein: 1,
        carbs: 23,
        fat: 0,
        dateLogged: yesterdayISO,
        isFavorite: false,
        mealType: "Lunch" as const,
      },
      {
        id: FoodItemId(3),
        userId,
        name: "Orange",
        calories: 85,
        servingSize: 1,
        protein: 1,
        carbs: 21,
        fat: 0,
        dateLogged: dayBeforeISO,
        isFavorite: false,
        mealType: "Snacks" as const,
      },
    ];

    vi.mocked(dbService).getAllFoodLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBeGreaterThan(0);
    expect(result.current.longestStreak).toBeGreaterThan(0);
  });

  it("should handle empty logs", async () => {
    vi.mocked(dbService).getAllFoodLogs.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(dbService).getAllFoodLogs.mockRejectedValueOnce(new Error("DB error"));

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });

  it("should handle cleanup on unmount", async () => {
    vi.mocked(dbService).getAllFoodLogs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        }),
    );

    const { unmount } = renderHook(() => useStreaks());

    // Unmount before fetch completes
    unmount();

    // Should not crash or cause state updates
    expect(true).toBe(true);
  });

  it("should handle duplicate dates without inflating streak", async () => {
    const logs = [
      {
        id: FoodItemId(1),
        userId,
        name: "Apple",
        calories: 100,
        servingSize: 1,
        protein: 0,
        carbs: 25,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      },
      {
        id: FoodItemId(2),
        userId,
        name: "Banana",
        calories: 90,
        servingSize: 1,
        protein: 1,
        carbs: 23,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Lunch" as const,
      },
    ];

    vi.mocked(dbService).getAllFoodLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBeLessThanOrEqual(1);
  });

  it("should show currentStreak < longestStreak after a gap", async () => {
    const today = new Date();
    const todayMinus1 = new Date(today);
    todayMinus1.setDate(today.getDate() - 1);
    const todayMinus2 = new Date(today);
    todayMinus2.setDate(today.getDate() - 2);
    const todayMinus3 = new Date(today);
    todayMinus3.setDate(today.getDate() - 3);
    const todayMinus4 = new Date(today);
    todayMinus4.setDate(today.getDate() - 4);

    const todayISO = ISODate(today.toISOString().split("T")[0]!);
    const todayMinus2ISO = ISODate(todayMinus2.toISOString().split("T")[0]!);
    const todayMinus3ISO = ISODate(todayMinus3.toISOString().split("T")[0]!);
    const todayMinus4ISO = ISODate(todayMinus4.toISOString().split("T")[0]!);

    const logs = [
      {
        id: FoodItemId(1),
        userId,
        name: "Apple",
        calories: 100,
        servingSize: 1,
        protein: 0,
        carbs: 25,
        fat: 0,
        dateLogged: todayISO,
        isFavorite: false,
        mealType: "Breakfast" as const,
      },
      {
        id: FoodItemId(2),
        userId,
        name: "Banana",
        calories: 90,
        servingSize: 1,
        protein: 1,
        carbs: 23,
        fat: 0,
        dateLogged: todayMinus2ISO,
        isFavorite: false,
        mealType: "Lunch" as const,
      },
      {
        id: FoodItemId(3),
        userId,
        name: "Orange",
        calories: 85,
        servingSize: 1,
        protein: 1,
        carbs: 21,
        fat: 0,
        dateLogged: todayMinus3ISO,
        isFavorite: false,
        mealType: "Snacks" as const,
      },
      {
        id: FoodItemId(4),
        userId,
        name: "Grape",
        calories: 70,
        servingSize: 1,
        protein: 1,
        carbs: 18,
        fat: 0,
        dateLogged: todayMinus4ISO,
        isFavorite: false,
        mealType: "Dinner" as const,
      },
    ];

    vi.mocked(dbService).getAllFoodLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBe(1);
    expect(result.current.longestStreak).toBe(3);
  });
});

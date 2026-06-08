import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { calculateTotalCalories, useFoodForm } from "./useFoodForm";
import { DEFAULT_MEAL_TYPE, FoodItemId, ISODate, MEAL_TYPES, UserId } from "../types";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return actual;
});

describe("useFoodForm", () => {
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

  it("should return hook with form, isLoading, isEditMode, submitFoodLog, and resetForm", () => {
    const { result } = renderHook(() => useFoodForm());
    expect(result.current.form).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(typeof result.current.submitFoodLog).toBe("function");
    expect(typeof result.current.resetForm).toBe("function");
  });

  it("should have correct default values for new food log", () => {
    const { result } = renderHook(() => useFoodForm());
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("calories")).toBe(0);
    expect(result.current.form.getValues("servingSize")).toBe(1);
    expect(result.current.form.getValues("mealType")).toBe(DEFAULT_MEAL_TYPE);
  });

  it("should be in edit mode when initial food provided", () => {
    const initialFood = {
      id: FoodItemId(1),
      userId,
      name: "Apple",
      calories: 95,
      servingSize: 1,
      protein: 0,
      carbs: 25,
      fat: 0,
      dateLogged: ISODate("2026-05-16"),
      isFavorite: false,
      mealType: "Breakfast" as const,
    };

    const { result } = renderHook(() => useFoodForm(initialFood));
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.form.getValues("name")).toBe("Apple");
  });

  it("should handle submit when user not initialized", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId: null,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFoodForm());
    const success = await result.current.submitFoodLog();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Not ready - please refresh");
  });

  it("should reset form to initial state", () => {
    const { result } = renderHook(() => useFoodForm());

    result.current.form.setValue("name", "Test");
    expect(result.current.form.getValues("name")).toBe("Test");

    result.current.resetForm();
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("calories")).toBe(0);
  });

  describe("meal type defaults", () => {
    it("DEFAULT_MEAL_TYPE should be Breakfast", () => {
      expect(DEFAULT_MEAL_TYPE).toBe("Breakfast");
    });

    it("MEAL_TYPES should contain all 4 expected values", () => {
      expect(MEAL_TYPES).toHaveLength(4);
      expect(MEAL_TYPES).toContain("Breakfast");
      expect(MEAL_TYPES).toContain("Lunch");
      expect(MEAL_TYPES).toContain("Snacks");
      expect(MEAL_TYPES).toContain("Dinner");
    });
  });

  describe("calculateTotalCalories", () => {
    it("should multiply caloriesPerServing by servingSize", () => {
      const result = calculateTotalCalories(95, 2);
      expect(result).toBe(190);
    });

    it("should handle single serving", () => {
      const result = calculateTotalCalories(105, 1);
      expect(result).toBe(105);
    });

    it("should handle decimal calories per serving", () => {
      const result = calculateTotalCalories(95.5, 2);
      expect(result).toBe(191);
    });

    it("should handle zero calories", () => {
      const result = calculateTotalCalories(0, 5);
      expect(result).toBe(0);
    });

    it("should round correctly", () => {
      const result = calculateTotalCalories(100.4, 1.5);
      expect(result).toBe(151);
    });
  });

  describe("submitFoodLog", () => {
    it("should successfully add a new food log", async () => {
      const addFoodLogMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: addFoodLogMock,
        updateFoodLog: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useFoodForm());

      await act(async () => {
        result.current.form.setValue("name", "Apple");
        result.current.form.setValue("calories", 95);
        result.current.form.setValue("servingSize", 1);
        result.current.form.setValue("protein", 0);
        result.current.form.setValue("carbs", 25);
        result.current.form.setValue("fat", 0);
        result.current.form.setValue("mealType", "Breakfast");
      });

      const success = await result.current.submitFoodLog();

      expect(success).toBe(true);
      expect(addFoodLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          name: "Apple",
          calories: 95,
          servingSize: 1,
          protein: 0,
          carbs: 25,
          fat: 0,
          mealType: "Breakfast",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Apple logged");
    });

    it("should successfully update an existing food log", async () => {
      const updateFoodLogMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: vi.fn(),
        updateFoodLog: updateFoodLogMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const existingFood = {
        id: FoodItemId(1),
        userId,
        name: "Apple",
        calories: 95,
        servingSize: 1,
        protein: 0,
        carbs: 25,
        fat: 0,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: "Breakfast" as const,
      };

      const { result } = renderHook(() => useFoodForm(existingFood));

      await act(async () => {
        result.current.form.setValue("calories", 100);
        result.current.form.setValue("name", "Green Apple");
      });

      const success = await result.current.submitFoodLog();

      expect(success).toBe(true);
      expect(updateFoodLogMock).toHaveBeenCalledWith(
        FoodItemId(1),
        expect.objectContaining({
          name: "Green Apple",
          calories: 100,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Green Apple updated");
    });

    it("should handle submission failure gracefully", async () => {
      const addFoodLogMock = vi.fn().mockRejectedValue(new Error("DB error"));
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: addFoodLogMock,
        updateFoodLog: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useFoodForm());

      await act(async () => {
        result.current.form.setValue("name", "Apple");
        result.current.form.setValue("calories", 95);
      });

      const success = await result.current.submitFoodLog();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("Failed to save entry");
    });

    it("should calculate total calories correctly on submit", async () => {
      const addFoodLogMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: addFoodLogMock,
        updateFoodLog: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useFoodForm());

      await act(async () => {
        result.current.form.setValue("name", "Chicken");
        result.current.form.setValue("calories", 165);
        result.current.form.setValue("servingSize", 3);
      });

      await result.current.submitFoodLog();

      expect(addFoodLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 495, // 165 * 3
        }),
      );
    });

    it("should reset form after successful submission", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: vi.fn().mockResolvedValue(undefined),
        updateFoodLog: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useFoodForm());

      await act(async () => {
        result.current.form.setValue("name", "Apple");
        result.current.form.setValue("calories", 95);
      });

      await result.current.submitFoodLog();

      await waitFor(() => {
        expect(result.current.form.getValues("name")).toBe("");
        expect(result.current.form.getValues("calories")).toBe(0);
        expect(result.current.form.getValues("mealType")).toBe(DEFAULT_MEAL_TYPE);
      });
    });

    it("should handle form validation failure when required field is empty", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addFoodLog: vi.fn(),
        updateFoodLog: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useFoodForm());

      const success = await result.current.submitFoodLog();

      expect(success).toBe(false);
    });
  });

  describe("prefillFromFood", () => {
    it("populates form fields from a food item", () => {
      const { result } = renderHook(() => useFoodForm());
      const food = {
        id: FoodItemId(5),
        userId,
        name: "Banana",
        calories: 89,
        servingSize: 2,
        protein: 1,
        carbs: 23,
        fat: 0,
        dateLogged: ISODate("2026-06-01"),
        isFavorite: false,
        mealType: "Snacks" as const,
      };

      act(() => {
        result.current.prefillFromFood(food);
      });

      expect(result.current.form.getValues("name")).toBe("Banana");
      expect(result.current.form.getValues("calories")).toBe(89);
      expect(result.current.form.getValues("servingSize")).toBe(2);
      expect(result.current.form.getValues("mealType")).toBe("Snacks");
    });

    it("falls back to DEFAULT_MEAL_TYPE when food has no mealType", () => {
      const { result } = renderHook(() => useFoodForm());
      const food = {
        id: FoodItemId(6),
        userId,
        name: "Water",
        calories: 0,
        servingSize: 1,
        dateLogged: ISODate("2026-06-01"),
        isFavorite: false,
      } as Parameters<typeof result.current.prefillFromFood>[0];

      act(() => {
        result.current.prefillFromFood(food);
      });

      expect(result.current.form.getValues("mealType")).toBe(DEFAULT_MEAL_TYPE);
    });
  });

  describe("applyPortionMultiplier", () => {
    it("sets servingSize to the given factor", () => {
      const { result } = renderHook(() => useFoodForm());

      act(() => {
        result.current.applyPortionMultiplier(2);
      });

      expect(result.current.form.getValues("servingSize")).toBe(2);
    });

    it("is idempotent - calling twice with same factor leaves servingSize unchanged", () => {
      const { result } = renderHook(() => useFoodForm());

      act(() => {
        result.current.applyPortionMultiplier(1.5);
        result.current.applyPortionMultiplier(1.5);
      });

      expect(result.current.form.getValues("servingSize")).toBe(1.5);
    });

    it("overwrites a previous factor rather than multiplying", () => {
      const { result } = renderHook(() => useFoodForm());

      act(() => {
        result.current.applyPortionMultiplier(2);
        result.current.applyPortionMultiplier(0.5);
      });

      expect(result.current.form.getValues("servingSize")).toBe(0.5);
    });
  });
});

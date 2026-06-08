import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useRecipeForm } from "./useRecipeForm";
import { FoodItemId, RecipeId, UserId } from "@/types";
import { toast } from "sonner";
import * as appState from "../state/AppState";
import type { FoodItem, Recipe } from "../db/dbService";
import * as dbService from "../db/dbService";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../db/dbService");

describe("useRecipeForm", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      init: { status: "ready" as const, user: { id: userId, calorieGoal: 2000 } },
      dailyLogs: [],
      allFoodItems: [
        {
          id: FoodItemId(1),
          name: "Apple",
          calories: 95,
          servingSize: "1 medium",
        } as unknown as FoodItem,
      ],
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

    vi.mocked(dbService).saveRecipe.mockResolvedValue(RecipeId(1));
    vi.mocked(dbService).updateRecipe.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return form and controls for create mode", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.form).toBeDefined();
    expect(result.current.fields).toBeDefined();
    expect(result.current.append).toBeDefined();
    expect(result.current.remove).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mode).toBe("create");
  });

  it("should be in create mode when no initial recipe provided", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.mode).toBe("create");
  });

  it("should be in edit mode when initial recipe provided", () => {
    const recipe = {
      id: RecipeId(1),
      name: "Test Recipe",
      description: "Test description",
      ingredients: [],
      totalCalories: 100,
      createdBy: userId,
      dateCreated: "2026-05-16",
      userId,
    } as unknown as Recipe;
    const { result } = renderHook(() => useRecipeForm(userId, recipe));
    expect(result.current.mode).toBe("edit");
  });

  it("should have empty default recipe name in create mode", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.form.getValues("recipeName")).toBe("");
  });

  it("should have empty default description in create mode", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.form.getValues("description")).toBe("");
  });

  it("should start with empty ingredients array in create mode", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.fields).toHaveLength(0);
  });

  it("should populate recipe name from initial recipe", () => {
    const recipe = {
      id: RecipeId(1),
      name: "Pasta Carbonara",
      description: "Italian pasta",
      ingredients: [],
      totalCalories: 500,
      createdBy: userId,
      dateCreated: "2026-05-16",
      userId,
    } as unknown as Recipe;
    const { result } = renderHook(() => useRecipeForm(userId, recipe));
    expect(result.current.form.getValues("recipeName")).toBe("Pasta Carbonara");
  });

  it("should populate description from initial recipe", () => {
    const recipe = {
      id: RecipeId(1),
      name: "Test",
      description: "Delicious meal",
      ingredients: [],
      totalCalories: 500,
      createdBy: userId,
      dateCreated: "2026-05-16",
      userId,
    } as unknown as Recipe;
    const { result } = renderHook(() => useRecipeForm(userId, recipe));
    expect(result.current.form.getValues("description")).toBe("Delicious meal");
  });

  it("should handle missing userId on save", async () => {
    const { result } = renderHook(() => useRecipeForm(null));
    const success = await result.current.saveRecipeForm();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Not ready - please refresh");
  });

  it("should have saveRecipeForm function", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.saveRecipeForm).toBe("function");
  });

  it("should have append function for ingredients", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.append).toBe("function");
  });

  it("should have remove function for ingredients", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.remove).toBe("function");
  });

  it("should initialize with isLoading false", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.isLoading).toBe(false);
  });

  it("should have form with handleSubmit method", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.form.handleSubmit).toBe("function");
  });

  it("should have form getValues method", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.form.getValues).toBe("function");
  });

  it("should have form formState property", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.form.formState).toBeDefined();
  });

  it("should have form control property", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(result.current.form.control).toBeDefined();
  });

  it("should have form reset method", () => {
    const { result } = renderHook(() => useRecipeForm(userId));
    expect(typeof result.current.form.reset).toBe("function");
  });

  describe("saveRecipeForm", () => {
    it("should successfully save a new recipe", async () => {
      const checkAchievementsMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: checkAchievementsMock,
        allFoodItems: [
          {
            id: FoodItemId(1),
            name: "Pasta",
            calories: 220,
            servingSize: "100g",
          } as unknown as FoodItem,
        ],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useRecipeForm(userId));

      await act(async () => {
        result.current.form.setValue("recipeName", "Pasta Aglio e Olio");
        result.current.form.setValue("description", "Italian pasta");
        result.current.append({
          foodItemId: 1,
          foodItemName: "Pasta",
          calories: 220,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          serving: 1,
        });
      });

      const success = await result.current.saveRecipeForm();

      expect(success).toBe(true);
      expect(dbService.saveRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Pasta Aglio e Olio",
          description: "Italian pasta",
          createdBy: userId,
          userId,
          totalCalories: 220,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith('"Pasta Aglio e Olio" saved');
    });

    it("should successfully update an existing recipe", async () => {
      const checkAchievementsMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: checkAchievementsMock,
        allFoodItems: [
          {
            id: FoodItemId(1),
            name: "Pasta",
            calories: 220,
            servingSize: "100g",
          } as unknown as FoodItem,
        ],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const existingRecipe = {
        id: RecipeId(1),
        name: "Old Name",
        description: "Old description",
        ingredients: [{ foodItemId: FoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: "2026-05-01",
        userId,
      } as unknown as Recipe;

      const { result } = renderHook(() => useRecipeForm(userId, existingRecipe));

      await act(async () => {
        result.current.form.setValue("recipeName", "New Recipe Name");
      });

      const success = await result.current.saveRecipeForm();

      expect(success).toBe(true);
      expect(dbService.updateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Recipe Name",
          id: RecipeId(1),
        }),
        userId,
      );
      expect(toast.success).toHaveBeenCalledWith('"New Recipe Name" saved');
    });

    it("should handle save failure gracefully", async () => {
      vi.spyOn(dbService, "saveRecipe").mockRejectedValue(new Error("DB error"));
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: vi.fn(),
        allFoodItems: [{ id: FoodItemId(1), name: "Pasta", calories: 200 } as unknown as FoodItem],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useRecipeForm(userId));

      await act(async () => {
        result.current.form.setValue("recipeName", "Test Recipe");
        result.current.form.setValue("description", "Test");
        result.current.append({
          foodItemId: 1,
          foodItemName: "Pasta",
          calories: 200,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          serving: 1,
        });
      });

      const success = await result.current.saveRecipeForm();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("Failed to save recipe");
    });

    it("should handle validation errors", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: vi.fn(),
        allFoodItems: [],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useRecipeForm(userId));

      // Don't set recipe name (required field)
      const success = await result.current.saveRecipeForm();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it("should call checkAndUnlockAchievements after successful save", async () => {
      const checkAchievementsMock = vi.fn();
      vi.spyOn(dbService, "saveRecipe").mockResolvedValue(RecipeId(1));
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: checkAchievementsMock,
        allFoodItems: [{ id: FoodItemId(1), name: "Pasta", calories: 200 } as unknown as FoodItem],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useRecipeForm(userId));

      await act(async () => {
        result.current.form.setValue("recipeName", "Test");
        result.current.form.setValue("description", "Test");
        result.current.append({
          foodItemId: 1,
          foodItemName: "Pasta",
          calories: 200,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          serving: 1,
        });
      });

      await result.current.saveRecipeForm();

      // checkAndUnlockAchievements is called without await, so check if it was called
      expect(checkAchievementsMock).toHaveBeenCalled();
    });

    it("should reset form in create mode after successful save", async () => {
      vi.spyOn(dbService, "saveRecipe").mockResolvedValue(RecipeId(1));
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        checkAndUnlockAchievements: vi.fn(),
        allFoodItems: [{ id: FoodItemId(1), name: "Pasta", calories: 200 } as unknown as FoodItem],
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useRecipeForm(userId));

      await act(async () => {
        result.current.form.setValue("recipeName", "Test Recipe");
        result.current.form.setValue("description", "Test");
        result.current.append({
          foodItemId: 1,
          foodItemName: "Pasta",
          calories: 200,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          serving: 1,
        });
      });

      await result.current.saveRecipeForm();

      await waitFor(() => {
        expect(result.current.form.getValues("recipeName")).toBe("");
      });
    });
  });
});

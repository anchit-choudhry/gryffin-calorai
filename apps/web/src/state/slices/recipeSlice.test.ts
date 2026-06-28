import { beforeEach, describe, expect, it, vi } from "vitest";
import { create, type StateCreator } from "zustand";
import { createRecipeSlice, type RecipeSlice } from "./recipeSlice";
import type { Recipe } from "../../db/dbService";
import type { FoodItemId, RecipeId, UserId } from "@/types";
import * as syncService from "../../hooks/useSyncService";

const mockGetAllRecipes = vi.hoisted(() => vi.fn());
const mockDeleteRecipe = vi.hoisted(() => vi.fn());
const mockUpdateRecipe = vi.hoisted(() => vi.fn());

vi.mock("../../db/dbService", () => ({
  getAllRecipes: mockGetAllRecipes,
  deleteRecipe: mockDeleteRecipe,
  updateRecipe: mockUpdateRecipe,
}));

vi.mock("../../hooks/useSyncService", () => ({
  enqueueSyncOperation: vi.fn().mockResolvedValue(undefined),
}));

type TestState = RecipeSlice & {
  userId: UserId | null;
  error: string | null;
  fetchRecipes: (userId: UserId) => Promise<void>;
};

function makeStore() {
  return create<TestState>()((set, get, api) => ({
    userId: null,
    error: null,
    ...(createRecipeSlice as unknown as StateCreator<TestState, [], [], RecipeSlice>)(
      set,
      get,
      api,
    ),
  }));
}

describe("recipeSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllRecipes.mockResolvedValue([]);
    mockDeleteRecipe.mockResolvedValue(undefined);
    mockUpdateRecipe.mockResolvedValue(undefined);
  });

  describe("fetchRecipes", () => {
    it("populates recipes from DB", async () => {
      const recipe: Recipe = {
        id: 1 as unknown as RecipeId,
        name: "Oatmeal",
        description: "Breakfast bowl",
        ingredients: [],
        totalCalories: 300,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      mockGetAllRecipes.mockResolvedValueOnce([recipe]);
      const store = makeStore();
      await store.getState().fetchRecipes("user-1" as UserId);
      expect(store.getState().recipes).toStrictEqual([recipe]);
    });

    it("sets error on DB failure", async () => {
      mockGetAllRecipes.mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      await store.getState().fetchRecipes("user-1" as UserId);
      expect(store.getState().error).toBeTruthy();
    });
  });

  describe("deleteRecipe", () => {
    it("returns early when userId is null", async () => {
      const store = makeStore();
      await store.getState().deleteRecipe(1 as unknown as RecipeId);
      expect(mockDeleteRecipe).not.toHaveBeenCalled();
    });

    it("deletes and refreshes without enqueueing when recipe has no syncId", async () => {
      const store = makeStore();
      const recipe: Recipe = {
        id: 1 as unknown as RecipeId,
        name: "Salad",
        description: "",
        ingredients: [],
        totalCalories: 200,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      store.setState({ userId: "user-1" as UserId, recipes: [recipe] });
      await store.getState().deleteRecipe(1 as unknown as RecipeId);
      expect(mockDeleteRecipe).toHaveBeenCalled();
      expect(syncService.enqueueSyncOperation).not.toHaveBeenCalled();
    });

    it("enqueues delete when recipe has a syncId", async () => {
      const store = makeStore();
      const recipeId = 5 as unknown as RecipeId;
      const recipe: Recipe = {
        id: recipeId,
        name: "Pasta",
        description: "",
        ingredients: [],
        totalCalories: 500,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
        syncId: "recipe-delete-sync-id",
      };
      store.setState({ userId: "user-1" as UserId, recipes: [recipe] });
      await store.getState().deleteRecipe(recipeId);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "recipe",
          operation: "delete",
          syncId: "recipe-delete-sync-id",
        }),
      );
    });

    it("sets error when deleteRecipe throws", async () => {
      mockDeleteRecipe.mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      const recipe: Recipe = {
        id: 1 as unknown as RecipeId,
        name: "Test",
        description: "",
        ingredients: [],
        totalCalories: 200,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      store.setState({ userId: "user-1" as UserId, recipes: [recipe] });
      await store.getState().deleteRecipe(1 as unknown as RecipeId);
      expect(store.getState().error).toBeTruthy();
    });
  });

  describe("updateRecipe", () => {
    it("returns early when userId is null", async () => {
      const store = makeStore();
      const recipe: Recipe = {
        name: "Soup",
        description: "",
        ingredients: [{ foodItemId: 1 as unknown as FoodItemId, quantity: 1, serving: 200 }],
        totalCalories: 150,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      await store.getState().updateRecipe(recipe);
      expect(mockUpdateRecipe).not.toHaveBeenCalled();
    });

    it("updates and refreshes without enqueueing when recipe has no syncId", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const recipe: Recipe = {
        id: 2 as unknown as RecipeId,
        name: "Soup",
        description: "",
        ingredients: [],
        totalCalories: 150,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      await store.getState().updateRecipe(recipe);
      expect(mockUpdateRecipe).toHaveBeenCalled();
      expect(syncService.enqueueSyncOperation).not.toHaveBeenCalled();
    });

    it("enqueues update when recipe has a syncId", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const recipe: Recipe = {
        id: 3 as unknown as RecipeId,
        name: "Stew",
        description: "",
        ingredients: [],
        totalCalories: 400,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
        syncId: "recipe-update-sync-id",
      };
      await store.getState().updateRecipe(recipe);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "recipe",
          operation: "update",
          syncId: "recipe-update-sync-id",
        }),
      );
    });

    it("sets error when updateRecipe throws", async () => {
      mockUpdateRecipe.mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const recipe: Recipe = {
        id: 3 as unknown as RecipeId,
        name: "Stew",
        description: "",
        ingredients: [],
        totalCalories: 400,
        createdBy: "user-1" as UserId,
        dateCreated: "2026-01-01",
        userId: "user-1" as UserId,
      };
      await store.getState().updateRecipe(recipe);
      expect(store.getState().error).toBeTruthy();
    });
  });
});

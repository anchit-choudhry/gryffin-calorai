import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import {
  deleteRecipe as deleteRecipeFromDB,
  getAllRecipes,
  type Recipe,
  updateRecipe as updateRecipeInDB,
} from "../../db/dbService";
import type { RecipeId, UserId } from "@/types";

export interface RecipeSlice {
  recipes: Recipe[];
  fetchRecipes: (userId: UserId) => Promise<void>;
  deleteRecipe: (id: RecipeId) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
}

export const createRecipeSlice: StateCreator<AppState, [], [], RecipeSlice> = (set, get) => ({
  recipes: [],

  fetchRecipes: async (userId: UserId) => {
    try {
      const recipeList = await getAllRecipes(userId);
      set({ recipes: recipeList });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch recipes");
      if (import.meta.env.DEV) console.error("Error fetching recipes:", error);
      set({ error: message });
    }
  },

  deleteRecipe: async (id: RecipeId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteRecipeFromDB(id, state.userId);
      await state.fetchRecipes(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete recipe");
      if (import.meta.env.DEV) console.error("Error deleting recipe:", error);
      set({ error: message });
    }
  },

  updateRecipe: async (recipe: Recipe) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateRecipeInDB(recipe, state.userId);
      await state.fetchRecipes(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update recipe");
      if (import.meta.env.DEV) console.error("Error updating recipe:", error);
      set({ error: message });
    }
  },
});

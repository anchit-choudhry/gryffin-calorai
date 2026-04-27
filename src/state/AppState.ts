import { create } from "zustand";
import {
  addFoodItemLog,
  deleteFoodItem,
  deleteRecipe as deleteRecipeFromDB,
  type FoodItem,
  getAllRecipes,
  getDailyFoodLogs,
  getOrCreateUser,
  getRecentFoodItems,
  type Recipe,
  updateUserProfile,
  type UserProfile,
} from "../db/dbService";
import type { FoodItemId, RecipeId, UserId } from "../types";
import { todayISO } from "../types";

interface AppState {
  user: UserProfile | null;
  dailyLogs: FoodItem[];
  allFoodItems: FoodItem[];
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  userId: UserId | null;
  fetchInitialData: (userId: UserId) => Promise<void>;
  refreshDailyLogs: (userId: UserId) => Promise<void>;
  addFoodLog: (food: Omit<FoodItem, "id">) => Promise<void>;
  deleteFoodLog: (id: FoodItemId) => Promise<void>;
  updateCalorieGoal: (goal: number) => Promise<void>;
  fetchRecipes: (userId: UserId) => Promise<void>;
  deleteRecipe: (id: RecipeId) => Promise<void>;
  fetchAllFoodItems: (userId: UserId) => Promise<void>;
}

export const useAppState = create<AppState>((set, get) => ({
  user: null,
  dailyLogs: [],
  allFoodItems: [],
  recipes: [],
  isLoading: true,
  error: null,
  userId: null,

  fetchInitialData: async (userId: UserId) => {
    set({ isLoading: true, error: null, userId });
    try {
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com");
      set({ user: profile });

      const logs = await getDailyFoodLogs(userId, todayISO());
      const recipeList = await getAllRecipes(userId);
      const recentItems = await getRecentFoodItems(userId);
      set({ dailyLogs: logs, recipes: recipeList, allFoodItems: recentItems, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load app data";
      console.error("Error fetching initial app data:", error);
      set({ error: message, isLoading: false });
    }
  },

  refreshDailyLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyFoodLogs(userId, todayISO());
      set({ dailyLogs: logs, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh logs";
      console.error("Error refreshing daily logs:", error);
      set({ error: message });
    }
  },

  addFoodLog: async (food: Omit<FoodItem, "id">) => {
    const state = get();
    if (!state.userId) {
      const error = new Error("User not initialized");
      set({ error: error.message });
      throw error;
    }

    try {
      set({ error: null });
      await addFoodItemLog(food);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add food log";
      console.error("Error adding food log:", error);
      set({ error: message });
      throw error;
    }
  },

  deleteFoodLog: async (id: FoodItemId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteFoodItem(id);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete log";
      console.error("Error deleting food log:", error);
      set({ error: message });
    }
  },

  updateCalorieGoal: async (goal: number) => {
    const state = get();
    if (!state.user) return;
    try {
      const updatedUser = { ...state.user, calorieGoal: goal };
      await updateUserProfile(updatedUser);
      set({ user: updatedUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update goal";
      console.error("Error updating calorie goal:", error);
      set({ error: message });
    }
  },

  fetchRecipes: async (userId: UserId) => {
    try {
      const recipeList = await getAllRecipes(userId);
      set({ recipes: recipeList });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch recipes";
      console.error("Error fetching recipes:", error);
      set({ error: message });
    }
  },

  deleteRecipe: async (id: RecipeId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteRecipeFromDB(id);
      await state.fetchRecipes(state.userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete recipe";
      console.error("Error deleting recipe:", error);
      set({ error: message });
    }
  },

  fetchAllFoodItems: async (userId: UserId) => {
    try {
      const items = await getRecentFoodItems(userId);
      set({ allFoodItems: items });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch food items";
      console.error("Error fetching food items:", error);
      set({ error: message });
    }
  },
}));

import { create } from "zustand";
import { mapDbError } from "../lib/utils";
import {
  addBodyMeasurement as addBodyMeasurementToDB,
  addFoodItemLog,
  addWaterLog as addWaterLogToDB,
  type BodyMeasurement,
  deleteBodyMeasurement as deleteBodyMeasurementFromDB,
  deleteFoodItem,
  deleteRecipe as deleteRecipeFromDB,
  deleteWaterLog as deleteWaterLogFromDB,
  type FoodItem,
  getAllBodyMeasurements,
  getAllRecipes,
  getDailyFoodLogs,
  getDailyWaterLogs,
  getFavoriteFoodItems,
  getOrCreateUser,
  getRecentFoodItems,
  type Recipe,
  toggleFavoriteFoodItem,
  updateFoodItem,
  updateUserProfile,
  type WaterLog,
} from "../db/dbService";
import type {
  AppInitState,
  BodyMeasurementId,
  FoodItemId,
  RecipeId,
  UserId,
  WaterLogId,
} from "../types";
import { todayISO } from "../types";

interface AppState {
  init: AppInitState;
  dailyLogs: FoodItem[];
  allFoodItems: FoodItem[];
  recipes: Recipe[];
  favoriteFoods: FoodItem[];
  dailyWaterLogs: WaterLog[];
  bodyMeasurements: BodyMeasurement[];
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
  fetchFavorites: (userId: UserId) => Promise<void>;
  toggleFavorite: (id: FoodItemId, isFavorite: boolean) => Promise<void>;
  updateFoodLog: (
    id: FoodItemId,
    updates: Partial<Omit<FoodItem, "id" | "userId">>,
  ) => Promise<void>;
  fetchDailyWaterLogs: (userId: UserId) => Promise<void>;
  addWaterLog: (amount: number) => Promise<void>;
  deleteWaterLog: (id: WaterLogId) => Promise<void>;
  fetchBodyMeasurements: (userId: UserId) => Promise<void>;
  addBodyMeasurement: (m: Omit<BodyMeasurement, "id">) => Promise<void>;
  deleteBodyMeasurement: (id: BodyMeasurementId) => Promise<void>;
}

export const useAppState = create<AppState>((set, get) => ({
  init: { status: "idle" },
  dailyLogs: [],
  allFoodItems: [],
  recipes: [],
  favoriteFoods: [],
  dailyWaterLogs: [],
  bodyMeasurements: [],
  error: null,
  userId: null,

  fetchInitialData: async (userId: UserId) => {
    set({ init: { status: "loading" }, userId });
    try {
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com");

      const logs = await getDailyFoodLogs(userId, todayISO());
      const recipeList = await getAllRecipes(userId);
      const recentItems = await getRecentFoodItems(userId);
      const favorites = await getFavoriteFoodItems(userId);
      const waterLogsToday = await getDailyWaterLogs(userId, todayISO());
      const measurements = await getAllBodyMeasurements(userId);
      set({
        init: { status: "ready", user: profile },
        dailyLogs: logs,
        recipes: recipeList,
        allFoodItems: recentItems,
        favoriteFoods: favorites,
        dailyWaterLogs: waterLogsToday,
        bodyMeasurements: measurements,
      });
    } catch (error) {
      const message = mapDbError(error, "Failed to load app data");
      console.error("Error fetching initial app data:", error);
      set({ init: { status: "error", message } });
    }
  },

  refreshDailyLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyFoodLogs(userId, todayISO());
      set({ dailyLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to refresh logs");
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
      await addFoodItemLog({ ...food, userId: state.userId });
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to add food log");
      console.error("Error adding food log:", error);
      set({ error: message });
      throw error;
    }
  },

  deleteFoodLog: async (id: FoodItemId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteFoodItem(id, state.userId);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete log");
      console.error("Error deleting food log:", error);
      set({ error: message });
    }
  },

  updateCalorieGoal: async (goal: number) => {
    if (!Number.isFinite(goal) || goal < 1 || goal > 99999) return;
    const state = get();
    if (state.init.status !== "ready" || !state.userId) return;
    try {
      const updatedUser = { ...state.init.user, calorieGoal: goal };
      await updateUserProfile(updatedUser, state.userId);
      set({ init: { status: "ready", user: updatedUser } });
    } catch (error) {
      const message = mapDbError(error, "Failed to update goal");
      console.error("Error updating calorie goal:", error);
      set({ error: message });
    }
  },

  fetchRecipes: async (userId: UserId) => {
    try {
      const recipeList = await getAllRecipes(userId);
      set({ recipes: recipeList });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch recipes");
      console.error("Error fetching recipes:", error);
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
      console.error("Error deleting recipe:", error);
      set({ error: message });
    }
  },

  fetchAllFoodItems: async (userId: UserId) => {
    try {
      const items = await getRecentFoodItems(userId);
      set({ allFoodItems: items });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch food items");
      console.error("Error fetching food items:", error);
      set({ error: message });
    }
  },

  fetchFavorites: async (userId: UserId) => {
    try {
      const favorites = await getFavoriteFoodItems(userId);
      set({ favoriteFoods: favorites });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch favorites");
      console.error("Error fetching favorites:", error);
      set({ error: message });
    }
  },

  toggleFavorite: async (id: FoodItemId, isFavorite: boolean) => {
    const state = get();
    if (!state.userId) return;
    try {
      await toggleFavoriteFoodItem(id, isFavorite, state.userId);
      await state.fetchFavorites(state.userId);
      await state.fetchAllFoodItems(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to toggle favorite");
      console.error("Error toggling favorite:", error);
      set({ error: message });
    }
  },

  updateFoodLog: async (id: FoodItemId, updates: Partial<Omit<FoodItem, "id" | "userId">>) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateFoodItem(id, updates, state.userId);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update food log");
      console.error("Error updating food log:", error);
      set({ error: message });
    }
  },

  fetchDailyWaterLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyWaterLogs(userId, todayISO());
      set({ dailyWaterLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch water logs");
      console.error("Error fetching water logs:", error);
      set({ error: message });
    }
  },

  addWaterLog: async (amount: number) => {
    const state = get();
    if (!state.userId) return;
    try {
      const log: WaterLog = {
        userId: state.userId,
        amount,
        dateLogged: todayISO(),
        loggedAt: new Date().toISOString(),
      };
      await addWaterLogToDB(log);
      await state.fetchDailyWaterLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to add water log");
      console.error("Error adding water log:", error);
      set({ error: message });
    }
  },

  deleteWaterLog: async (id: WaterLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteWaterLogFromDB(id, state.userId);
      await state.fetchDailyWaterLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete water log");
      console.error("Error deleting water log:", error);
      set({ error: message });
    }
  },

  fetchBodyMeasurements: async (userId: UserId) => {
    try {
      const measurements = await getAllBodyMeasurements(userId);
      set({ bodyMeasurements: measurements, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch body measurements");
      console.error("Error fetching body measurements:", error);
      set({ error: message });
    }
  },

  addBodyMeasurement: async (m: Omit<BodyMeasurement, "id">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addBodyMeasurementToDB({ ...m, userId: state.userId });
      await state.fetchBodyMeasurements(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to add measurement");
      console.error("Error adding body measurement:", error);
      set({ error: message });
    }
  },

  deleteBodyMeasurement: async (id: BodyMeasurementId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteBodyMeasurementFromDB(id, state.userId);
      await state.fetchBodyMeasurements(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete measurement");
      console.error("Error deleting body measurement:", error);
      set({ error: message });
    }
  },
}));

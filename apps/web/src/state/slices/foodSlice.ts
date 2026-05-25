import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import { toast } from "sonner";
import {
  addFoodItemLog,
  deleteFoodItem,
  type FoodItem,
  getFavoriteFoodItems,
  getRecentFoodItems,
  toggleFavoriteFoodItem,
  updateFoodItem,
} from "../../db/dbService";
import type { FoodItemId } from "@/types";
import { checkFoodNameRestrictions, RESTRICTION_FLAGS } from "@/types";

export interface FoodSlice {
  dailyLogs: FoodItem[];
  allFoodItems: FoodItem[];
  favoriteFoods: FoodItem[];
  addFoodLog: (food: Omit<FoodItem, "id">) => Promise<void>;
  deleteFoodLog: (id: FoodItemId) => Promise<void>;
  updateFoodLog: (
    id: FoodItemId,
    updates: Partial<Omit<FoodItem, "id" | "userId">>,
  ) => Promise<void>;
  fetchAllFoodItems: (userId: import("@/types").UserId) => Promise<void>;
  fetchFavorites: (userId: import("@/types").UserId) => Promise<void>;
  toggleFavorite: (id: FoodItemId, isFavorite: boolean) => Promise<void>;
}

export const createFoodSlice: StateCreator<AppState, [], [], FoodSlice> = (set, get) => ({
  dailyLogs: [],
  allFoodItems: [],
  favoriteFoods: [],

  addFoodLog: async (food: Omit<FoodItem, "id">) => {
    const state = get();
    if (!state.userId) {
      const error = new Error("User not initialized");
      set({ error: error.message });
      throw error;
    }
    try {
      set({ error: null });
      const { dietProfile } = get();
      if (dietProfile && dietProfile.restrictions.length > 0) {
        const violated = checkFoodNameRestrictions(food.name, dietProfile.restrictions);
        if (violated.length > 0) {
          const flagLabels = violated.map((f) => RESTRICTION_FLAGS[f].label).join(", ");
          toast.warning(`"${food.name}" may contain: ${flagLabels}`);
        }
      }
      await addFoodItemLog({ ...food, userId: state.userId });
      await state.refreshDailyLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      const message = mapDbError(error, "Failed to add food log");
      if (import.meta.env.DEV) console.error("Error adding food log:", error);
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
      if (import.meta.env.DEV) console.error("Error deleting food log:", error);
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
      if (import.meta.env.DEV) console.error("Error updating food log:", error);
      set({ error: message });
    }
  },

  fetchAllFoodItems: async (userId) => {
    try {
      const items = await getRecentFoodItems(userId);
      set({ allFoodItems: items });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch food items");
      if (import.meta.env.DEV) console.error("Error fetching food items:", error);
      set({ error: message });
    }
  },

  fetchFavorites: async (userId) => {
    try {
      const favorites = await getFavoriteFoodItems(userId);
      set({ favoriteFoods: favorites });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch favorites");
      if (import.meta.env.DEV) console.error("Error fetching favorites:", error);
      set({ error: message });
    }
  },

  toggleFavorite: async (id: FoodItemId, isFavorite: boolean) => {
    const state = get();
    if (!state.userId) return;
    const prevAllFoodItems = state.allFoodItems;
    const prevFavoriteFoods = state.favoriteFoods;
    const prevDailyLogs = state.dailyLogs;
    set({
      allFoodItems: state.allFoodItems.map((f) => (f.id === id ? { ...f, isFavorite } : f)),
      favoriteFoods: isFavorite
        ? [
            ...state.favoriteFoods.filter((f) => f.id !== id),
            ...(state.allFoodItems.find((f) => f.id === id)
              ? [{ ...state.allFoodItems.find((f) => f.id === id)!, isFavorite: true }]
              : []),
          ]
        : state.favoriteFoods.filter((f) => f.id !== id),
      dailyLogs: state.dailyLogs.map((f) => (f.id === id ? { ...f, isFavorite } : f)),
    });
    try {
      await toggleFavoriteFoodItem(id, isFavorite, state.userId);
    } catch (error) {
      set({
        allFoodItems: prevAllFoodItems,
        favoriteFoods: prevFavoriteFoods,
        dailyLogs: prevDailyLogs,
      });
      const message = mapDbError(error, "Failed to toggle favorite");
      if (import.meta.env.DEV) console.error("Error toggling favorite:", error);
      set({ error: message });
      toast.error(message);
    }
  },
});

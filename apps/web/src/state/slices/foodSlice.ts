import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import { toast } from "sonner";
import {
  addFoodItemLog,
  copyFoodLogs,
  deleteFoodItem,
  type FoodItem,
  getFavoriteFoodItems,
  getRecentFoodItems,
  toggleFavoriteFoodItem,
  updateFoodItem,
} from "../../db/dbService";
import type { FoodItemId } from "@/types";
import { checkFoodNameRestrictions, RESTRICTION_FLAGS, shiftISODate } from "@/types";
import { enqueueSyncOperation } from "../../hooks/useSyncService";

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
  copyYesterdayLogs: () => Promise<void>;
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
      const syncId = crypto.randomUUID();
      await addFoodItemLog({ ...food, userId: state.userId, syncId });
      await state.refreshDailyLogs(state.userId);
      void enqueueSyncOperation({
        userId: state.userId,
        entityType: "foodItem",
        syncId,
        operation: "create",
        payload: { ...food, userId: state.userId, syncId },
      });
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
    const syncId = [...state.dailyLogs, ...state.allFoodItems].find((f) => f.id === id)?.syncId;
    try {
      await deleteFoodItem(id, state.userId);
      await state.refreshDailyLogs(state.userId);
      if (syncId) {
        void enqueueSyncOperation({
          userId: state.userId,
          entityType: "foodItem",
          syncId,
          operation: "delete",
          payload: {},
        });
      }
    } catch (error) {
      const message = mapDbError(error, "Failed to delete log");
      if (import.meta.env.DEV) console.error("Error deleting food log:", error);
      set({ error: message });
    }
  },

  updateFoodLog: async (id: FoodItemId, updates: Partial<Omit<FoodItem, "id" | "userId">>) => {
    const state = get();
    if (!state.userId) return;
    const syncId = [...state.dailyLogs, ...state.allFoodItems].find((f) => f.id === id)?.syncId;
    try {
      await updateFoodItem(id, updates, state.userId);
      await state.refreshDailyLogs(state.userId);
      if (syncId) {
        void enqueueSyncOperation({
          userId: state.userId,
          entityType: "foodItem",
          syncId,
          operation: "update",
          payload: updates,
        });
      }
    } catch (error) {
      const message = mapDbError(error, "Failed to update food log");
      if (import.meta.env.DEV) console.error("Error updating food log:", error);
      set({ error: message });
    }
  },

  fetchAllFoodItems: async (userId) => {
    try {
      const items = await getRecentFoodItems(userId, 90);
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

  copyYesterdayLogs: async () => {
    const state = get();
    if (!state.userId) return;
    const yesterdayISO = shiftISODate(state.selectedDate, -1);
    try {
      await copyFoodLogs(yesterdayISO, state.selectedDate, state.userId);
      await state.refreshDailyLogs(state.userId);
      toast.success("Yesterday's meals copied");
    } catch (error) {
      const message = mapDbError(error, "Failed to copy yesterday's logs");
      if (import.meta.env.DEV) console.error("Error copying logs:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  toggleFavorite: async (id: FoodItemId, isFavorite: boolean) => {
    const state = get();
    if (!state.userId) return;
    const syncId = state.allFoodItems.find((f) => f.id === id)?.syncId;
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
      if (syncId) {
        void enqueueSyncOperation({
          userId: state.userId,
          entityType: "foodItem",
          syncId,
          operation: "update",
          payload: { isFavorite },
        });
      }
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

import { create } from "zustand";
import {
  addFoodItemLog,
  type FoodItem,
  getDailyFoodLogs,
  getOrCreateUser,
  type UserProfile,
} from "../db/dbService";
import type { UserId } from "../types";
import { todayISO } from "../types";

interface AppState {
  user: UserProfile | null;
  dailyLogs: FoodItem[];
  isLoading: boolean;
  error: string | null;
  userId: UserId | null;
  fetchInitialData: (userId: UserId) => Promise<void>;
  refreshDailyLogs: (userId: UserId) => Promise<void>;
  addFoodLog: (food: Omit<FoodItem, "id">) => Promise<void>;
}

export const useAppState = create<AppState>((set, get) => ({
  user: null,
  dailyLogs: [],
  isLoading: true,
  error: null,
  userId: null,

  fetchInitialData: async (userId: UserId) => {
    set({ isLoading: true, error: null, userId });
    try {
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com");
      set({ user: profile });

      const logs = await getDailyFoodLogs(userId, todayISO());
      set({ dailyLogs: logs, isLoading: false });
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
}));

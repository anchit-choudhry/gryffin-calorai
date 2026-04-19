import { create } from "zustand";
import {
  type FoodItem,
  getDailyFoodLogs,
  getOrCreateUser,
  type UserProfile,
} from "../db/dbService";

interface AppState {
  user: UserProfile | null;
  dailyLogs: FoodItem[];
  isLoading: boolean;
  fetchInitialData: (userId: string) => Promise<void>;
}

// Initial state setup
export const useAppState = create<AppState>((set) => ({
  user: null,
  dailyLogs: [],
  isLoading: true,

  fetchInitialData: async (userId: string) => {
    set({ isLoading: true });
    try {
      // 1. Ensure User Profile exists and fetch/update the user record
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com"); // Use default guest info for now
      set({ user: profile, isLoading: false });

      // 2. Load Daily Logs
      const logs = await getDailyFoodLogs(userId, new Date().toISOString().split("T")[0]);
      set({ dailyLogs: logs, isLoading: false });
    } catch (error) {
      console.error("Error fetching initial app data:", error);
      set({ isLoading: false });
    }
  },
}));

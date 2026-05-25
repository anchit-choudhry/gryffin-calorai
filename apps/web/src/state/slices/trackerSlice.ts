import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import { toast } from "sonner";
import {
  addStepLog as addStepLogToDB,
  addWaterLog as addWaterLogToDB,
  deleteStepLog as deleteStepLogFromDB,
  deleteWaterLog as deleteWaterLogFromDB,
  getDailyStepLogs,
  getDailyWaterLogs,
  type StepLog,
  type WaterLog,
} from "../../db/dbService";
import type { StepLogId, UserId, WaterLogId } from "@/types";
import { todayISO } from "@/types";

export interface TrackerSlice {
  dailyWaterLogs: WaterLog[];
  dailyStepLogs: StepLog[];
  fetchDailyWaterLogs: (userId: UserId) => Promise<void>;
  addWaterLog: (amount: number) => Promise<void>;
  deleteWaterLog: (id: WaterLogId) => Promise<void>;
  fetchDailyStepLogs: (userId: UserId) => Promise<void>;
  addStepLog: (steps: number) => Promise<void>;
  deleteStepLog: (id: StepLogId) => Promise<void>;
}

export const createTrackerSlice: StateCreator<AppState, [], [], TrackerSlice> = (set, get) => ({
  dailyWaterLogs: [],
  dailyStepLogs: [],

  fetchDailyWaterLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyWaterLogs(userId, todayISO());
      set({ dailyWaterLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch water logs");
      if (import.meta.env.DEV) console.error("Error fetching water logs:", error);
      set({ error: message });
    }
  },

  addWaterLog: async (amount: number) => {
    const state = get();
    if (!state.userId) return;
    const optimisticLog: WaterLog = {
      userId: state.userId,
      amount,
      dateLogged: todayISO(),
      loggedAt: new Date().toISOString(),
    };
    const prevWaterLogs = state.dailyWaterLogs;
    set({ dailyWaterLogs: [...state.dailyWaterLogs, optimisticLog] });
    try {
      await addWaterLogToDB(optimisticLog);
      await get().fetchDailyWaterLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      set({ dailyWaterLogs: prevWaterLogs });
      const message = mapDbError(error, "Failed to add water log");
      if (import.meta.env.DEV) console.error("Error adding water log:", error);
      set({ error: message });
      toast.error(message);
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
      if (import.meta.env.DEV) console.error("Error deleting water log:", error);
      set({ error: message });
    }
  },

  fetchDailyStepLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyStepLogs(userId, todayISO());
      set({ dailyStepLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch step logs");
      if (import.meta.env.DEV) console.error("Error fetching step logs:", error);
      set({ error: message });
    }
  },

  addStepLog: async (steps: number) => {
    const state = get();
    if (!state.userId) return;
    const optimisticLog: StepLog = {
      userId: state.userId,
      steps,
      dateLogged: todayISO(),
      loggedAt: new Date().toISOString(),
    };
    const prevStepLogs = state.dailyStepLogs;
    set({ dailyStepLogs: [...state.dailyStepLogs, optimisticLog] });
    try {
      await addStepLogToDB(optimisticLog);
      await get().fetchDailyStepLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      set({ dailyStepLogs: prevStepLogs });
      const message = mapDbError(error, "Failed to add step log");
      if (import.meta.env.DEV) console.error("Error adding step log:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteStepLog: async (id: StepLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteStepLogFromDB(id, state.userId);
      await state.fetchDailyStepLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete step log");
      if (import.meta.env.DEV) console.error("Error deleting step log:", error);
      set({ error: message });
    }
  },
});

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
import { enqueueSyncOperation } from "../../hooks/useSyncService";

export interface TrackerSlice {
  dailyWaterLogs: WaterLog[];
  dailyStepLogs: StepLog[];
  fetchDailyWaterLogs: (userId: UserId) => Promise<void>;
  addWaterLog: (amount: number) => Promise<WaterLogId | undefined>;
  deleteWaterLog: (id: WaterLogId) => Promise<void>;
  fetchDailyStepLogs: (userId: UserId) => Promise<void>;
  addStepLog: (steps: number) => Promise<StepLogId | undefined>;
  deleteStepLog: (id: StepLogId) => Promise<void>;
}

export const createTrackerSlice: StateCreator<AppState, [], [], TrackerSlice> = (set, get) => ({
  dailyWaterLogs: [],
  dailyStepLogs: [],

  fetchDailyWaterLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyWaterLogs(userId, get().selectedDate);
      set({ dailyWaterLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch water logs");
      if (import.meta.env.DEV) console.error("Error fetching water logs:", error);
      set({ error: message });
    }
  },

  addWaterLog: async (amount: number): Promise<WaterLogId | undefined> => {
    const state = get();
    if (!state.userId) return undefined;
    const syncId = crypto.randomUUID();
    const optimisticLog: WaterLog = {
      userId: state.userId,
      amount,
      dateLogged: state.selectedDate,
      loggedAt: new Date().toISOString(),
      syncId,
    };
    const prevWaterLogs = state.dailyWaterLogs;
    set({ dailyWaterLogs: [...state.dailyWaterLogs, optimisticLog] });
    try {
      const id = await addWaterLogToDB(optimisticLog);
      await get().fetchDailyWaterLogs(state.userId);
      void enqueueSyncOperation({
        userId: state.userId,
        entityType: "waterLog",
        syncId,
        operation: "create",
        payload: optimisticLog,
      });
      void get().checkAndUnlockAchievements();
      return id;
    } catch (error) {
      set({ dailyWaterLogs: prevWaterLogs });
      const message = mapDbError(error, "Failed to add water log");
      if (import.meta.env.DEV) console.error("Error adding water log:", error);
      set({ error: message });
      toast.error(message);
      return undefined;
    }
  },

  deleteWaterLog: async (id: WaterLogId) => {
    const state = get();
    if (!state.userId) return;
    const syncId = state.dailyWaterLogs.find((l) => l.id === id)?.syncId;
    try {
      await deleteWaterLogFromDB(id, state.userId);
      await state.fetchDailyWaterLogs(state.userId);
      if (syncId) {
        void enqueueSyncOperation({
          userId: state.userId,
          entityType: "waterLog",
          syncId,
          operation: "delete",
          payload: {},
        });
      }
    } catch (error) {
      const message = mapDbError(error, "Failed to delete water log");
      if (import.meta.env.DEV) console.error("Error deleting water log:", error);
      set({ error: message });
    }
  },

  fetchDailyStepLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyStepLogs(userId, get().selectedDate);
      set({ dailyStepLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch step logs");
      if (import.meta.env.DEV) console.error("Error fetching step logs:", error);
      set({ error: message });
    }
  },

  addStepLog: async (steps: number): Promise<StepLogId | undefined> => {
    const state = get();
    if (!state.userId) return undefined;
    const syncId = crypto.randomUUID();
    const optimisticLog: StepLog = {
      userId: state.userId,
      steps,
      dateLogged: state.selectedDate,
      loggedAt: new Date().toISOString(),
      syncId,
    };
    const prevStepLogs = state.dailyStepLogs;
    set({ dailyStepLogs: [...state.dailyStepLogs, optimisticLog] });
    try {
      const id = await addStepLogToDB(optimisticLog);
      await get().fetchDailyStepLogs(state.userId);
      void enqueueSyncOperation({
        userId: state.userId,
        entityType: "stepLog",
        syncId,
        operation: "create",
        payload: optimisticLog,
      });
      void get().checkAndUnlockAchievements();
      return id;
    } catch (error) {
      set({ dailyStepLogs: prevStepLogs });
      const message = mapDbError(error, "Failed to add step log");
      if (import.meta.env.DEV) console.error("Error adding step log:", error);
      set({ error: message });
      toast.error(message);
      return undefined;
    }
  },

  deleteStepLog: async (id: StepLogId) => {
    const state = get();
    if (!state.userId) return;
    const syncId = state.dailyStepLogs.find((l) => l.id === id)?.syncId;
    try {
      await deleteStepLogFromDB(id, state.userId);
      await state.fetchDailyStepLogs(state.userId);
      if (syncId) {
        void enqueueSyncOperation({
          userId: state.userId,
          entityType: "stepLog",
          syncId,
          operation: "delete",
          payload: {},
        });
      }
    } catch (error) {
      const message = mapDbError(error, "Failed to delete step log");
      if (import.meta.env.DEV) console.error("Error deleting step log:", error);
      set({ error: message });
    }
  },
});

import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import { toast } from "sonner";
import {
  type ActivityLog,
  addActivityLog as addActivityLogToDB,
  deleteActivityLog as deleteActivityLogFromDB,
  endFastingSession as endFastingSessionInDB,
  type FastingSession,
  getActiveFastingSession,
  getAllActivityLogs,
  getAllFastingSessions,
  getDailyActivityLogs,
  startFastingSession as startFastingSessionInDB,
} from "../../db/dbService";
import type { ActivityLogId, UserId } from "@/types";
import { todayISO } from "@/types";

export interface ActivitySlice {
  dailyActivityLogs: ActivityLog[];
  allActivityLogs: ActivityLog[];
  activeFastingSession: FastingSession | null;
  fastingHistory: FastingSession[];
  fetchDailyActivityLogs: (userId: UserId) => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, "id">) => Promise<void>;
  deleteActivityLog: (id: ActivityLogId) => Promise<void>;
  fetchFastingSessions: (userId: UserId) => Promise<void>;
  startFasting: (targetHours: number) => Promise<void>;
  endFasting: (completed: boolean) => Promise<void>;
}

export const createActivitySlice: StateCreator<AppState, [], [], ActivitySlice> = (set, get) => ({
  dailyActivityLogs: [],
  allActivityLogs: [],
  activeFastingSession: null,
  fastingHistory: [],

  fetchDailyActivityLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyActivityLogs(userId, todayISO());
      set({ dailyActivityLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch activity logs");
      if (import.meta.env.DEV) console.error("Error fetching activity logs:", error);
      set({ error: message });
    }
  },

  addActivityLog: async (log: Omit<ActivityLog, "id">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addActivityLogToDB({ ...log, userId: state.userId });
      const [daily, all] = await Promise.all([
        getDailyActivityLogs(state.userId, todayISO()),
        getAllActivityLogs(state.userId),
      ]);
      set({ dailyActivityLogs: daily, allActivityLogs: all });
    } catch (error) {
      const message = mapDbError(error, "Failed to add activity log");
      if (import.meta.env.DEV) console.error("Error adding activity log:", error);
      set({ error: message });
      throw error;
    }
  },

  deleteActivityLog: async (id: ActivityLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteActivityLogFromDB(id, state.userId);
      const [daily, all] = await Promise.all([
        getDailyActivityLogs(state.userId, todayISO()),
        getAllActivityLogs(state.userId),
      ]);
      set({ dailyActivityLogs: daily, allActivityLogs: all });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete activity log");
      if (import.meta.env.DEV) console.error("Error deleting activity log:", error);
      set({ error: message });
    }
  },

  fetchFastingSessions: async (userId: UserId) => {
    try {
      const [active, all] = await Promise.all([
        getActiveFastingSession(userId),
        getAllFastingSessions(userId),
      ]);
      set({ activeFastingSession: active ?? null, fastingHistory: all });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching fasting sessions:", error);
    }
  },

  startFasting: async (targetHours: number) => {
    const state = get();
    if (!state.userId) return;
    if (state.activeFastingSession) {
      toast.error("A fasting session is already active. End it first.");
      return;
    }
    try {
      const session: FastingSession = {
        userId: state.userId,
        startTime: new Date().toISOString(),
        endTime: null,
        targetHours,
        dateLogged: todayISO(),
        completed: false,
      };
      await startFastingSessionInDB(session);
      await get().fetchFastingSessions(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to start fasting session");
      if (import.meta.env.DEV) console.error("Error starting fast:", error);
      set({ error: message });
    }
  },

  endFasting: async (completed: boolean) => {
    const state = get();
    if (!state.userId || !state.activeFastingSession?.id) return;
    try {
      await endFastingSessionInDB(state.activeFastingSession.id, state.userId, completed);
      await get().fetchFastingSessions(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to end fasting session");
      if (import.meta.env.DEV) console.error("Error ending fast:", error);
      set({ error: message });
    }
  },
});

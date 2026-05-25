import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import {
  addBodyMeasurement as addBodyMeasurementToDB,
  type BodyMeasurement,
  deleteBodyMeasurement as deleteBodyMeasurementFromDB,
  getAllBodyMeasurements,
  updateBodyMeasurement as updateBodyMeasurementInDB,
} from "../../db/dbService";
import type { BodyMeasurementId, UserId } from "@/types";

export interface BodySlice {
  bodyMeasurements: BodyMeasurement[];
  fetchBodyMeasurements: (userId: UserId) => Promise<void>;
  addBodyMeasurement: (m: Omit<BodyMeasurement, "id">) => Promise<void>;
  deleteBodyMeasurement: (id: BodyMeasurementId) => Promise<void>;
  updateBodyMeasurement: (
    id: BodyMeasurementId,
    updates: Partial<Omit<BodyMeasurement, "id" | "userId">>,
  ) => Promise<void>;
}

export const createBodySlice: StateCreator<AppState, [], [], BodySlice> = (set, get) => ({
  bodyMeasurements: [],

  fetchBodyMeasurements: async (userId: UserId) => {
    try {
      const measurements = await getAllBodyMeasurements(userId);
      set({ bodyMeasurements: measurements, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch body measurements");
      if (import.meta.env.DEV) console.error("Error fetching body measurements:", error);
      set({ error: message });
    }
  },

  addBodyMeasurement: async (m: Omit<BodyMeasurement, "id">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addBodyMeasurementToDB({ ...m, userId: state.userId });
      await state.fetchBodyMeasurements(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      const message = mapDbError(error, "Failed to add measurement");
      if (import.meta.env.DEV) console.error("Error adding body measurement:", error);
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
      if (import.meta.env.DEV) console.error("Error deleting body measurement:", error);
      set({ error: message });
    }
  },

  updateBodyMeasurement: async (
    id: BodyMeasurementId,
    updates: Partial<Omit<BodyMeasurement, "id" | "userId">>,
  ) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateBodyMeasurementInDB(id, state.userId, updates);
      await state.fetchBodyMeasurements(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update measurement");
      if (import.meta.env.DEV) console.error("Error updating body measurement:", error);
      set({ error: message });
    }
  },
});

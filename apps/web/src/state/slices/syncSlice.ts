import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export interface SyncSlice {
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string) => void;
  setSyncError: (err: string | null) => void;
}

const LAST_SYNCED_AT_KEY = "gc_last_synced_at";

export const createSyncSlice: StateCreator<AppState, [], [], SyncSlice> = (set) => ({
  syncStatus: "idle",
  lastSyncedAt: localStorage.getItem(LAST_SYNCED_AT_KEY),
  syncError: null,

  setSyncStatus: (status) => set({ syncStatus: status }),

  setLastSyncedAt: (at) => {
    localStorage.setItem(LAST_SYNCED_AT_KEY, at);
    set({ lastSyncedAt: at, syncStatus: "synced", syncError: null });
  },

  setSyncError: (err) => set({ syncError: err, syncStatus: err ? "error" : "idle" }),
});

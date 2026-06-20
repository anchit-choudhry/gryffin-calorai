import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export interface SyncSlice {
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  pendingSyncCount: number;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string) => void;
  setSyncError: (err: string | null) => void;
  setPendingSyncCount: (n: number) => void;
  e2eEnabled: boolean;
  e2eKeyReady: boolean;
  setE2EEnabled: (v: boolean) => void;
  setE2EKeyReady: (v: boolean) => void;
}

const LAST_SYNCED_AT_KEY = "gc_last_synced_at";
const E2E_ENABLED_KEY = "gc_e2e_enabled";

export const createSyncSlice: StateCreator<AppState, [], [], SyncSlice> = (set) => ({
  syncStatus: "idle",
  lastSyncedAt: localStorage.getItem(LAST_SYNCED_AT_KEY),
  syncError: null,
  pendingSyncCount: 0,

  setSyncStatus: (status) => set({ syncStatus: status }),

  setLastSyncedAt: (at) => {
    localStorage.setItem(LAST_SYNCED_AT_KEY, at);
    set({ lastSyncedAt: at, syncStatus: "synced", syncError: null });
  },

  setSyncError: (err) => set({ syncError: err, syncStatus: err ? "error" : "idle" }),

  setPendingSyncCount: (n) => set({ pendingSyncCount: n }),

  e2eEnabled: localStorage.getItem(E2E_ENABLED_KEY) === "true",
  e2eKeyReady: false,
  setE2EEnabled: (v) => {
    if (v) {
      localStorage.setItem(E2E_ENABLED_KEY, "true");
    } else {
      localStorage.removeItem(E2E_ENABLED_KEY);
    }
    set({ e2eEnabled: v });
  },
  setE2EKeyReady: (v) => set({ e2eKeyReady: v }),
});

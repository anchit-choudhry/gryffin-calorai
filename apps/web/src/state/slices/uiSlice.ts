import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";

export interface UiSlice {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
});

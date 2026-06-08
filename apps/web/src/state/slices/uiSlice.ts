import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";

export type Density = "comfortable" | "compact";

const DENSITY_KEY = "gc_density";

function loadDensity(): Density {
  const stored = localStorage.getItem(DENSITY_KEY);
  return stored === "compact" ? "compact" : "comfortable";
}

export interface UiSlice {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  density: Density;
  setDensity: (d: Density) => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  density: loadDensity(),
  setDensity: (d: Density) => {
    localStorage.setItem(DENSITY_KEY, d);
    set({ density: d });
  },
});

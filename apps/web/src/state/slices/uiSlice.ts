import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";

export type Density = "comfortable" | "compact" | "spacious";
export type AccentTheme = "persimmon" | "sage" | "indigo" | "amber" | "rose";

const DENSITY_KEY = "gc_density";
const SEEN_COACHMARKS_KEY = "gc_seen_coachmarks";
const HAPTICS_KEY = "gc_haptics";
const ACCENT_KEY = "gc_accent";

const VALID_ACCENT_THEMES: readonly AccentTheme[] = [
  "persimmon",
  "sage",
  "indigo",
  "amber",
  "rose",
];

function loadDensity(): Density {
  const stored = localStorage.getItem(DENSITY_KEY);
  if (stored === "compact") return "compact";
  if (stored === "spacious") return "spacious";
  return "comfortable";
}

function loadSeenCoachmarks(): string[] {
  try {
    const stored = localStorage.getItem(SEEN_COACHMARKS_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function loadHapticsEnabled(): boolean {
  return localStorage.getItem(HAPTICS_KEY) === "true";
}

function loadAccentTheme(): AccentTheme {
  const stored = localStorage.getItem(ACCENT_KEY) as AccentTheme | null;
  return stored !== null && VALID_ACCENT_THEMES.includes(stored) ? stored : "persimmon";
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
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  accentTheme: AccentTheme;
  setAccentTheme: (theme: AccentTheme) => void;
  seenCoachmarks: string[];
  markCoachmarkSeen: (id: string) => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
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
  hapticsEnabled: loadHapticsEnabled(),
  setHapticsEnabled: (enabled: boolean) => {
    localStorage.setItem(HAPTICS_KEY, String(enabled));
    set({ hapticsEnabled: enabled });
  },
  accentTheme: loadAccentTheme(),
  setAccentTheme: (theme: AccentTheme) => {
    localStorage.setItem(ACCENT_KEY, theme);
    set({ accentTheme: theme });
  },
  seenCoachmarks: loadSeenCoachmarks(),
  markCoachmarkSeen: (id: string) => {
    const current = get().seenCoachmarks;
    if (current.includes(id)) return;
    const updated = [...current, id];
    localStorage.setItem(SEEN_COACHMARKS_KEY, JSON.stringify(updated));
    set({ seenCoachmarks: updated });
  },
});

import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import type { ISODate } from "@/types";

export type Density = "comfortable" | "compact" | "spacious";
export type AccentTheme = "persimmon" | "sage" | "indigo" | "amber" | "rose";
export type Edition = "standard" | "lamplight" | "sepia" | "large-print";

const DENSITY_KEY = "gc_density";
const SEEN_COACHMARKS_KEY = "gc_seen_coachmarks";
const HAPTICS_KEY = "gc_haptics";
const ACCENT_KEY = "gc_accent";
const TRAINING_DAYS_KEY = "gc_training_days";
const EDITION_KEY = "gc_edition";
const ALMANAC_LOC_KEY = "gc_almanac_loc";
const BROADSHEET_KEY = "gc_broadsheet";

const VALID_EDITIONS: readonly Edition[] = ["standard", "lamplight", "sepia", "large-print"];

function loadEdition(): Edition {
  const stored = localStorage.getItem(EDITION_KEY);
  return VALID_EDITIONS.includes(stored as Edition) ? (stored as Edition) : "standard";
}

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

const ACCENT_MIGRATIONS: Record<string, AccentTheme> = {
  slate: "indigo",
  ocean: "indigo",
  ember: "amber",
};

function loadAccentTheme(): AccentTheme {
  const stored = localStorage.getItem(ACCENT_KEY);
  if (stored === null) return "persimmon";
  if (stored in ACCENT_MIGRATIONS) {
    const migrated = ACCENT_MIGRATIONS[stored]!;
    localStorage.setItem(ACCENT_KEY, migrated);
    return migrated;
  }
  return VALID_ACCENT_THEMES.includes(stored as AccentTheme)
    ? (stored as AccentTheme)
    : "persimmon";
}

function loadTrainingDays(): ISODate[] {
  try {
    const stored = localStorage.getItem(TRAINING_DAYS_KEY);
    return stored ? (JSON.parse(stored) as ISODate[]) : [];
  } catch {
    return [];
  }
}

export interface AlmanacLocation {
  lat: number;
  lng: number;
  label: string;
}

function loadAlmanacLocation(): AlmanacLocation | null {
  try {
    const stored = localStorage.getItem(ALMANAC_LOC_KEY);
    return stored ? (JSON.parse(stored) as AlmanacLocation) : null;
  } catch {
    return null;
  }
}

function loadBroadsheet(): boolean {
  return localStorage.getItem(BROADSHEET_KEY) === "true";
}

export interface UiSlice {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  captureOpen: boolean;
  openCapture: () => void;
  closeCapture: () => void;
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
  trainingDays: ISODate[];
  toggleTrainingDay: (date: ISODate) => void;
  isTrainingDay: (date: ISODate) => boolean;
  edition: Edition;
  setEdition: (e: Edition) => void;
  almanacLocation: AlmanacLocation | null;
  setAlmanacLocation: (loc: AlmanacLocation | null) => void;
  broadsheet: boolean;
  setBroadsheet: (enabled: boolean) => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  captureOpen: false,
  openCapture: () => set({ captureOpen: true }),
  closeCapture: () => set({ captureOpen: false }),
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
  trainingDays: loadTrainingDays(),
  toggleTrainingDay: (date: ISODate) => {
    const current = get().trainingDays;
    const updated = current.includes(date) ? current.filter((d) => d !== date) : [...current, date];
    localStorage.setItem(TRAINING_DAYS_KEY, JSON.stringify(updated));
    set({ trainingDays: updated });
  },
  isTrainingDay: (date: ISODate) => get().trainingDays.includes(date),
  edition: loadEdition(),
  setEdition: (e: Edition) => {
    localStorage.setItem(EDITION_KEY, e);
    set({ edition: e });
  },
  almanacLocation: loadAlmanacLocation(),
  setAlmanacLocation: (loc: AlmanacLocation | null) => {
    if (loc === null) {
      localStorage.removeItem(ALMANAC_LOC_KEY);
    } else {
      localStorage.setItem(ALMANAC_LOC_KEY, JSON.stringify(loc));
    }
    set({ almanacLocation: loc });
  },
  broadsheet: loadBroadsheet(),
  setBroadsheet: (enabled: boolean) => {
    localStorage.setItem(BROADSHEET_KEY, String(enabled));
    set({ broadsheet: enabled });
  },
});

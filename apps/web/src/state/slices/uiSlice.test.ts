import { describe, expect, it, beforeEach } from "vitest";
import { create, type StateCreator } from "zustand";
import { createUiSlice, type UiSlice } from "./uiSlice";

// Minimal test store — avoids wiring the full AppState for unit testing.
// Cast is safe: uiSlice never reads cross-slice state, so the narrowed
// StateCreator<UiSlice> generic is equivalent at runtime.
function makeStore() {
  return create<UiSlice>()(createUiSlice as StateCreator<UiSlice, [], [], UiSlice>);
}

describe("uiSlice", () => {
  it("initializes quickAddOpen as false", () => {
    const store = makeStore();
    expect(store.getState().quickAddOpen).toBe(false);
  });

  it("openQuickAdd sets quickAddOpen to true", () => {
    const store = makeStore();
    store.getState().openQuickAdd();
    expect(store.getState().quickAddOpen).toBe(true);
  });

  it("closeQuickAdd sets quickAddOpen to false", () => {
    const store = makeStore();
    store.getState().openQuickAdd();
    store.getState().closeQuickAdd();
    expect(store.getState().quickAddOpen).toBe(false);
  });

  it("openQuickAdd is idempotent when already open", () => {
    const store = makeStore();
    store.getState().openQuickAdd();
    store.getState().openQuickAdd();
    expect(store.getState().quickAddOpen).toBe(true);
  });

  it("closeQuickAdd is idempotent when already closed", () => {
    const store = makeStore();
    store.getState().closeQuickAdd();
    expect(store.getState().quickAddOpen).toBe(false);
  });

  describe("multiple store instances are independent", () => {
    let storeA: ReturnType<typeof makeStore>;
    let storeB: ReturnType<typeof makeStore>;

    beforeEach(() => {
      storeA = makeStore();
      storeB = makeStore();
    });

    it("opening A does not affect B", () => {
      storeA.getState().openQuickAdd();
      expect(storeB.getState().quickAddOpen).toBe(false);
    });
  });

  describe("commandPaletteOpen", () => {
    it("initializes commandPaletteOpen as false", () => {
      const store = makeStore();
      expect(store.getState().commandPaletteOpen).toBe(false);
    });

    it("openCommandPalette sets commandPaletteOpen to true", () => {
      const store = makeStore();
      store.getState().openCommandPalette();
      expect(store.getState().commandPaletteOpen).toBe(true);
    });

    it("closeCommandPalette sets commandPaletteOpen to false", () => {
      const store = makeStore();
      store.getState().openCommandPalette();
      store.getState().closeCommandPalette();
      expect(store.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe("density", () => {
    it("setDensity updates density and persists to localStorage", () => {
      const store = makeStore();
      store.getState().setDensity("compact");
      expect(store.getState().density).toBe("compact");
      expect(localStorage.getItem("gc_density")).toBe("compact");
    });

    it("setDensity can switch back to comfortable", () => {
      const store = makeStore();
      store.getState().setDensity("compact");
      store.getState().setDensity("comfortable");
      expect(store.getState().density).toBe("comfortable");
    });
  });

  describe("hapticsEnabled", () => {
    beforeEach(() => {
      localStorage.removeItem("gc_haptics");
    });

    it("initializes hapticsEnabled as false", () => {
      const store = makeStore();
      expect(store.getState().hapticsEnabled).toBe(false);
    });

    it("setHapticsEnabled persists true to localStorage", () => {
      const store = makeStore();
      store.getState().setHapticsEnabled(true);
      expect(store.getState().hapticsEnabled).toBe(true);
      expect(localStorage.getItem("gc_haptics")).toBe("true");
    });

    it("setHapticsEnabled persists false to localStorage", () => {
      const store = makeStore();
      store.getState().setHapticsEnabled(true);
      store.getState().setHapticsEnabled(false);
      expect(store.getState().hapticsEnabled).toBe(false);
      expect(localStorage.getItem("gc_haptics")).toBe("false");
    });

    it("loads hapticsEnabled true from localStorage on init", () => {
      localStorage.setItem("gc_haptics", "true");
      const store = makeStore();
      expect(store.getState().hapticsEnabled).toBe(true);
    });
  });

  describe("accentTheme", () => {
    beforeEach(() => {
      localStorage.removeItem("gc_accent");
    });

    it("initializes accentTheme as 'persimmon'", () => {
      const store = makeStore();
      expect(store.getState().accentTheme).toBe("persimmon");
    });

    it("setAccentTheme updates accentTheme", () => {
      const store = makeStore();
      store.getState().setAccentTheme("sage");
      expect(store.getState().accentTheme).toBe("sage");
    });

    it("setAccentTheme persists to localStorage", () => {
      const store = makeStore();
      store.getState().setAccentTheme("indigo");
      expect(localStorage.getItem("gc_accent")).toBe("indigo");
    });

    it("loads accentTheme from localStorage on init", () => {
      localStorage.setItem("gc_accent", "amber");
      const store = makeStore();
      expect(store.getState().accentTheme).toBe("amber");
    });

    it("falls back to persimmon for unknown stored value", () => {
      localStorage.setItem("gc_accent", "invalid-theme");
      const store = makeStore();
      expect(store.getState().accentTheme).toBe("persimmon");
    });
  });

  describe("seenCoachmarks", () => {
    beforeEach(() => {
      localStorage.removeItem("gc_seen_coachmarks");
    });

    it("initializes seenCoachmarks as empty array", () => {
      const store = makeStore();
      expect(store.getState().seenCoachmarks).toStrictEqual([]);
    });

    it("markCoachmarkSeen adds id to seenCoachmarks", () => {
      const store = makeStore();
      store.getState().markCoachmarkSeen("food-logger");
      expect(store.getState().seenCoachmarks).toStrictEqual(["food-logger"]);
    });

    it("markCoachmarkSeen is idempotent for duplicate ids", () => {
      const store = makeStore();
      store.getState().markCoachmarkSeen("food-logger");
      store.getState().markCoachmarkSeen("food-logger");
      expect(store.getState().seenCoachmarks).toStrictEqual(["food-logger"]);
    });

    it("markCoachmarkSeen persists to localStorage", () => {
      const store = makeStore();
      store.getState().markCoachmarkSeen("water-tracker");
      expect(localStorage.getItem("gc_seen_coachmarks")).toBe(JSON.stringify(["water-tracker"]));
    });

    it("markCoachmarkSeen accumulates multiple distinct ids", () => {
      const store = makeStore();
      store.getState().markCoachmarkSeen("food-logger");
      store.getState().markCoachmarkSeen("command-palette");
      expect(store.getState().seenCoachmarks).toStrictEqual(["food-logger", "command-palette"]);
    });
  });

  describe("trainingDays", () => {
    const DATE_A = "2026-06-10" as import("@/types").ISODate;
    const DATE_B = "2026-06-11" as import("@/types").ISODate;

    beforeEach(() => {
      localStorage.removeItem("gc_training_days");
    });

    it("initializes trainingDays as empty array", () => {
      const store = makeStore();
      expect(store.getState().trainingDays).toStrictEqual([]);
    });

    it("toggleTrainingDay adds a date when not present", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      expect(store.getState().trainingDays).toContain(DATE_A);
    });

    it("toggleTrainingDay removes a date when already present", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      store.getState().toggleTrainingDay(DATE_A);
      expect(store.getState().trainingDays).not.toContain(DATE_A);
    });

    it("toggleTrainingDay handles multiple independent dates", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      store.getState().toggleTrainingDay(DATE_B);
      expect(store.getState().trainingDays).toContain(DATE_A);
      expect(store.getState().trainingDays).toContain(DATE_B);
    });

    it("isTrainingDay returns false for an unregistered date", () => {
      const store = makeStore();
      expect(store.getState().isTrainingDay(DATE_A)).toBe(false);
    });

    it("isTrainingDay returns true after toggleTrainingDay adds the date", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      expect(store.getState().isTrainingDay(DATE_A)).toBe(true);
    });

    it("isTrainingDay returns false after date is toggled off", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      store.getState().toggleTrainingDay(DATE_A);
      expect(store.getState().isTrainingDay(DATE_A)).toBe(false);
    });

    it("toggleTrainingDay persists to localStorage", () => {
      const store = makeStore();
      store.getState().toggleTrainingDay(DATE_A);
      const stored = JSON.parse(localStorage.getItem("gc_training_days") ?? "[]") as string[];
      expect(stored).toContain(DATE_A);
    });

    it("loads trainingDays from localStorage on init", () => {
      localStorage.setItem("gc_training_days", JSON.stringify([DATE_A]));
      const store = makeStore();
      expect(store.getState().trainingDays).toContain(DATE_A);
    });
  });
});

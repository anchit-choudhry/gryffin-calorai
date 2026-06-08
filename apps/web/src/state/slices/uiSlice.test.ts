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
});

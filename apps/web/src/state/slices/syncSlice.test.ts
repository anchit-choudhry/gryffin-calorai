import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSyncSlice, type SyncSlice } from "./syncSlice";
import type { AppState } from "../AppState";

type SetFn = (partial: Partial<SyncSlice>) => void;

function makeSlice(initial: Partial<SyncSlice> = {}): SyncSlice & { _set: SetFn } {
  let state: SyncSlice = {} as SyncSlice;
  const set: SetFn = (partial) => {
    state = { ...state, ...partial };
  };
  const get = () => state as AppState;
  state = {
    ...createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never),
    ...initial,
  };
  return { ...state, _set: set };
}

describe("syncSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initialises with idle status and null error", () => {
    const slice = makeSlice();
    expect(slice.syncStatus).toBe("idle");
    expect(slice.syncError).toBeNull();
  });

  it("reads lastSyncedAt from localStorage on init", () => {
    localStorage.setItem("gc_last_synced_at", "2026-01-01T00:00:00.000Z");
    const slice = makeSlice();
    expect(slice.lastSyncedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("setSyncStatus updates syncStatus", () => {
    let state: Partial<SyncSlice> = {};
    const set: SetFn = (p) => {
      state = { ...state, ...p };
    };
    const get = () => state as AppState;
    const slice = createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never);
    slice.setSyncStatus("syncing");
    expect(state.syncStatus).toBe("syncing");
  });

  it("setLastSyncedAt persists to localStorage and sets synced", () => {
    let state: Partial<SyncSlice> = {};
    const set: SetFn = (p) => {
      state = { ...state, ...p };
    };
    const get = () => state as AppState;
    const slice = createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never);
    slice.setLastSyncedAt("2026-05-26T12:00:00.000Z");
    expect(state.lastSyncedAt).toBe("2026-05-26T12:00:00.000Z");
    expect(state.syncStatus).toBe("synced");
    expect(state.syncError).toBeNull();
    expect(localStorage.getItem("gc_last_synced_at")).toBe("2026-05-26T12:00:00.000Z");
  });

  it("setSyncError sets error status when message provided", () => {
    let state: Partial<SyncSlice> = {};
    const set: SetFn = (p) => {
      state = { ...state, ...p };
    };
    const get = () => state as AppState;
    const slice = createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never);
    slice.setSyncError("Network error");
    expect(state.syncError).toBe("Network error");
    expect(state.syncStatus).toBe("error");
  });

  it("setSyncError clears error when null passed", () => {
    let state: Partial<SyncSlice> = {};
    const set: SetFn = (p) => {
      state = { ...state, ...p };
    };
    const get = () => state as AppState;
    const slice = createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never);
    slice.setSyncError(null);
    expect(state.syncError).toBeNull();
    expect(state.syncStatus).toBe("idle");
  });

  it("setPendingSyncCount updates pendingSyncCount", () => {
    let state = { pendingSyncCount: 0 } as AppState;
    const set: SetFn = (p) => {
      state = { ...state, ...p };
    };
    const get = () => state as AppState;
    const slice = createSyncSlice(set as Parameters<typeof createSyncSlice>[0], get, {} as never);
    slice.setPendingSyncCount(5);
    expect(state.pendingSyncCount).toBe(5);
  });
});

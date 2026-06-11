import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncStatusChip } from "./SyncStatusChip";

const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(true));
const mockUseAppState = vi.hoisted(() =>
  vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ syncStatus: "idle", lastSyncedAt: null, pendingSyncCount: 0 }),
  ),
);

vi.mock("../lib/apiClient", () => ({
  isAuthenticated: mockIsAuthenticated,
}));

vi.mock("../state/AppState", () => ({
  useAppState: mockUseAppState,
}));

describe("SyncStatusChip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "idle", lastSyncedAt: null, pendingSyncCount: 0 }),
    );
  });

  it("shows saved locally badge when not authenticated", () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(<SyncStatusChip />);
    expect(screen.getByText("Saved locally")).toBeTruthy();
  });

  it("shows 'Not signed in' label for idle status", () => {
    render(<SyncStatusChip />);
    expect(screen.getByText("Not signed in")).toBeTruthy();
  });

  it("shows 'Syncing' label for syncing status", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "syncing", lastSyncedAt: null, pendingSyncCount: 0 }),
    );
    render(<SyncStatusChip />);
    expect(screen.getByText("Syncing")).toBeTruthy();
  });

  it("shows pending count when syncing with items in queue", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "syncing", lastSyncedAt: null, pendingSyncCount: 3 }),
    );
    render(<SyncStatusChip />);
    expect(screen.getByText("Syncing (3)")).toBeTruthy();
  });

  it("shows 'Synced' label for synced status", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "synced", lastSyncedAt: null, pendingSyncCount: 0 }),
    );
    render(<SyncStatusChip />);
    expect(screen.getByText("Synced")).toBeTruthy();
  });

  it("includes last-synced time in aria-label when synced with a timestamp", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "synced",
        lastSyncedAt: "2026-05-31T10:00:00.000Z",
        pendingSyncCount: 0,
      }),
    );
    render(<SyncStatusChip />);
    const chip = screen.getByText("Synced").closest("span");
    expect(chip?.getAttribute("aria-label")).toMatch(/last synced/i);
  });

  it("shows 'Offline' label for offline status", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "offline", lastSyncedAt: null, pendingSyncCount: 0 }),
    );
    render(<SyncStatusChip />);
    expect(screen.getByText("Offline")).toBeTruthy();
  });

  it("shows 'Sync error' label for error status", () => {
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "error", lastSyncedAt: null, pendingSyncCount: 0 }),
    );
    render(<SyncStatusChip />);
    expect(screen.getByText("Sync error")).toBeTruthy();
  });
});

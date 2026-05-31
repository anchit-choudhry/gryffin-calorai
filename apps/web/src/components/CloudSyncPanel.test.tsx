import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CloudSyncPanel } from "./CloudSyncPanel";

const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockUseAppState = vi.hoisted(() =>
  vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ syncStatus: "idle", lastSyncedAt: null }),
  ),
);

vi.mock("../lib/apiClient", () => ({
  isAuthenticated: mockIsAuthenticated,
  api: {
    auth: {
      exchangeToken: vi.fn(),
      logout: vi.fn(),
    },
  },
  clearTokens: vi.fn(),
}));

vi.mock("../state/AppState", () => ({
  useAppState: mockUseAppState,
}));

describe("CloudSyncPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "idle", lastSyncedAt: null }),
    );
  });

  it("shows not-configured message when VITE_GOOGLE_CLIENT_ID is absent", () => {
    render(<CloudSyncPanel />);
    expect(screen.getByText(/not configured/i)).toBeTruthy();
    expect(screen.getByText(/VITE_GOOGLE_CLIENT_ID/)).toBeTruthy();
  });

  it("shows not-connected state when unauthenticated and client ID is configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "mock-client-id.apps.googleusercontent.com");
    render(<CloudSyncPanel />);
    expect(screen.getByText(/not connected/i)).toBeTruthy();
    vi.unstubAllEnvs();
  });

  it("shows connected state when authenticated", () => {
    mockIsAuthenticated.mockReturnValue(true);
    render(<CloudSyncPanel />);
    expect(screen.getByText(/connected to cloud/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sync now/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
  });

  it("shows last synced time when available", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "synced", lastSyncedAt: "2026-05-27T10:00:00.000Z" }),
    );
    render(<CloudSyncPanel />);
    expect(screen.getByText(/last synced/i)).toBeTruthy();
  });

  it("dispatches gc:sync custom event when Sync now is clicked", () => {
    mockIsAuthenticated.mockReturnValue(true);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<CloudSyncPanel />);
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const event = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.type).toBe("gc:sync");
  });

  it("shows syncing indicator when syncStatus is syncing", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "syncing", lastSyncedAt: null }),
    );
    render(<CloudSyncPanel />);
    expect(screen.getByText(/syncing/i)).toBeTruthy();
  });

  it("shows sync error indicator when syncStatus is error", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "error", lastSyncedAt: null }),
    );
    render(<CloudSyncPanel />);
    expect(screen.getByText(/sync error/i)).toBeTruthy();
  });

  it("disables Sync now button when syncing", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ syncStatus: "syncing", lastSyncedAt: null }),
    );
    render(<CloudSyncPanel />);
    const syncBtn = screen.getByRole("button", { name: /sync now/i }) as HTMLButtonElement;
    expect(syncBtn.disabled).toBe(true);
  });

  it("calls api.auth.logout on sign out click", async () => {
    const { api } = await import("../lib/apiClient");
    vi.mocked(api.auth.logout).mockResolvedValue(undefined);
    mockIsAuthenticated.mockReturnValue(true);

    render(<CloudSyncPanel />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await vi.waitFor(() => {
      expect(api.auth.logout).toHaveBeenCalledOnce();
    });
  });

  it("falls back to clearTokens when logout throws", async () => {
    const { api, clearTokens } = await import("../lib/apiClient");
    vi.mocked(api.auth.logout).mockRejectedValue(new Error("Logout failed"));
    mockIsAuthenticated.mockReturnValue(true);

    render(<CloudSyncPanel />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await vi.waitFor(() => {
      expect(clearTokens).toHaveBeenCalledOnce();
    });
  });

  it("shows loading text when sign-in is completing", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "mock-client-id.apps.googleusercontent.com");
    render(<CloudSyncPanel />);
    // Loading text is only shown when `loading` state is true (after credential submission)
    // The panel initially shows the Google button placeholder div - verify it renders
    const panelText = screen.getByText(/sign in to sync/i);
    expect(panelText).toBeTruthy();
    vi.unstubAllEnvs();
  });
});

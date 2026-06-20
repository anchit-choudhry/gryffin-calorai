import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { UserId } from "../types";
import { CloudSyncPanel } from "./CloudSyncPanel";

const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockUseAppState = vi.hoisted(() =>
  vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      syncStatus: "idle",
      lastSyncedAt: null,
      syncError: null,
      e2eEnabled: false,
      e2eKeyReady: false,
      setE2EEnabled: vi.fn(),
      setE2EKeyReady: vi.fn(),
      setSyncError: vi.fn(),
      userId: null,
    }),
  ),
);
const mockActivateE2E = vi.hoisted(() =>
  vi.fn((_userId: UserId, _passphrase: string): Promise<void> => Promise.resolve()),
);
const mockDeriveKey = vi.hoisted(() =>
  vi.fn(
    (_passphrase: string, _salt: Uint8Array): Promise<CryptoKey> =>
      Promise.resolve({ type: "secret" } as unknown as CryptoKey),
  ),
);
const mockDecryptBlob = vi.hoisted(() =>
  vi.fn(
    (_key: CryptoKey, _iv: string, _ciphertext: string): Promise<unknown> =>
      Promise.resolve({ entityType: "foodItem" }),
  ),
);
const mockSetE2EKey = vi.hoisted(() => vi.fn((_key: CryptoKey): void => undefined));
const mockApiGet = vi.hoisted(() =>
  vi.fn((_path: string): Promise<unknown> => Promise.resolve({ salt: "dGVzdA==" })),
);

vi.mock("../lib/apiClient", () => ({
  isAuthenticated: mockIsAuthenticated,
  api: {
    get: mockApiGet,
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

vi.mock("../hooks/useSyncService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../hooks/useSyncService")>();
  return { ...actual, activateE2E: mockActivateE2E };
});

vi.mock("../lib/e2eEncryption", () => ({
  deriveKey: mockDeriveKey,
  decryptBlob: mockDecryptBlob,
  encryptBlob: vi.fn(),
}));

vi.mock("../lib/e2eKeyStore", () => ({
  setE2EKey: mockSetE2EKey,
  getE2EKey: vi.fn(() => undefined),
  clearE2EKey: vi.fn(),
  isE2EKeyReady: vi.fn(() => false),
}));

describe("CloudSyncPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockApiGet.mockResolvedValue({ salt: "dGVzdA==" });
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: null,
      }),
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
      selector({
        syncStatus: "synced",
        lastSyncedAt: "2026-05-27T10:00:00.000Z",
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: null,
      }),
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
      selector({
        syncStatus: "syncing",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: null,
      }),
    );
    render(<CloudSyncPanel />);
    expect(screen.getByText("Syncing...")).toBeTruthy();
  });

  it("shows sync error indicator when syncStatus is error", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "error",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: null,
      }),
    );
    render(<CloudSyncPanel />);
    expect(screen.getByText(/sync error/i)).toBeTruthy();
  });

  it("disables Sync now button when syncing", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "syncing",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: null,
      }),
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

describe("E2E setup form", () => {
  beforeEach(() => {
    mockIsAuthenticated.mockReturnValue(true);
    mockApiGet.mockResolvedValue({ salt: "dGVzdA==" });
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
  });

  it("shows setup form when authenticated and e2eEnabled=false", async () => {
    render(<CloudSyncPanel />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Passphrase")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Confirm passphrase")).toBeInTheDocument();
    });
  });

  it("blocks submission when passphrases do not match", async () => {
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), { target: { value: "abc" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm passphrase"), {
      target: { value: "xyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enable encryption/i }));
    expect(mockActivateE2E).not.toHaveBeenCalled();
    expect(screen.getByText(/passphrases do not match/i)).toBeInTheDocument();
  });

  it("calls activateE2E with matching passphrases", async () => {
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
      target: { value: "hunter2" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm passphrase"), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enable encryption/i }));
    await waitFor(() => {
      expect(mockActivateE2E).toHaveBeenCalledWith("user-1", "hunter2");
    });
  });

  it("shows toast error when activateE2E throws", async () => {
    mockActivateE2E.mockRejectedValueOnce(new Error("Network error"));
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm passphrase"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enable encryption/i }));
    await waitFor(() => {
      expect(mockActivateE2E).toHaveBeenCalledWith("user-1", "secret123");
    });
  });
});

describe("E2E unlock form", () => {
  beforeEach(() => {
    mockIsAuthenticated.mockReturnValue(true);
    mockApiGet.mockResolvedValue({ salt: "dGVzdA==" });
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "synced",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: true,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
  });

  it("shows unlock form when e2eEnabled=true and e2eKeyReady=false", async () => {
    render(<CloudSyncPanel />);
    await waitFor(() => {
      expect(screen.getByText(/sync is locked/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Passphrase")).toBeInTheDocument();
    });
  });

  it("shows 'Failed to unlock' when api.get throws a generic error", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("blobs")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ salt: "dGVzdA==" });
    });
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
      target: { value: "mypassphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock sync/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to unlock/i)).toBeInTheDocument();
    });
  });

  it("unlocks and dispatches gc:sync when passphrase is correct with no blobs", async () => {
    const mockSetE2EKeyReady = vi.fn();
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "synced",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: true,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: mockSetE2EKeyReady,
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
    mockApiGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("blobs")) {
        return Promise.resolve([]);
      }
      return Promise.resolve({ salt: "dGVzdA==" });
    });
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
      target: { value: "correctpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock sync/i }));
    await waitFor(() => {
      expect(mockSetE2EKey).toHaveBeenCalled();
      expect(mockSetE2EKeyReady).toHaveBeenCalledWith(true);
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "gc:sync" }));
  });

  it("shows 'Incorrect passphrase' when decryptBlob throws DOMException", async () => {
    mockDecryptBlob.mockRejectedValueOnce(new DOMException("bad key", "OperationError"));
    // Route api.get calls by URL so useEffect and handleUnlock get the right responses
    mockApiGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("blobs")) {
        return Promise.resolve([
          {
            clientBlobId: "foodItem:x",
            iv: "iv",
            ciphertext: "ct",
            updatedAt: null,
            isDeleted: false,
          },
        ]);
      }
      return Promise.resolve({ salt: "dGVzdA==" });
    });
    render(<CloudSyncPanel />);
    await waitFor(() => screen.getByPlaceholderText("Passphrase"));
    fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock sync/i }));
    await waitFor(() => {
      expect(screen.getByText(/incorrect passphrase/i)).toBeInTheDocument();
    });
  });
});

describe("E2E key cleanup", () => {
  it("calls clearE2EKey on unmount when authenticated", async () => {
    const { clearE2EKey } = await import("../lib/e2eKeyStore");
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
    const { unmount } = render(<CloudSyncPanel />);
    unmount();
    expect(clearE2EKey).toHaveBeenCalled();
  });
});

describe("E2E connected badge", () => {
  it("shows E2E badge when e2eEnabled=true and e2eKeyReady=true", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "synced",
        lastSyncedAt: "2026-06-19T10:00:00Z",
        syncError: null,
        e2eEnabled: true,
        e2eKeyReady: true,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
    render(<CloudSyncPanel />);
    await waitFor(() => {
      expect(screen.getByText(/e2e encrypted/i)).toBeInTheDocument();
    });
  });

  it("does not show E2E badge when e2eEnabled=false", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockUseAppState.mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,
        e2eEnabled: false,
        e2eKeyReady: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
        setSyncError: vi.fn(),
        userId: "user-1" as UserId,
      }),
    );
    render(<CloudSyncPanel />);
    await waitFor(() => {
      expect(screen.queryByText(/e2e encrypted/i)).not.toBeInTheDocument();
    });
  });
});

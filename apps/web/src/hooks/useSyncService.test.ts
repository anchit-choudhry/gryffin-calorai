import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activateE2E, enqueueSyncOperation, useSyncService } from "./useSyncService";
import * as apiClient from "../lib/apiClient";
import { ApiError } from "../lib/apiClient";
import type { SyncEntityType, SyncQueueEntry } from "../db/dbService";
import * as dbService from "../db/dbService";
import type { AppState } from "../state/AppState";
import type { UserId } from "@/types";

const mockGetE2EKey = vi.hoisted(() => vi.fn(() => undefined as CryptoKey | undefined));
const mockClearE2EKey = vi.hoisted(() => vi.fn());
const mockSetE2EKey = vi.hoisted(() => vi.fn());
const mockDeriveKey = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ type: "secret" } as unknown as CryptoKey)),
);
const mockEncryptBlob = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ iv: "testiv", ciphertext: "testct" })),
);
const mockDecryptBlob = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      entityType: "foodItem" as string,
      operation: "update" as string,
      syncId: "sync-1",
      payload: { name: "Apple", calories: 80 } as unknown,
    }),
  ),
);
const mockApiGet = vi.hoisted(() => vi.fn());
const mockApiPost = vi.hoisted(() => vi.fn());
// All AppState-related hoisted mocks are grouped so getState closure references work.
const { mockSetE2EEnabled, mockSetE2EKeyReady, mockUseAppState } = vi.hoisted(() => {
  const setE2EEnabled = vi.fn();
  const setE2EKeyReady = vi.fn();
  const fn = vi.fn();
  // Zustand stores expose getState() directly on the hook function.
  // activateE2E and runSync call useAppState.getState() to read state.
  (fn as unknown as { getState: () => unknown }).getState = () => ({
    setE2EEnabled,
    setE2EKeyReady,
    e2eEnabled: false,
  });
  return {
    mockSetE2EEnabled: setE2EEnabled,
    mockSetE2EKeyReady: setE2EKeyReady,
    mockUseAppState: fn,
  };
});

vi.mock("../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/apiClient")>();
  return {
    ...actual,
    isAuthenticated: vi.fn(),
    clearTokens: vi.fn(),
    storeTokens: vi.fn(),
    api: {
      get: mockApiGet,
      post: mockApiPost,
      put: vi.fn(),
      delete: vi.fn(),
      auth: {
        exchangeToken: vi.fn(),
        logout: vi.fn(),
      },
    },
  };
});
vi.mock("../db/dbService");
vi.mock("../state/AppState", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../state/AppState")>();
  return {
    ...actual,
    useAppState: mockUseAppState,
  };
});
vi.mock("../lib/e2eKeyStore", () => ({
  getE2EKey: mockGetE2EKey,
  clearE2EKey: mockClearE2EKey,
  setE2EKey: mockSetE2EKey,
  isE2EKeyReady: vi.fn(() => false),
}));
vi.mock("../lib/e2eEncryption", () => ({
  deriveKey: mockDeriveKey,
  encryptBlob: mockEncryptBlob,
  decryptBlob: mockDecryptBlob,
}));

const userId = "user-1" as UserId;

describe("useSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    mockApiGet.mockResolvedValue([]);
    mockApiPost.mockResolvedValue({});
    vi.mocked(apiClient.api.put).mockResolvedValue({});
    vi.mocked(apiClient.api.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);
    vi.mocked(dbService.syncQueue.count).mockResolvedValue(0);
    vi.mocked(dbService.syncQueue.add).mockResolvedValue(1);
    vi.mocked(dbService.syncQueue.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.syncQueue.update).mockResolvedValue(1);

    vi.mocked(dbService.foodItems.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.foodItems.where>);
    vi.mocked(dbService.foodItems.add).mockResolvedValue(1);
    vi.mocked(dbService.foodItems.update).mockResolvedValue(1);
    vi.mocked(dbService.foodItems.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.waterLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.waterLogs.where>);
    vi.mocked(dbService.waterLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.waterLogs.update).mockResolvedValue(1);
    vi.mocked(dbService.waterLogs.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.activityLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.activityLogs.where>);
    vi.mocked(dbService.activityLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.activityLogs.update).mockResolvedValue(1);
    vi.mocked(dbService.activityLogs.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);
    vi.mocked(dbService.bodyMeasurements.add).mockResolvedValue(1);
    vi.mocked(dbService.bodyMeasurements.update).mockResolvedValue(1);
    vi.mocked(dbService.bodyMeasurements.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.stepLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.stepLogs.where>);
    vi.mocked(dbService.stepLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.stepLogs.update).mockResolvedValue(1);
    vi.mocked(dbService.stepLogs.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.fastingSessions.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.fastingSessions.where>);
    vi.mocked(dbService.fastingSessions.add).mockResolvedValue(1);
    vi.mocked(dbService.fastingSessions.update).mockResolvedValue(1);
    vi.mocked(dbService.fastingSessions.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.tdeeProfiles.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    } as unknown as ReturnType<typeof dbService.tdeeProfiles.where>);

    vi.mocked(dbService.saveTdeeProfile).mockResolvedValue(undefined);

    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns useSyncService hook with runSync function", () => {
    const { result } = renderHook(() => useSyncService());
    expect(result.current).toHaveProperty("runSync");
    expect(typeof result.current.runSync).toBe("function");
  });

  it("does not sync if not authenticated", async () => {
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);
    const { result } = renderHook(() => useSyncService());
    await result.current.runSync();

    expect(apiClient.api.get).not.toHaveBeenCalled();
  });

  it("does not sync if userId is missing", async () => {
    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        lastSyncedAt: null,
        userId: null,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });

    const { result } = renderHook(() => useSyncService());
    await result.current.runSync();

    expect(apiClient.api.get).not.toHaveBeenCalled();
  });

  it("returns hook with runSync function that is callable", async () => {
    const { result } = renderHook(() => useSyncService());
    expect(typeof result.current.runSync).toBe("function");
    // Ensure no errors when calling runSync
    await expect(result.current.runSync()).resolves.not.toThrow();
  });

  it("sets up event listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useSyncService());

    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("gc:sync", expect.any(Function));
  });

  it("cleans up event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useSyncService());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("gc:sync", expect.any(Function));
  });

  describe("runSync - success path", () => {
    it("calls setSyncStatus syncing then setLastSyncedAt on success", async () => {
      const setSyncStatus = vi.fn();
      const setLastSyncedAt = vi.fn();
      const setSyncError = vi.fn();
      const fetchInitialData = vi.fn().mockResolvedValue(undefined);

      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt,
          setSyncError,
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: null,
          userId,
          fetchInitialData,
        };
        return selector(state as unknown as AppState);
      });

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(setSyncStatus).toHaveBeenCalledWith("syncing");
      expect(setLastSyncedAt).toHaveBeenCalledWith(expect.any(String));
      expect(fetchInitialData).toHaveBeenCalledWith(userId);
    });

    it("calls api.get for all entity change endpoints", async () => {
      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      const calls = vi.mocked(apiClient.api.get).mock.calls.map((c) => c[0] as string);
      expect(calls.some((u) => u.includes("/food-items/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/water-logs/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/activity-logs/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/body-measurements/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/step-logs/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/fasting-sessions/changes"))).toBe(true);
      expect(calls.some((u) => u.includes("/tdee-profile"))).toBe(true);
    });

    it("uses epoch time as since when lastSyncedAt is null", async () => {
      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      const calls = vi.mocked(apiClient.api.get).mock.calls.map((c) => c[0] as string);
      const foodCall = calls.find((u) => u.includes("/food-items/changes"))!;
      expect(foodCall).toContain("1970-01-01");
    });

    it("uses lastSyncedAt timestamp when set", async () => {
      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError: vi.fn(),
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: "2026-05-01T00:00:00.000Z",
          userId,
          fetchInitialData: vi.fn().mockResolvedValue(undefined),
        };
        return selector(state as unknown as AppState);
      });

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      const calls = vi.mocked(apiClient.api.get).mock.calls.map((c) => c[0] as string);
      const foodCall = calls.find((u) => u.includes("/food-items/changes"))!;
      expect(foodCall).toContain("2026-05-01");
    });
  });

  describe("runSync - error paths", () => {
    it("calls setSyncStatus idle on 401 ApiError", async () => {
      const setSyncStatus = vi.fn();
      const setSyncError = vi.fn();

      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt: vi.fn(),
          setSyncError,
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: null,
          userId,
          fetchInitialData: vi.fn().mockResolvedValue(undefined),
        };
        return selector(state as unknown as AppState);
      });

      vi.mocked(apiClient.api.get).mockRejectedValue(new ApiError(401, "Unauthorized"));

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(setSyncStatus).toHaveBeenCalledWith("syncing");
      expect(setSyncStatus).toHaveBeenCalledWith("idle");
      expect(setSyncError).not.toHaveBeenCalled();
    });

    it("calls setSyncStatus offline when navigator is offline", async () => {
      const setSyncStatus = vi.fn();

      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt: vi.fn(),
          setSyncError: vi.fn(),
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: null,
          userId,
          fetchInitialData: vi.fn().mockResolvedValue(undefined),
        };
        return selector(state as unknown as AppState);
      });

      vi.mocked(apiClient.api.get).mockRejectedValue(new Error("Network error"));
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(setSyncStatus).toHaveBeenCalledWith("offline");
    });

    it("calls setSyncError on general error when online", async () => {
      const setSyncError = vi.fn();

      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError,
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: null,
          userId,
          fetchInitialData: vi.fn().mockResolvedValue(undefined),
        };
        return selector(state as unknown as AppState);
      });

      vi.mocked(apiClient.api.get).mockRejectedValue(new Error("Server exploded"));
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(setSyncError).toHaveBeenCalledWith("Server exploded");
    });

    it("calls setSyncError with fallback message for non-Error throws", async () => {
      const setSyncError = vi.fn();

      mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError,
          setPendingSyncCount: vi.fn(),
          lastSyncedAt: null,
          userId,
          fetchInitialData: vi.fn().mockResolvedValue(undefined),
        };
        return selector(state as unknown as AppState);
      });

      vi.mocked(apiClient.api.get).mockRejectedValue("string error");
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(setSyncError).toHaveBeenCalledWith("Sync failed");
    });
  });

  describe("pullFoodItems via runSync", () => {
    it("adds new food item when no existing local record", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/food-items/changes")) {
          return Promise.resolve([
            {
              id: "sync-food-1",
              name: "Apple",
              calories: 80,
              servingSize: 100,
              protein: 0.3,
              carbs: 21,
              fat: 0.2,
              dateLogged: "2026-05-27",
              isFavorite: false,
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.foodItems.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.foodItems.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.foodItems.add).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Apple", syncId: "sync-food-1" }),
      );
    });

    it("updates existing food item when local record found", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/food-items/changes")) {
          return Promise.resolve([
            {
              id: "sync-food-2",
              name: "Banana",
              calories: 89,
              servingSize: 100,
              protein: 1.1,
              carbs: 23,
              fat: 0.3,
              dateLogged: "2026-05-27",
              isFavorite: true,
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.foodItems.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 42, syncId: "sync-food-2" }),
        }),
      } as unknown as ReturnType<typeof dbService.foodItems.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.foodItems.update).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ name: "Banana" }),
      );
    });

    it("deletes food item when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/food-items/changes")) {
          return Promise.resolve([
            {
              id: "sync-food-3",
              name: "Old Food",
              calories: 0,
              servingSize: 100,
              protein: 0,
              carbs: 0,
              fat: 0,
              dateLogged: "2026-05-27",
              isFavorite: false,
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.foodItems.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 99, syncId: "sync-food-3" }),
        }),
      } as unknown as ReturnType<typeof dbService.foodItems.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.foodItems.delete).toHaveBeenCalledWith(99);
    });

    it("skips delete when no existing local record found", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/food-items/changes")) {
          return Promise.resolve([
            {
              id: "sync-food-ghost",
              name: "Ghost",
              calories: 0,
              servingSize: 100,
              protein: 0,
              carbs: 0,
              fat: 0,
              dateLogged: "2026-05-27",
              isFavorite: false,
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.foodItems.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.foodItems.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.foodItems.delete).not.toHaveBeenCalled();
    });
  });

  describe("pullWaterLogs via runSync", () => {
    it("adds new water log when no existing record", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/water-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-water-1",
              amount: 250,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.waterLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.waterLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.waterLogs.add).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 250, syncId: "sync-water-1" }),
      );
    });

    it("updates existing water log", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/water-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-water-2",
              amount: 500,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.waterLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 10, syncId: "sync-water-2" }),
        }),
      } as unknown as ReturnType<typeof dbService.waterLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.waterLogs.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ amount: 500 }),
      );
    });

    it("deletes water log when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/water-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-water-del",
              amount: 250,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.waterLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 20, syncId: "sync-water-del" }),
        }),
      } as unknown as ReturnType<typeof dbService.waterLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.waterLogs.delete).toHaveBeenCalledWith(20);
    });
  });

  describe("pullActivityLogs via runSync", () => {
    it("adds new activity log", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/activity-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-act-1",
              activityType: "Running",
              durationMin: 30,
              caloriesBurned: 300,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.activityLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.activityLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.activityLogs.add).toHaveBeenCalledWith(
        expect.objectContaining({ activityType: "Running", syncId: "sync-act-1" }),
      );
    });

    it("updates existing activity log", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/activity-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-act-2",
              activityType: "Cycling",
              durationMin: 45,
              caloriesBurned: 400,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.activityLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 55, syncId: "sync-act-2" }),
        }),
      } as unknown as ReturnType<typeof dbService.activityLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.activityLogs.update).toHaveBeenCalledWith(
        55,
        expect.objectContaining({ activityType: "Cycling" }),
      );
    });

    it("deletes activity log when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/activity-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-act-del",
              activityType: "Swimming",
              durationMin: 60,
              caloriesBurned: 500,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.activityLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 77, syncId: "sync-act-del" }),
        }),
      } as unknown as ReturnType<typeof dbService.activityLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.activityLogs.delete).toHaveBeenCalledWith(77);
    });
  });

  describe("pullBodyMeasurements via runSync", () => {
    it("adds new body measurement", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/body-measurements/changes")) {
          return Promise.resolve([
            {
              id: "sync-body-1",
              weightKg: 75.5,
              bodyFatPct: 18.0,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.bodyMeasurements.add).toHaveBeenCalledWith(
        expect.objectContaining({ weight: 75.5, syncId: "sync-body-1" }),
      );
    });

    it("deletes body measurement when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/body-measurements/changes")) {
          return Promise.resolve([
            {
              id: "sync-body-del",
              weightKg: 70,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 33, syncId: "sync-body-del" }),
        }),
      } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.bodyMeasurements.delete).toHaveBeenCalledWith(33);
    });
  });

  describe("pullStepLogs via runSync", () => {
    it("adds new step log", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/step-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-step-1",
              steps: 8500,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.stepLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.stepLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.stepLogs.add).toHaveBeenCalledWith(
        expect.objectContaining({ steps: 8500, syncId: "sync-step-1" }),
      );
    });

    it("deletes step log when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/step-logs/changes")) {
          return Promise.resolve([
            {
              id: "sync-step-del",
              steps: 5000,
              dateLogged: "2026-05-27",
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.stepLogs.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 44, syncId: "sync-step-del" }),
        }),
      } as unknown as ReturnType<typeof dbService.stepLogs.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.stepLogs.delete).toHaveBeenCalledWith(44);
    });
  });

  describe("pullFastingSessions via runSync", () => {
    it("adds new fasting session", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/fasting-sessions/changes")) {
          return Promise.resolve([
            {
              id: "sync-fast-1",
              startTime: "2026-05-27T08:00:00Z",
              targetHours: 16,
              dateLogged: "2026-05-27",
              completed: false,
              updatedAt: "2026-05-27T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.fastingSessions.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
      } as unknown as ReturnType<typeof dbService.fastingSessions.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.fastingSessions.add).toHaveBeenCalledWith(
        expect.objectContaining({ targetHours: 16, syncId: "sync-fast-1" }),
      );
    });

    it("deletes fasting session when deletedAt is set", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/fasting-sessions/changes")) {
          return Promise.resolve([
            {
              id: "sync-fast-del",
              startTime: "2026-05-27T08:00:00Z",
              targetHours: 14,
              dateLogged: "2026-05-27",
              completed: true,
              updatedAt: "2026-05-27T10:00:00Z",
              deletedAt: "2026-05-27T11:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.fastingSessions.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 66, syncId: "sync-fast-del" }),
        }),
      } as unknown as ReturnType<typeof dbService.fastingSessions.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.fastingSessions.delete).toHaveBeenCalledWith(66);
    });
  });

  describe("pullTdeeProfile via runSync", () => {
    it("saves tdee profile when api returns profile", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/tdee-profile")) {
          return Promise.resolve({
            age: 30,
            sex: "male",
            heightCm: 180,
            weightKg: 80,
            activityLevel: "moderate",
            goal: "maintain",
            updatedAt: "2026-05-27T10:00:00Z",
          });
        }
        return Promise.resolve([]);
      });

      vi.mocked(dbService.tdeeProfiles.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 1, userId }),
        }),
      } as unknown as ReturnType<typeof dbService.tdeeProfiles.where>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.saveTdeeProfile).toHaveBeenCalledWith(
        expect.objectContaining({ age: 30, sex: "male" }),
      );
    });

    it("skips saving when api returns null for tdee profile", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/tdee-profile")) {
          return Promise.resolve(null);
        }
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.saveTdeeProfile).not.toHaveBeenCalled();
    });

    it("does not throw when tdee profile api call fails", async () => {
      vi.mocked(apiClient.api.get).mockImplementation((url: string) => {
        if ((url as string).includes("/tdee-profile")) {
          return Promise.reject(new Error("Profile fetch failed"));
        }
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useSyncService());
      await expect(
        act(async () => {
          await result.current.runSync();
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("flushQueue via runSync", () => {
    function makeQueueEntry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
      return {
        id: 1,
        userId,
        entityType: "foodItem",
        syncId: "sync-q-1",
        operation: "create",
        payload: { name: "Apple" },
        retries: 0,
        createdAt: new Date().toISOString(),
        ...overrides,
      };
    }

    it("calls api.post for create operation and deletes queue entry on success", async () => {
      const entry = makeQueueEntry({ operation: "create", entityType: "foodItem" });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(apiClient.api.post).toHaveBeenCalledWith("/api/v1/food-items", entry.payload);
      expect(dbService.syncQueue.delete).toHaveBeenCalledWith(1);
    });

    it("calls api.put for update operation", async () => {
      const entry = makeQueueEntry({
        operation: "update",
        entityType: "waterLog",
        syncId: "wl-sync-1",
        payload: { amount: 300 },
      });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(apiClient.api.put).toHaveBeenCalledWith("/api/v1/water-logs/wl-sync-1", entry.payload);
    });

    it("calls api.delete for delete operation", async () => {
      const entry = makeQueueEntry({
        operation: "delete",
        entityType: "activityLog",
        syncId: "al-sync-1",
        payload: null,
      });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(apiClient.api.delete).toHaveBeenCalledWith("/api/v1/activity-logs/al-sync-1");
    });

    it("deletes queue entry on 4xx ApiError (client error)", async () => {
      const entry = makeQueueEntry({ id: 5 });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);
      vi.mocked(apiClient.api.post).mockRejectedValue(new ApiError(422, "Unprocessable"));

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.syncQueue.delete).toHaveBeenCalledWith(5);
    });

    it("increments retries on non-4xx error when below MAX_RETRIES", async () => {
      const entry = makeQueueEntry({ id: 7, retries: 0 });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);
      vi.mocked(apiClient.api.post).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.syncQueue.update).toHaveBeenCalledWith(7, { retries: 1 });
    });

    it("deletes queue entry when retries reach MAX_RETRIES (3)", async () => {
      const entry = makeQueueEntry({ id: 9, retries: 2 });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);
      vi.mocked(apiClient.api.post).mockRejectedValue(new Error("Persistent failure"));

      const { result } = renderHook(() => useSyncService());
      await act(async () => {
        await result.current.runSync();
      });

      expect(dbService.syncQueue.delete).toHaveBeenCalledWith(9);
      expect(dbService.syncQueue.update).not.toHaveBeenCalled();
    });

    it("skips unknown entityType without throwing", async () => {
      const entry = makeQueueEntry({ entityType: "unknownEntity" as unknown as SyncEntityType });
      vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue([entry]),
      } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);

      const { result } = renderHook(() => useSyncService());
      await expect(
        act(async () => {
          await result.current.runSync();
        }),
      ).resolves.not.toThrow();
    });
  });
});

describe("activateE2E", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    mockApiPost.mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue([]);
    mockDeriveKey.mockResolvedValue({ type: "secret" } as unknown as CryptoKey);
    mockEncryptBlob.mockResolvedValue({ iv: "testiv", ciphertext: "testct" });

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);
    vi.mocked(dbService.syncQueue.bulkAdd).mockResolvedValue([]);

    vi.mocked(dbService.foodItems.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.foodItems.where>);
    vi.mocked(dbService.waterLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.waterLogs.where>);
    vi.mocked(dbService.activityLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.activityLogs.where>);
    vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);
    vi.mocked(dbService.stepLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.stepLogs.where>);
    vi.mocked(dbService.fastingSessions.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.fastingSessions.where>);

    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });
  });

  it("posts salt, derives key, resets server, re-queues local data, and flushes", async () => {
    await expect(activateE2E("user-1" as UserId, "correct-horse")).resolves.toBeUndefined();
    expect(mockDeriveKey).toHaveBeenCalledWith("correct-horse", expect.any(Uint8Array));
    expect(mockApiPost).toHaveBeenCalledWith(
      "/api/v1/sync/e2e-config",
      expect.objectContaining({ salt: expect.any(String) }),
    );
    expect(mockApiPost).toHaveBeenCalledWith("/api/v1/sync/reset", {});
  });

  it("calls setE2EEnabled(true) only after successful upload", async () => {
    // activateE2E uses useAppState.getState() (not the hook), so assertions go
    // against the hoisted mockSetE2EEnabled/mockSetE2EKeyReady returned by getState.
    await activateE2E("user-1" as UserId, "pass");

    expect(mockSetE2EEnabled).toHaveBeenCalledWith(true);
    expect(mockSetE2EKeyReady).toHaveBeenCalledWith(true);
  });

  it("stores the derived key via setE2EKey", async () => {
    const fakeKey = { type: "secret" } as unknown as CryptoKey;
    mockDeriveKey.mockResolvedValue(fakeKey);

    await activateE2E("user-1" as UserId, "pass");

    expect(mockSetE2EKey).toHaveBeenCalledWith(fakeKey);
  });
});

describe("enqueueAllLocalData via activateE2E", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    mockApiPost.mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue([]);
    mockDeriveKey.mockResolvedValue({ type: "secret" } as unknown as CryptoKey);
    mockEncryptBlob.mockResolvedValue({ iv: "iv", ciphertext: "ct" });

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);
    vi.mocked(dbService.syncQueue.bulkAdd).mockResolvedValue([]);
    vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);

    vi.mocked(dbService.foodItems.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.foodItems.where>);
    vi.mocked(dbService.waterLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.waterLogs.where>);
    vi.mocked(dbService.activityLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.activityLogs.where>);
    vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);
    vi.mocked(dbService.stepLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.stepLogs.where>);
    vi.mocked(dbService.fastingSessions.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.fastingSessions.where>);

    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: false,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });
  });

  // NOTE: All Dexie Table instances share the same auto-mocked `where` function.
  // mockReturnValue on foodItems.where, waterLogs.where, syncQueue.where etc. all
  // override the SAME underlying vi.fn(). The fix: use mockImplementation with a
  // toArray vi.fn() that uses mockReturnValueOnce to return different data per call.
  // enqueueAllLocalData calls 6 entity toArray() calls, then flushQueueE2E calls
  // syncQueue toArray(). Use mockReturnValueOnce for entity calls, mockReturnValue
  // for the syncQueue call (the fallback).

  it("returns early without calling bulkAdd when no entities have syncId", async () => {
    // Food item has no syncId: filter removes all, entries.length === 0, early return.
    const toArrayMock = vi
      .fn()
      .mockResolvedValueOnce([{ id: 1, name: "Apple", calories: 80 }]) // food - no syncId
      .mockResolvedValueOnce([]) // water
      .mockResolvedValueOnce([]) // activity
      .mockResolvedValueOnce([]) // body
      .mockResolvedValueOnce([]) // step
      .mockResolvedValueOnce([]) // fasting
      .mockResolvedValue([]); // syncQueue toArray (fallback for flushQueueE2E)

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: toArrayMock,
        delete: vi.fn().mockResolvedValue(undefined),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);

    await activateE2E(userId, "pass");

    expect(dbService.syncQueue.bulkAdd).not.toHaveBeenCalled();
  });

  it("calls bulkAdd with foodItem entries when food items have syncId", async () => {
    const foodItem = {
      id: 1,
      name: "Apple",
      calories: 80,
      syncId: "sync-food-enqueue-1",
      userId,
    };

    // Call order: food, water, activity, body, step, fasting (enqueueAllLocalData),
    // then syncQueue (flushQueueE2E). Fallback returns [] so flushQueueE2E exits early.
    const toArrayMock = vi
      .fn()
      .mockResolvedValueOnce([foodItem]) // food - has syncId
      .mockResolvedValueOnce([]) // water
      .mockResolvedValueOnce([]) // activity
      .mockResolvedValueOnce([]) // body
      .mockResolvedValueOnce([]) // step
      .mockResolvedValueOnce([]) // fasting
      .mockResolvedValue([]); // syncQueue toArray (fallback)

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: toArrayMock,
        delete: vi.fn().mockResolvedValue(undefined),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);

    await activateE2E(userId, "pass");

    expect(dbService.syncQueue.bulkAdd).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "foodItem",
          syncId: "sync-food-enqueue-1",
          operation: "update",
          retries: 0,
        }),
      ]),
    );
  });

  it("calls bulkAdd with entries for all entity types that have syncId", async () => {
    const foodItem = { id: 1, name: "Apple", calories: 80, syncId: "sync-food-all-1", userId };
    const waterLog = {
      id: 2,
      amount: 250,
      dateLogged: "2026-06-01",
      syncId: "sync-water-all-1",
      userId,
    };
    const activityLog = {
      id: 3,
      activityType: "Running",
      durationMin: 30,
      caloriesBurned: 300,
      syncId: "sync-act-all-1",
      userId,
    };
    const bodyMeasurement = {
      id: 4,
      weight: 72.5,
      measuredAt: "2026-06-01",
      syncId: "sync-body-all-1",
      userId,
    };
    const stepLog = {
      id: 5,
      steps: 8000,
      dateLogged: "2026-06-01",
      syncId: "sync-step-all-1",
      userId,
    };
    const fastingSession = {
      id: 6,
      startTime: "2026-06-01T08:00:00Z",
      targetHours: 16,
      completed: false,
      syncId: "sync-fast-all-1",
      userId,
    };

    // One entity per type, all with syncId. flushQueueE2E gets [] on 7th call.
    const toArrayMock = vi
      .fn()
      .mockResolvedValueOnce([foodItem])
      .mockResolvedValueOnce([waterLog])
      .mockResolvedValueOnce([activityLog])
      .mockResolvedValueOnce([bodyMeasurement])
      .mockResolvedValueOnce([stepLog])
      .mockResolvedValueOnce([fastingSession])
      .mockResolvedValue([]); // syncQueue toArray fallback

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: toArrayMock,
        delete: vi.fn().mockResolvedValue(undefined),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);

    await activateE2E(userId, "pass");

    const bulkAddCall = vi.mocked(dbService.syncQueue.bulkAdd).mock.calls[0]?.[0];
    expect(bulkAddCall).toBeDefined();
    const entityTypes = (bulkAddCall as unknown as Array<{ entityType: string }>).map(
      (e) => e.entityType,
    );
    expect(entityTypes).toStrictEqual([
      "foodItem",
      "waterLog",
      "activityLog",
      "bodyMeasurement",
      "stepLog",
      "fastingSession",
    ]);
    const syncIds = (bulkAddCall as unknown as Array<{ syncId: string }>).map((e) => e.syncId);
    expect(syncIds).toStrictEqual([
      "sync-food-all-1",
      "sync-water-all-1",
      "sync-act-all-1",
      "sync-body-all-1",
      "sync-step-all-1",
      "sync-fast-all-1",
    ]);
  });

  it("filters out entities without syncId and only enqueues those with syncId", async () => {
    const foodItemWithSync = {
      id: 1,
      name: "Apple",
      calories: 80,
      syncId: "sync-food-filter-1",
      userId,
    };
    const foodItemNoSync = { id: 2, name: "Banana", calories: 89, userId };

    // Two food items: one with syncId, one without. Only one should be enqueued.
    const toArrayMock = vi
      .fn()
      .mockResolvedValueOnce([foodItemWithSync, foodItemNoSync]) // food - mixed
      .mockResolvedValueOnce([]) // water
      .mockResolvedValueOnce([]) // activity
      .mockResolvedValueOnce([]) // body
      .mockResolvedValueOnce([]) // step
      .mockResolvedValueOnce([]) // fasting
      .mockResolvedValue([]); // syncQueue toArray fallback

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: toArrayMock,
        delete: vi.fn().mockResolvedValue(undefined),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);

    await activateE2E(userId, "pass");

    const bulkAddCall = vi.mocked(dbService.syncQueue.bulkAdd).mock.calls[0]?.[0];
    expect(bulkAddCall).toHaveLength(1);
    expect((bulkAddCall as unknown as Array<{ syncId: string }>)[0]?.syncId).toBe(
      "sync-food-filter-1",
    );
  });
});

describe("runSync - E2E path", () => {
  const fakeKey = { type: "secret" } as unknown as CryptoKey;

  // Helper: override getState to return e2eEnabled: true for the duration of a test.
  function enableE2E() {
    (mockUseAppState as unknown as { getState: () => unknown }).getState = () => ({
      setE2EEnabled: mockSetE2EEnabled,
      setE2EKeyReady: mockSetE2EKeyReady,
      e2eEnabled: true,
    });
  }

  function disableE2E() {
    (mockUseAppState as unknown as { getState: () => unknown }).getState = () => ({
      setE2EEnabled: mockSetE2EEnabled,
      setE2EKeyReady: mockSetE2EKeyReady,
      e2eEnabled: false,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    mockApiGet.mockResolvedValue([]);
    mockApiPost.mockResolvedValue(undefined);
    mockGetE2EKey.mockReturnValue(fakeKey);
    mockDecryptBlob.mockResolvedValue({
      entityType: "foodItem",
      operation: "update",
      syncId: "sync-remote-1",
      payload: { name: "Banana", calories: 90 },
    });

    vi.mocked(dbService.syncQueue.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof dbService.syncQueue.where>);

    vi.mocked(dbService.foodItems.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.foodItems.where>);
    vi.mocked(dbService.foodItems.add).mockResolvedValue(1);
    vi.mocked(dbService.waterLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.waterLogs.where>);
    vi.mocked(dbService.waterLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.activityLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.activityLogs.where>);
    vi.mocked(dbService.activityLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);
    vi.mocked(dbService.bodyMeasurements.add).mockResolvedValue(1);
    vi.mocked(dbService.stepLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.stepLogs.where>);
    vi.mocked(dbService.stepLogs.add).mockResolvedValue(1);
    vi.mocked(dbService.fastingSessions.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.fastingSessions.where>);
    vi.mocked(dbService.fastingSessions.add).mockResolvedValue(1);
    vi.mocked(dbService.fastingSessions.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.stepLogs.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.bodyMeasurements.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.activityLogs.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.waterLogs.delete).mockResolvedValue(undefined);
    vi.mocked(dbService.foodItems.delete).mockResolvedValue(undefined);

    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: true,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });
    enableE2E();
  });

  afterEach(() => {
    disableE2E();
    vi.restoreAllMocks();
  });

  it("calls flushQueueE2E and pullBlobsE2E instead of plaintext paths when e2eEnabled", async () => {
    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    // E2E path posts blobs batch (flush) and GETs blobs (pull), not entity-specific endpoints.
    const getCalls = mockApiGet.mock.calls.map((c) => c[0] as string);
    expect(getCalls.some((u) => u.includes("/sync/blobs"))).toBe(true);
    expect(getCalls.some((u) => u.includes("/food-items/changes"))).toBe(false);
  });

  it("returns early without syncing when e2eEnabled but key is not loaded", async () => {
    mockGetE2EKey.mockReturnValue(undefined);

    const setSyncStatus = vi.fn();
    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus,
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: true,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(setSyncStatus).toHaveBeenCalledWith("idle");
  });

  it("decrypts pulled blobs and upserts into foodItems table", async () => {
    mockApiGet.mockResolvedValue([
      { clientBlobId: "foodItem:sync-remote-1", iv: "iv1", ciphertext: "ct1", isDeleted: false },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "foodItem",
      operation: "update",
      syncId: "sync-remote-1",
      payload: { name: "Banana", calories: 90 },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(mockDecryptBlob).toHaveBeenCalled();
    expect(dbService.foodItems.add).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Banana", syncId: "sync-remote-1" }),
    );
  });

  it("applies remote delete from blob when isDeleted is true for foodItem", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "foodItem:sync-del-1",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.foodItems.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 99, syncId: "sync-del-1" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.foodItems.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.foodItems.delete).toHaveBeenCalledWith(99);
  });

  it("applies remote delete for waterLog entity type", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "waterLog:sync-wl-del",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.waterLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 77, syncId: "sync-wl-del" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.waterLogs.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.waterLogs.delete).toHaveBeenCalledWith(77);
  });

  it("applies remote delete for activityLog entity type", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "activityLog:sync-al-del",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.activityLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 66, syncId: "sync-al-del" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.activityLogs.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.activityLogs.delete).toHaveBeenCalledWith(66);
  });

  it("applies remote delete for bodyMeasurement entity type", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "bodyMeasurement:sync-bm-del",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.bodyMeasurements.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 55, syncId: "sync-bm-del" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.bodyMeasurements.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.bodyMeasurements.delete).toHaveBeenCalledWith(55);
  });

  it("applies remote delete for stepLog entity type", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "stepLog:sync-sl-del",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.stepLogs.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 44, syncId: "sync-sl-del" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.stepLogs.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.stepLogs.delete).toHaveBeenCalledWith(44);
  });

  it("applies remote delete for fastingSession entity type", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "fastingSession:sync-fs-del",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    vi.mocked(dbService.fastingSessions.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 33, syncId: "sync-fs-del" }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof dbService.fastingSessions.where>);

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.fastingSessions.delete).toHaveBeenCalledWith(33);
  });

  it("upserts waterLog from decrypted blob", async () => {
    mockApiGet.mockResolvedValue([
      { clientBlobId: "waterLog:sync-wl-1", iv: "iv2", ciphertext: "ct2", isDeleted: false },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "waterLog",
      operation: "update",
      syncId: "sync-wl-1",
      payload: { amount: 250, dateLogged: "2026-06-01" },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.waterLogs.add).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250, syncId: "sync-wl-1" }),
    );
  });

  it("upserts activityLog from decrypted blob", async () => {
    mockApiGet.mockResolvedValue([
      { clientBlobId: "activityLog:sync-al-1", iv: "iv3", ciphertext: "ct3", isDeleted: false },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "activityLog",
      operation: "update",
      syncId: "sync-al-1",
      payload: { activityType: "Running", durationMin: 30, caloriesBurned: 300 },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.activityLogs.add).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "Running", syncId: "sync-al-1" }),
    );
  });

  it("upserts bodyMeasurement from decrypted blob", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "bodyMeasurement:sync-bm-1",
        iv: "iv4",
        ciphertext: "ct4",
        isDeleted: false,
      },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "bodyMeasurement",
      operation: "update",
      syncId: "sync-bm-1",
      payload: { weight: 72.5, measuredAt: "2026-06-01" },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.bodyMeasurements.add).toHaveBeenCalledWith(
      expect.objectContaining({ weight: 72.5, syncId: "sync-bm-1" }),
    );
  });

  it("upserts stepLog from decrypted blob", async () => {
    mockApiGet.mockResolvedValue([
      { clientBlobId: "stepLog:sync-sl-1", iv: "iv5", ciphertext: "ct5", isDeleted: false },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "stepLog",
      operation: "update",
      syncId: "sync-sl-1",
      payload: { steps: 9000, dateLogged: "2026-06-01" },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.stepLogs.add).toHaveBeenCalledWith(
      expect.objectContaining({ steps: 9000, syncId: "sync-sl-1" }),
    );
  });

  it("upserts fastingSession from decrypted blob", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "fastingSession:sync-fs-1",
        iv: "iv6",
        ciphertext: "ct6",
        isDeleted: false,
      },
    ]);
    mockDecryptBlob.mockResolvedValue({
      entityType: "fastingSession",
      operation: "update",
      syncId: "sync-fs-1",
      payload: { startTime: "2026-06-01T08:00:00Z", targetHours: 16, completed: false },
    });

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(dbService.fastingSessions.add).toHaveBeenCalledWith(
      expect.objectContaining({ targetHours: 16, syncId: "sync-fs-1" }),
    );
  });

  it("clears E2E key and sets sync error on DOMException (wrong passphrase)", async () => {
    const setSyncError = vi.fn();
    mockUseAppState.mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError,
        setPendingSyncCount: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
        e2eEnabled: true,
        setE2EEnabled: vi.fn(),
        setE2EKeyReady: vi.fn(),
      };
      return selector(state as unknown as AppState);
    });

    mockApiGet.mockRejectedValue(
      new DOMException("The operation failed for an operation-specific reason", "OperationError"),
    );

    const { result } = renderHook(() => useSyncService());
    await act(async () => {
      await result.current.runSync();
    });

    expect(mockClearE2EKey).toHaveBeenCalled();
    expect(setSyncError).toHaveBeenCalledWith("Incorrect passphrase - unlock sync to continue");
  });

  it("ignores unknown entityType in remote delete without throwing", async () => {
    mockApiGet.mockResolvedValue([
      {
        clientBlobId: "unknownEntity:sync-unk-1",
        iv: "",
        ciphertext: "",
        isDeleted: true,
        updatedAt: null,
      },
    ]);

    const { result } = renderHook(() => useSyncService());
    await expect(
      act(async () => {
        await result.current.runSync();
      }),
    ).resolves.not.toThrow();
  });
});

describe("enqueueSyncOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    vi.mocked(dbService.syncQueue.add).mockResolvedValue(1);
  });

  it("adds entry to sync queue when authenticated", async () => {
    await enqueueSyncOperation({
      userId,
      entityType: "foodItem",
      syncId: "uuid-123",
      operation: "create",
      payload: { name: "Apple" },
    });

    expect(dbService.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "foodItem",
        syncId: "uuid-123",
        operation: "create",
        payload: { name: "Apple" },
        retries: 0,
        createdAt: expect.any(String),
      }),
    );
  });

  it("does not enqueue if not authenticated", async () => {
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);

    await enqueueSyncOperation({
      userId,
      entityType: "foodItem",
      syncId: "uuid-123",
      operation: "create",
      payload: { name: "Apple" },
    });

    expect(dbService.syncQueue.add).not.toHaveBeenCalled();
  });

  it("includes createdAt timestamp", async () => {
    const before = new Date().toISOString();
    await enqueueSyncOperation({
      userId,
      entityType: "waterLog",
      syncId: "uuid-456",
      operation: "update",
      payload: { amount: 250 },
    });
    const after = new Date().toISOString();

    const call = vi.mocked(dbService.syncQueue.add).mock.calls[0]?.[0];
    expect(call?.createdAt).toBeDefined();
    expect(call!.createdAt >= before).toBe(true);
    expect(call!.createdAt <= after).toBe(true);
  });

  it("enqueues delete operations", async () => {
    await enqueueSyncOperation({
      userId,
      entityType: "activityLog",
      syncId: "uuid-789",
      operation: "delete",
      payload: null,
    });

    expect(dbService.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "delete",
        payload: null,
      }),
    );
  });
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueSyncOperation, useSyncService } from "./useSyncService";
import * as apiClient from "../lib/apiClient";
import { ApiError } from "../lib/apiClient";
import type { SyncEntityType, SyncQueueEntry } from "../db/dbService";
import * as dbService from "../db/dbService";
import type { AppState } from "../state/AppState";
import { useAppState } from "../state/AppState";
import type { UserId } from "@/types";

vi.mock("../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/apiClient")>();
  return {
    ...actual,
    isAuthenticated: vi.fn(),
    clearTokens: vi.fn(),
    storeTokens: vi.fn(),
    api: {
      get: vi.fn(),
      post: vi.fn(),
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
vi.mock("../state/AppState");

const userId = "user-1" as UserId;

describe("useSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);
    vi.mocked(apiClient.api.get).mockResolvedValue([]);
    vi.mocked(apiClient.api.post).mockResolvedValue({});
    vi.mocked(apiClient.api.put).mockResolvedValue({});
    vi.mocked(apiClient.api.delete).mockResolvedValue(undefined);

    vi.mocked(dbService.syncQueue.orderBy).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof dbService.syncQueue.orderBy>);
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

    vi.mocked(useAppState).mockImplementation((selector) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        lastSyncedAt: null,
        userId,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(useAppState).mockImplementation((selector) => {
      const state = {
        setSyncStatus: vi.fn(),
        setLastSyncedAt: vi.fn(),
        setSyncError: vi.fn(),
        lastSyncedAt: null,
        userId: null,
        fetchInitialData: vi.fn().mockResolvedValue(undefined),
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

      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt,
          setSyncError,
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
      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError: vi.fn(),
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

      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt: vi.fn(),
          setSyncError,
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

      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus,
          setLastSyncedAt: vi.fn(),
          setSyncError: vi.fn(),
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

      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError,
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

      vi.mocked(useAppState).mockImplementation((selector) => {
        const state = {
          setSyncStatus: vi.fn(),
          setLastSyncedAt: vi.fn(),
          setSyncError,
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

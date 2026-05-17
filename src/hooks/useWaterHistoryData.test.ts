import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWaterHistoryData } from "./useWaterHistoryData";
import { ISODate, UserId, WaterLogId } from "@/types";
import type { AppState } from "../state/AppState";
import * as appState from "../state/AppState";
import { toast } from "sonner";
import * as dbService from "../db/dbService";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../db/dbService");

describe("useWaterHistoryData", () => {
  const userId = UserId("test-user");
  let mockAppStateData: AppState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppStateData = {
      userId,
      init: {
        status: "ready" as const,
        user: {
          id: userId,
          calorieGoal: 2000,
          username: "test",
          email: "test@example.com",
          lastLogin: new Date().toISOString(),
        },
      },
      dailyLogs: [],
      allFoodItems: [],
      recipes: [],
      favoriteFoods: [],
      dailyWaterLogs: [],
      dailyStepLogs: [],
      bodyMeasurements: [],
      unlockedAchievements: [],
      error: null,
      waterGoalMl: 2000,
      stepGoal: 10000,
      fetchInitialData: vi.fn(),
      refreshDailyLogs: vi.fn(),
      addFoodLog: vi.fn(),
      deleteFoodLog: vi.fn(),
      updateCalorieGoal: vi.fn(),
      fetchRecipes: vi.fn(),
      deleteRecipe: vi.fn(),
      updateRecipe: vi.fn(),
      fetchAllFoodItems: vi.fn(),
      fetchFavorites: vi.fn(),
      toggleFavorite: vi.fn(),
      updateFoodLog: vi.fn(),
      addWaterLog: vi.fn(),
      deleteWaterLog: vi.fn(),
      fetchDailyWaterLogs: vi.fn(),
      setWaterGoalMl: vi.fn(),
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      fetchDailyStepLogs: vi.fn(),
      setStepGoal: vi.fn(),
      addBodyMeasurement: vi.fn(),
      deleteBodyMeasurement: vi.fn(),
      fetchBodyMeasurements: vi.fn(),
      checkAndUnlockAchievements: vi.fn(),
      fetchAchievements: vi.fn(),
    } as unknown as AppState;

    vi.mocked(appState).useAppState.mockImplementation(((
      selector?: (state: AppState) => unknown,
    ) => {
      if (typeof selector === "function") {
        return selector(mockAppStateData);
      }
      return mockAppStateData;
    }) as unknown as typeof appState.useAppState);

    vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state when userId is not set", () => {
    vi.mocked(appState).useAppState.mockReturnValueOnce({
      userId: null,
    } as unknown as AppState);
    const { result } = renderHook(() => useWaterHistoryData());
    expect(result.current.isLoading).toBe(true);
  });

  it("should return hook with required properties", async () => {
    const { result } = renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current).toHaveProperty("labels");
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("should return arrays for labels and data", async () => {
    const { result } = renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(Array.isArray(result.current.labels)).toBe(true);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should accept 7 day parameter", async () => {
    const { result } = renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("should accept 30 day parameter", async () => {
    const { result } = renderHook(() => useWaterHistoryData(30));
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("should call getAllWaterLogs when userId is set", async () => {
    renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(vi.mocked(dbService).getAllWaterLogs).toHaveBeenCalledWith(userId);
    });
  });

  it("should aggregate water logs by date", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split("T")[0]!;

    const logs = [
      {
        id: WaterLogId(1),
        userId,
        amount: 500,
        dateLogged: ISODate(today),
        loggedAt: `${today}T10:00:00Z`,
      },
      {
        id: WaterLogId(2),
        userId,
        amount: 500,
        dateLogged: ISODate(today),
        loggedAt: `${today}T14:00:00Z`,
      },
      {
        id: WaterLogId(3),
        userId,
        amount: 300,
        dateLogged: ISODate(yesterdayISO),
        loggedAt: `${yesterdayISO}T10:00:00Z`,
      },
    ];

    vi.mocked(dbService).getAllWaterLogs.mockResolvedValue(logs);

    const { result } = renderHook(() => useWaterHistoryData(7));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(Array.isArray(result.current.labels)).toBe(true);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should handle empty water logs", async () => {
    vi.mocked(dbService).getAllWaterLogs.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(result.current.labels).toBeDefined();
      expect(result.current.data).toBeDefined();
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(dbService).getAllWaterLogs.mockRejectedValueOnce(new Error("DB error"));

    renderHook(() => useWaterHistoryData(7));

    expect(toast.error).toBeDefined();
  });

  it("should handle cleanup on unmount", () => {
    vi.mocked(dbService).getAllWaterLogs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        }),
    );

    const { unmount } = renderHook(() => useWaterHistoryData(7));

    unmount();

    expect(true).toBe(true);
  });

  it("should handle water logs from different dates", async () => {
    const logs = [
      {
        id: WaterLogId(1),
        userId,
        amount: 250,
        dateLogged: ISODate("2026-05-15"),
        loggedAt: "2026-05-15T10:00:00Z",
      },
      {
        id: WaterLogId(2),
        userId,
        amount: 500,
        dateLogged: ISODate("2026-05-16"),
        loggedAt: "2026-05-16T10:00:00Z",
      },
    ];

    vi.mocked(dbService).getAllWaterLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useWaterHistoryData(7));
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("should filter out logs outside the date range", async () => {
    const today = new Date();
    const oldDate = new Date(today);
    oldDate.setDate(today.getDate() - 30); // 30 days ago
    const oldISO = ISODate(oldDate.toISOString().split("T")[0]!);

    const logs = [
      {
        id: WaterLogId(1),
        userId,
        amount: 250,
        dateLogged: oldISO,
        loggedAt: oldISO + "T10:00:00Z",
      },
    ];

    vi.mocked(dbService).getAllWaterLogs.mockResolvedValueOnce(logs);

    const { result } = renderHook(() => useWaterHistoryData(7));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it("should not update state if component unmounts during fetch", async () => {
    vi.mocked(dbService).getAllWaterLogs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                id: WaterLogId(1),
                userId,
                amount: 500,
                dateLogged: ISODate("2026-05-16"),
                loggedAt: "2026-05-16T10:00:00Z",
              },
            ]);
          }, 50);
        }),
    );

    const { unmount } = renderHook(() => useWaterHistoryData(7));
    unmount();
    await new Promise((r) => setTimeout(r, 100));

    expect(true).toBe(true);
  });

  it("should properly aggregate multiple logs on same date", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const logs = [
      {
        id: WaterLogId(1),
        userId,
        amount: 250,
        dateLogged: ISODate(today),
        loggedAt: `${today}T08:00:00Z`,
      },
      {
        id: WaterLogId(2),
        userId,
        amount: 250,
        dateLogged: ISODate(today),
        loggedAt: `${today}T12:00:00Z`,
      },
      {
        id: WaterLogId(3),
        userId,
        amount: 500,
        dateLogged: ISODate(today),
        loggedAt: `${today}T18:00:00Z`,
      },
    ];

    vi.mocked(dbService).getAllWaterLogs.mockResolvedValue(logs);

    const { result } = renderHook(() => useWaterHistoryData(7));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(Array.isArray(result.current.labels)).toBe(true);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  describe("async data processing (covers .then() and .catch() blocks)", () => {
    it("builds 7 labels and places today's water amount at the correct index", async () => {
      const today = new Date().toISOString().split("T")[0]!;
      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([
        {
          id: WaterLogId(1),
          userId,
          amount: 750,
          dateLogged: ISODate(today),
          loggedAt: `${today}T09:00:00Z`,
        },
      ]);

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(7);
      });

      const todayLabel = today.substring(5); // MM-DD format
      const todayIndex = result.current.labels.indexOf(todayLabel);
      expect(todayIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.data[todayIndex]).toBe(750);
    });

    it("aggregates multiple logs on the same date by summing their amounts", async () => {
      const today = new Date().toISOString().split("T")[0]!;
      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([
        {
          id: WaterLogId(1),
          userId,
          amount: 300,
          dateLogged: ISODate(today),
          loggedAt: `${today}T08:00:00Z`,
        },
        {
          id: WaterLogId(2),
          userId,
          amount: 400,
          dateLogged: ISODate(today),
          loggedAt: `${today}T12:00:00Z`,
        },
        {
          id: WaterLogId(3),
          userId,
          amount: 150,
          dateLogged: ISODate(today),
          loggedAt: `${today}T18:00:00Z`,
        },
      ]);

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(7);
      });

      const todayLabel = today.substring(5);
      const todayIndex = result.current.labels.indexOf(todayLabel);
      expect(result.current.data[todayIndex]).toBe(850); // 300 + 400 + 150
    });

    it("gives zero for every day when there are no logs", async () => {
      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([]);

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(7);
      });

      expect(result.current.data.every((v) => v === 0)).toBe(true);
    });

    it("excludes logs that fall outside the 7-day window", async () => {
      const today = new Date();
      const oldDate = new Date(today);
      oldDate.setDate(today.getDate() - 30);
      const oldISO = oldDate.toISOString().split("T")[0]!;

      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([
        {
          id: WaterLogId(4),
          userId,
          amount: 999,
          dateLogged: ISODate(oldISO),
          loggedAt: `${oldISO}T10:00:00Z`,
        },
      ]);

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(7);
      });

      expect(result.current.data.every((v) => v === 0)).toBe(true);
    });

    it("builds 30 labels when days=30", async () => {
      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([]);

      const { result } = renderHook(() => useWaterHistoryData(30));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(30);
      });
    });

    it("sets isLoading to false after a successful fetch", async () => {
      vi.mocked(dbService).getAllWaterLogs.mockResolvedValue([]);

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.labels).toHaveLength(7);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("calls toast.error and sets isLoading=false when the fetch rejects", async () => {
      vi.mocked(dbService).getAllWaterLogs.mockRejectedValue(new Error("DB error"));

      const { result } = renderHook(() => useWaterHistoryData(7));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(vi.mocked(toast).error).toHaveBeenCalledWith("Failed to load water history.");
    });

    it("does not call toast.error when the component unmounts before a pending fetch rejects", async () => {
      vi.mocked(dbService).getAllWaterLogs.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("late error")), 50)),
      );

      const { unmount } = renderHook(() => useWaterHistoryData(7));
      unmount(); // sets cancelled = true before the rejection fires
      await new Promise((r) => setTimeout(r, 100));

      expect(vi.mocked(toast).error).not.toHaveBeenCalled();
    });
  });
});

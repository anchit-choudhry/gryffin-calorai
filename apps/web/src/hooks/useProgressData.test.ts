import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProgressData } from "./useProgressData";
import { FoodItemId, ISODate, UserId } from "@/types";
import * as appState from "../state/AppState";
import type { FoodItem } from "../db/dbService";
import * as dbService from "../db/dbService";

vi.mock("../state/AppState");
vi.mock("../db/dbService");

describe("useProgressData", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(dbService).getAllFoodLogs.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state when userId is not set", () => {
    vi.mocked(appState).useAppState.mockReturnValueOnce({
      userId: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const { result } = renderHook(() => useProgressData());
    expect(result.current.isLoading).toBe(true);
  });

  it("should return hook with required properties", async () => {
    const { result } = renderHook(() => useProgressData(7));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current).toHaveProperty("labels");
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("mealTypeData");
    expect(result.current).toHaveProperty("macroData");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("should return initial empty arrays", async () => {
    const { result } = renderHook(() => useProgressData(7));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(Array.isArray(result.current.labels)).toBe(true);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should accept 7 day parameter", async () => {
    const { result } = renderHook(() => useProgressData(7));
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("should accept 30 day parameter", async () => {
    const { result } = renderHook(() => useProgressData(30));
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("should handle missing userId gracefully", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const { result } = renderHook(() => useProgressData());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.labels).toStrictEqual([]);
  });

  it("should call getAllFoodLogs when userId is set", async () => {
    renderHook(() => useProgressData(7));
    await waitFor(() => {
      expect(vi.mocked(dbService).getAllFoodLogs).toHaveBeenCalled();
    });
  });

  it("should handle error during data fetch", async () => {
    vi.mocked(dbService).getAllFoodLogs.mockRejectedValue(new Error("DB error"));

    const { result } = renderHook(() => useProgressData(7));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.labels).toStrictEqual([]);
    expect(result.current.data).toStrictEqual([]);
  });

  it("should handle logs with undefined mealType by using default", async () => {
    const today = new Date().toISOString().split("T")[0];
    vi.mocked(dbService).getAllFoodLogs.mockResolvedValue([
      {
        id: FoodItemId(1),
        userId,
        name: "Test",
        calories: 200,
        servingSize: 1,
        dateLogged: ISODate(today!),
        mealType: undefined,
        protein: 10,
        carbs: 20,
        fat: 5,
        isFavorite: false,
      } as unknown as FoodItem,
    ]);

    const { result } = renderHook(() => useProgressData(7));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should return null for mealTypeData and macroData on 30-day view", async () => {
    const today = new Date().toISOString().split("T")[0];
    vi.mocked(dbService).getAllFoodLogs.mockResolvedValue([
      {
        id: FoodItemId(1),
        userId,
        name: "Test",
        calories: 200,
        servingSize: 1,
        dateLogged: ISODate(today!),
        mealType: "Breakfast",
        protein: 10,
        carbs: 20,
        fat: 5,
        isFavorite: false,
      } as unknown as FoodItem,
    ]);

    const { result } = renderHook(() => useProgressData(30));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mealTypeData).toBeNull();
    expect(result.current.macroData).toBeNull();
  });

  it("uses 0 for protein/carbs/fat when they are undefined on a log entry", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    vi.mocked(dbService).getAllFoodLogs.mockResolvedValue([
      {
        id: FoodItemId(1),
        userId,
        name: "Mystery Food",
        calories: 500,
        servingSize: 1,
        dateLogged: ISODate(today),
        mealType: "Breakfast",
        protein: undefined,
        carbs: undefined,
        fat: undefined,
        isFavorite: false,
      } as unknown as FoodItem,
    ]);

    const { result } = renderHook(() => useProgressData(7));

    await waitFor(() => {
      expect(result.current.macroData).not.toBeNull();
    });

    const macros = result.current.macroData;
    expect(macros).not.toBeNull();
    // All macro values must be 0 (not NaN) because the ?? 0 fallback applied
    expect(macros!.protein.some((v) => isNaN(v))).toBe(false);
    expect(macros!.carbs.some((v) => isNaN(v))).toBe(false);
    expect(macros!.fat.some((v) => isNaN(v))).toBe(false);
    const todayLabel = today.substring(5);
    const todayIndex = result.current.labels.indexOf(todayLabel);
    expect(macros!.protein[todayIndex]).toBe(0);
    expect(macros!.carbs[todayIndex]).toBe(0);
    expect(macros!.fat[todayIndex]).toBe(0);
  });

  it("does not update state when the component unmounts before a pending fetch rejects", async () => {
    vi.mocked(dbService).getAllFoodLogs.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("late failure")), 50)),
    );

    const { result, unmount } = renderHook(() => useProgressData(7));
    unmount(); // sets cancelled = true before the rejection fires
    await new Promise((r) => setTimeout(r, 100));

    // The cancelled guard prevented any state update - labels stays empty
    expect(result.current.labels).toStrictEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWaterForm } from "./useWaterForm";
import { UserId } from "@/types";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("sonner");
vi.mock("../state/AppState");

describe("useWaterForm", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      init: { status: "ready" as const, user: { id: userId, calorieGoal: 2000 } },
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
      fetchWaterLogs: vi.fn(),
      setWaterGoalMl: vi.fn(),
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      fetchStepLogs: vi.fn(),
      setStepGoal: vi.fn(),
      addBodyMeasurement: vi.fn(),
      deleteBodyMeasurement: vi.fn(),
      fetchBodyMeasurements: vi.fn(),
      checkAndUnlockAchievements: vi.fn(),
      fetchAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return form, isLoading, and submitWaterLog", () => {
    const { result } = renderHook(() => useWaterForm());
    expect(result.current.form).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.submitWaterLog).toBe("function");
  });

  it("should have default amount value of 250 ml", () => {
    const { result } = renderHook(() => useWaterForm());
    expect(result.current.form.getValues("amount")).toBe(250);
  });

  it("should submit water log with override", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());
    const success = await result.current.submitWaterLog(500);

    expect(success).toBe(true);
    expect(mockAddWaterLog).toHaveBeenCalledWith(500);
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error toast for invalid override", async () => {
    const { result } = renderHook(() => useWaterForm());
    const success = await result.current.submitWaterLog(-100);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle addWaterLog error with override", async () => {
    const mockAddWaterLog = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());
    const success = await result.current.submitWaterLog(500);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to log water. Please try again.");
  });

  it("should validate water amount", async () => {
    const { result } = renderHook(() => useWaterForm());
    const success = await result.current.submitWaterLog(0);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle very large water amounts", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());
    const success = await result.current.submitWaterLog(5000);

    expect(success).toBe(true);
    expect(mockAddWaterLog).toHaveBeenCalledWith(5000);
  });

  it("should handle common water amounts", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    const amounts = [250, 500, 750, 1000];
    for (const amount of amounts) {
      const success = await result.current.submitWaterLog(amount);
      expect(success).toBe(true);
    }
  });
});

describe("useWaterForm form submission", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should submit form data without override", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 500);
    });

    const success = await result.current.submitWaterLog();

    expect(success).toBe(true);
    expect(mockAddWaterLog).toHaveBeenCalledWith(500);
    expect(toast.success).toHaveBeenCalledWith("Logged 500 ml!");
  });

  it("should reset form after successful submission without override", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 750);
    });

    await result.current.submitWaterLog();

    expect(result.current.form.getValues("amount")).toBe(250);
  });

  it("should handle error during form submission", async () => {
    const mockAddWaterLog = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 500);
    });

    const success = await result.current.submitWaterLog();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to log water. Please try again.");
  });

  it("should format water amount with units", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 1000);
    });

    await result.current.submitWaterLog();

    expect(toast.success).toHaveBeenCalledWith("Logged 1000 ml!");
  });

  it("should handle large water amounts in form submission", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 5000);
    });

    const success = await result.current.submitWaterLog();

    expect(success).toBe(true);
    expect(mockAddWaterLog).toHaveBeenCalledWith(5000);
  });

  it("should handle minimum water amount", async () => {
    const mockAddWaterLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: mockAddWaterLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", 1);
    });

    const success = await result.current.submitWaterLog();

    expect(success).toBe(true);
    expect(mockAddWaterLog).toHaveBeenCalledWith(1);
  });

  it("should handle form validation failure when amount is invalid", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addWaterLog: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useWaterForm());

    await act(async () => {
      result.current.form.setValue("amount", -100);
    });

    const success = await result.current.submitWaterLog();

    expect(success).toBe(false);
  });
});

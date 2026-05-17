import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStepForm } from "./useStepForm";
import { StepSchema } from "../forms/schemas";
import { UserId } from "@/types";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("sonner");
vi.mock("../state/AppState");

describe("useStepForm", () => {
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

  it("should return form, isLoading, and submitStepLog", () => {
    const { result } = renderHook(() => useStepForm());
    expect(result.current.form).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.submitStepLog).toBe("function");
  });

  it("should have default step value of 1000", () => {
    const { result } = renderHook(() => useStepForm());
    expect(result.current.form.getValues("steps")).toBe(1000);
  });

  it("should submit step log with override", async () => {
    const mockAddStepLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());
    const success = await result.current.submitStepLog(5000);

    expect(success).toBe(true);
    expect(mockAddStepLog).toHaveBeenCalledWith(5000);
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error toast for invalid override", async () => {
    const { result } = renderHook(() => useStepForm());
    const success = await result.current.submitStepLog(-100);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle addStepLog error with override", async () => {
    const mockAddStepLog = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());
    const success = await result.current.submitStepLog(5000);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to log steps. Please try again.");
  });

  it("should validate step value", async () => {
    const { result } = renderHook(() => useStepForm());
    const success = await result.current.submitStepLog(0);

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle very large step values", async () => {
    const mockAddStepLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...vi.mocked(appState).useAppState(),
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());
    const success = await result.current.submitStepLog(100000);

    expect(success).toBe(true);
    expect(mockAddStepLog).toHaveBeenCalledWith(100000);
  });
});

describe("StepSchema validation", () => {
  it("accepts minimum valid step count (1)", () => {
    expect(StepSchema.safeParse({ steps: 1 }).success).toBe(true);
  });

  it("accepts maximum valid step count (100,000)", () => {
    expect(StepSchema.safeParse({ steps: 100000 }).success).toBe(true);
  });

  it("accepts common step counts", () => {
    expect(StepSchema.safeParse({ steps: 2000 }).success).toBe(true);
    expect(StepSchema.safeParse({ steps: 5000 }).success).toBe(true);
    expect(StepSchema.safeParse({ steps: 10000 }).success).toBe(true);
  });

  it("rejects zero steps", () => {
    const result = StepSchema.safeParse({ steps: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Must be at least 1 step");
    }
  });

  it("rejects negative steps", () => {
    const result = StepSchema.safeParse({ steps: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Must be at least 1 step");
    }
  });

  it("rejects steps exceeding 100,000", () => {
    const result = StepSchema.safeParse({ steps: 100001 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Cannot exceed 100,000 steps");
    }
  });

  it("rejects fractional steps", () => {
    const result = StepSchema.safeParse({ steps: 1500.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Steps must be a whole number");
    }
  });

  it("rejects string input", () => {
    const result = StepSchema.safeParse({ steps: "five hundred" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Steps must be a number");
    }
  });

  it("rejects missing steps field", () => {
    expect(StepSchema.safeParse({}).success).toBe(false);
  });

  it("rejects null", () => {
    expect(StepSchema.safeParse({ steps: null }).success).toBe(false);
  });
});

describe("useStepForm form submission", () => {
  const userId = UserId("test-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should submit form data without override", async () => {
    const mockAddStepLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", 5000);
    });

    const success = await result.current.submitStepLog();

    expect(success).toBe(true);
    expect(mockAddStepLog).toHaveBeenCalledWith(5000);
    expect(toast.success).toHaveBeenCalledWith("Logged 5,000 steps!");
  });

  it("should reset form after successful submission without override", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", 7500);
    });

    await result.current.submitStepLog();

    expect(result.current.form.getValues("steps")).toBe(1000);
  });

  it("should handle error during form submission", async () => {
    const mockAddStepLog = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", 5000);
    });

    const success = await result.current.submitStepLog();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to log steps. Please try again.");
  });

  it("should format step count with locale string", async () => {
    const mockAddStepLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", 1000);
    });

    await result.current.submitStepLog();

    expect(toast.success).toHaveBeenCalledWith("Logged 1,000 steps!");
  });

  it("should handle successfully submitting form data", async () => {
    const mockAddStepLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: mockAddStepLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", 5000);
    });

    const success = await result.current.submitStepLog();

    expect(success).toBe(true);
    expect(mockAddStepLog).toHaveBeenCalledWith(5000);
  });

  it("should handle form validation failure when steps is invalid", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addStepLog: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useStepForm());

    await act(async () => {
      result.current.form.setValue("steps", -100);
    });

    const success = await result.current.submitStepLog();

    expect(success).toBe(false);
  });
});

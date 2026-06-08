import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBodyForm } from "./useBodyForm";
import { UserId } from "@/types";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("sonner");
vi.mock("../state/AppState");

describe("useBodyForm", () => {
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
      addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
      deleteBodyMeasurement: vi.fn(),
      fetchBodyMeasurements: vi.fn(),
      checkAndUnlockAchievements: vi.fn(),
      fetchAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return form and unit controls", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.form).toBeDefined();
    expect(result.current.weightUnit).toBe("kg");
    expect(result.current.lengthUnit).toBe("cm");
    expect(typeof result.current.setWeightUnit).toBe("function");
    expect(typeof result.current.setLengthUnit).toBe("function");
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.submitMeasurement).toBe("function");
  });

  it("should have default unit values", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.weightUnit).toBe("kg");
    expect(result.current.lengthUnit).toBe("cm");
  });

  it("should have setWeightUnit function", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(typeof result.current.setWeightUnit).toBe("function");
  });

  it("should have setLengthUnit function", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(typeof result.current.setLengthUnit).toBe("function");
  });

  it("should have empty default form values", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.form.getValues("weight")).toBe("");
    expect(result.current.form.getValues("bodyFat")).toBe("");
  });

  it("should handle submit when user not initialized", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      userId: null,
      addBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useBodyForm());
    const success = await result.current.submitMeasurement();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Not ready - please refresh");
  });

  it("should have setWeightUnit function that accepts kg", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(() => {
      act(() => {
        result.current.setWeightUnit("kg");
      });
    }).not.toThrow();
  });

  it("should have setWeightUnit function that accepts lb", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(() => {
      act(() => {
        result.current.setWeightUnit("lb");
      });
    }).not.toThrow();
  });

  it("should have setLengthUnit function that accepts cm", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(() => {
      act(() => {
        result.current.setLengthUnit("cm");
      });
    }).not.toThrow();
  });

  it("should have setLengthUnit function that accepts in", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(() => {
      act(() => {
        result.current.setLengthUnit("in");
      });
    }).not.toThrow();
  });

  it("should have form with required properties", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.form.handleSubmit).toBeDefined();
    expect(result.current.form.getValues).toBeDefined();
    expect(result.current.form.reset).toBeDefined();
    expect(result.current.form.clearErrors).toBeDefined();
    expect(result.current.form.control).toBeDefined();
  });

  it("should have all expected form fields", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.form.getValues("weight")).toBe("");
    expect(result.current.form.getValues("bodyFat")).toBe("");
    expect(result.current.form.getValues("waist")).toBe("");
    expect(result.current.form.getValues("chest")).toBe("");
    expect(result.current.form.getValues("hips")).toBe("");
  });

  it("should initialize with correct form mode", () => {
    const { result } = renderHook(() => useBodyForm());
    expect(result.current.form.formState).toBeDefined();
  });

  describe("submitMeasurement", () => {
    it("should successfully submit a measurement with all fields", async () => {
      const addMeasurementMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.form.setValue("weight", "75");
        result.current.form.setValue("bodyFat", "20");
        result.current.form.setValue("waist", "85");
        result.current.form.setValue("chest", "95");
        result.current.form.setValue("hips", "90");
      });

      const success = await result.current.submitMeasurement();

      expect(success).toBe(true);
      expect(addMeasurementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          weight: 75,
          bodyFat: 20,
          waist: 85,
          chest: 95,
          hips: 90,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Measurement saved!");
    });

    it("should submit with only required field (weight)", async () => {
      const addMeasurementMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.form.setValue("weight", "75");
      });

      const success = await result.current.submitMeasurement();

      expect(success).toBe(true);
      expect(addMeasurementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          weight: 75,
          bodyFat: undefined,
          waist: undefined,
          chest: undefined,
          hips: undefined,
        }),
      );
    });

    it("should convert weight from lb to kg", async () => {
      const addMeasurementMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.setWeightUnit("lb");
        result.current.form.setValue("weight", "165");
      });

      const success = await result.current.submitMeasurement();

      expect(success).toBe(true);
      expect(addMeasurementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          weight: expect.any(Number),
        }),
      );
      const callArgs = addMeasurementMock.mock.calls[0]![0];
      expect(callArgs.weight).toBeLessThan(165); // Should be ~74.8 kg
      expect(callArgs.weight).toBeGreaterThan(70);
    });

    it("should convert length from inches to cm", async () => {
      const addMeasurementMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.setLengthUnit("in");
        result.current.form.setValue("weight", "75");
        result.current.form.setValue("waist", "33.5");
      });

      const success = await result.current.submitMeasurement();

      expect(success).toBe(true);
      const callArgs = addMeasurementMock.mock.calls[0]![0];
      expect(callArgs.waist).toBeCloseTo(85.09, 1); // 33.5 inches ≈ 85.09 cm
    });

    it("should handle submission failure", async () => {
      const addMeasurementMock = vi.fn().mockRejectedValue(new Error("DB error"));
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.form.setValue("weight", "75");
      });

      const success = await result.current.submitMeasurement();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("Failed to save measurement.");
    });

    it("should reset form after successful submission", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.form.setValue("weight", "75");
        result.current.form.setValue("bodyFat", "20");
      });

      await result.current.submitMeasurement();

      expect(result.current.form.getValues("weight")).toBe("");
      expect(result.current.form.getValues("bodyFat")).toBe("");
    });

    it("should handle unit switching and error clearing", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      expect(result.current.weightUnit).toBe("kg");

      await act(async () => {
        result.current.setWeightUnit("lb");
      });

      expect(result.current.weightUnit).toBe("lb");

      await act(async () => {
        result.current.setLengthUnit("in");
      });

      expect(result.current.lengthUnit).toBe("in");
    });

    it("should round weight to 2 decimal places", async () => {
      const addMeasurementMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: addMeasurementMock,
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      await act(async () => {
        result.current.setWeightUnit("lb");
        result.current.form.setValue("weight", "165.789");
      });

      await result.current.submitMeasurement();

      const callArgs = addMeasurementMock.mock.calls[0]![0];
      expect(String(callArgs.weight).split(".")[1]?.length).toBeLessThanOrEqual(2);
    });

    it("should handle validation failure when required field is missing", async () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        userId,
        addBodyMeasurement: vi.fn(),
      } as unknown as ReturnType<typeof appState.useAppState>);

      const { result } = renderHook(() => useBodyForm());

      const success = await result.current.submitMeasurement();

      expect(success).toBe(false);
    });
  });
});

describe("useBodyForm edit mode", () => {
  const userId = UserId("edit-user");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should pre-fill form values when initialValues are provided", () => {
    const { BodyMeasurementId } = vi.mocked({} as typeof import("@/types")) as unknown as {
      BodyMeasurementId: (n: number) => ReturnType<typeof import("@/types").BodyMeasurementId>;
    };
    void BodyMeasurementId;

    const { result } = renderHook(() =>
      useBodyForm({
        measurementId: 42 as unknown as import("@/types").BodyMeasurementId,
        initialValues: { weight: "75", bodyFat: "20" },
      }),
    );

    expect(result.current.form.getValues("weight")).toBe("75");
    expect(result.current.form.getValues("bodyFat")).toBe("20");
  });

  it("should call updateBodyMeasurement on submit when measurementId is provided", async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addBodyMeasurement: vi.fn(),
      updateBodyMeasurement: updateMock,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() =>
      useBodyForm({
        measurementId: 42 as unknown as import("@/types").BodyMeasurementId,
        initialValues: { weight: "75" },
      }),
    );

    const success = await result.current.submitMeasurement();

    expect(success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(42, expect.objectContaining({ weight: 75 }));
    expect(toast.success).toHaveBeenCalledWith("Measurement updated!");
  });

  it("should call addBodyMeasurement when no measurementId is provided", async () => {
    const addMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addBodyMeasurement: addMock,
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useBodyForm());

    await act(async () => {
      result.current.form.setValue("weight", "70");
    });

    const success = await result.current.submitMeasurement();

    expect(success).toBe(true);
    expect(addMock).toHaveBeenCalled();
  });

  it("should handle updateBodyMeasurement error", async () => {
    const updateMock = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.mocked(appState).useAppState.mockReturnValue({
      userId,
      addBodyMeasurement: vi.fn(),
      updateBodyMeasurement: updateMock,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() =>
      useBodyForm({
        measurementId: 42 as unknown as import("@/types").BodyMeasurementId,
        initialValues: { weight: "75" },
      }),
    );

    const success = await result.current.submitMeasurement();

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to save measurement.");
  });
});

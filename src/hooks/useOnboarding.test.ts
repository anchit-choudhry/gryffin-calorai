import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ONBOARDING_TOTAL_STEPS, useOnboarding } from "./useOnboarding";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");

const baseMock = {
  saveTdeeProfile: vi.fn(),
} as unknown as ReturnType<typeof appState.useAppState>;

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(baseMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts at step 0", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.step).toBe(0);
  });

  it("totalSteps equals ONBOARDING_TOTAL_STEPS", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.totalSteps).toBe(ONBOARDING_TOTAL_STEPS);
  });

  it("defaults to kg weight unit", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.weightUnit).toBe("kg");
  });

  it("defaults to cm length unit", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.lengthUnit).toBe("cm");
  });

  it("nextStep advances step by 1", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.nextStep());
    expect(result.current.step).toBe(1);
  });

  it("nextStep does not exceed totalSteps - 1", () => {
    const { result } = renderHook(() => useOnboarding());
    for (let i = 0; i < ONBOARDING_TOTAL_STEPS + 5; i++) {
      act(() => result.current.nextStep());
    }
    expect(result.current.step).toBe(ONBOARDING_TOTAL_STEPS - 1);
  });

  it("prevStep decrements step by 1", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.nextStep());
    act(() => result.current.prevStep());
    expect(result.current.step).toBe(0);
  });

  it("prevStep does not go below 0", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.prevStep());
    expect(result.current.step).toBe(0);
  });

  it("goToStep sets step directly", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.goToStep(2));
    expect(result.current.step).toBe(2);
  });

  it("goToStep clamps to valid range", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.goToStep(99));
    expect(result.current.step).toBe(ONBOARDING_TOTAL_STEPS - 1);
    act(() => result.current.goToStep(-1));
    expect(result.current.step).toBe(0);
  });

  it("setWeightUnit updates weightUnit", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.setWeightUnit("lb"));
    expect(result.current.weightUnit).toBe("lb");
  });

  it("setLengthUnit updates lengthUnit", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.setLengthUnit("in"));
    expect(result.current.lengthUnit).toBe("in");
  });

  it("submit calls saveTdeeProfile with kg values", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      saveTdeeProfile: mockSave,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.form.setValue("age", 30);
      result.current.form.setValue("sex", "male");
      result.current.form.setValue("heightDisplay", 175);
      result.current.form.setValue("weightDisplay", 70);
      result.current.form.setValue("activityLevel", "moderate");
      result.current.form.setValue("goal", "maintain");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 30,
        sex: "male",
        heightCm: 175,
        weightKg: 70,
        activityLevel: "moderate",
        goal: "maintain",
      }),
    );
  });

  it("submit converts lb to kg before saving", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      saveTdeeProfile: mockSave,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setWeightUnit("lb");
      result.current.form.setValue("age", 25);
      result.current.form.setValue("sex", "female");
      result.current.form.setValue("heightDisplay", 165);
      result.current.form.setValue("weightDisplay", 154); // ~70 kg
      result.current.form.setValue("activityLevel", "light");
      result.current.form.setValue("goal", "lose");
    });

    await act(async () => {
      await result.current.submit();
    });

    const arg = mockSave.mock.calls[0]![0];
    expect(arg.weightKg).toBeCloseTo(70, 0);
  });

  it("submit converts inches to cm before saving", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      saveTdeeProfile: mockSave,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setLengthUnit("in");
      result.current.form.setValue("age", 28);
      result.current.form.setValue("sex", "male");
      result.current.form.setValue("heightDisplay", 70); // ~177 cm
      result.current.form.setValue("weightDisplay", 75);
      result.current.form.setValue("activityLevel", "moderate");
      result.current.form.setValue("goal", "maintain");
    });

    await act(async () => {
      await result.current.submit();
    });

    const arg = mockSave.mock.calls[0]![0];
    expect(arg.heightCm).toBeCloseTo(177.8, 0);
  });

  it("submit calls onComplete callback", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      saveTdeeProfile: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const onComplete = vi.fn();
    const { result } = renderHook(() => useOnboarding(onComplete));

    act(() => {
      result.current.form.setValue("age", 30);
      result.current.form.setValue("sex", "male");
      result.current.form.setValue("heightDisplay", 175);
      result.current.form.setValue("weightDisplay", 70);
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it("isLoading is false by default", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isLoading).toBe(false);
  });
});

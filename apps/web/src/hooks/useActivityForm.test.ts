import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useActivityForm } from "./useActivityForm";
import { ActivitySchema } from "../forms/schemas";
import { UserId } from "@/types";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("sonner");
vi.mock("../state/AppState");

const baseMock = {
  userId: UserId("test-user"),
  addActivityLog: vi.fn(),
  tdeeProfile: null,
};

describe("useActivityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns form, isLoading, submitActivityLog, weightKg, hasProfile", () => {
    const { result } = renderHook(() => useActivityForm());
    expect(result.current.form).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.submitActivityLog).toBe("function");
    expect(result.current.weightKg).toBe(70);
    expect(result.current.hasProfile).toBe(false);
  });

  it("uses weightKg from tdeeProfile when present", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      tdeeProfile: { weightKg: 85 },
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useActivityForm());
    expect(result.current.weightKg).toBe(85);
    expect(result.current.hasProfile).toBe(true);
  });

  it("defaults to 70 kg when no tdeeProfile", () => {
    const { result } = renderHook(() => useActivityForm());
    expect(result.current.weightKg).toBe(70);
  });

  it("submits activity log on valid form values", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addActivityLog: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useActivityForm());

    await act(async () => {
      result.current.form.setValue("activityType", "Running (6 mph)");
      result.current.form.setValue("durationMin", 30);
    });

    await act(async () => {
      await result.current.submitActivityLog();
    });

    expect(mockAdd).toHaveBeenCalled();
    const callArg = mockAdd.mock.calls[0]![0];
    expect(callArg.activityType).toBe("Running (6 mph)");
    expect(callArg.durationMin).toBe(30);
    expect(callArg.caloriesBurned).toBeGreaterThan(0);
    expect(toast.success).toHaveBeenCalled();
  });

  it("does not submit when activityType is empty", async () => {
    const mockAdd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addActivityLog: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useActivityForm());

    await act(async () => {
      result.current.form.setValue("durationMin", 30);
    });

    await act(async () => {
      await result.current.submitActivityLog();
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("shows error toast when addActivityLog throws", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addActivityLog: vi.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useActivityForm());

    await act(async () => {
      result.current.form.setValue("activityType", "Running (6 mph)");
      result.current.form.setValue("durationMin", 30);
    });

    await act(async () => {
      await result.current.submitActivityLog();
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to log activity");
  });

  it("resets form after successful submit", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addActivityLog: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useActivityForm());

    await act(async () => {
      result.current.form.setValue("activityType", "Running (6 mph)");
      result.current.form.setValue("durationMin", 30);
    });

    await act(async () => {
      await result.current.submitActivityLog();
    });

    expect(result.current.form.getValues("activityType")).toBe("");
  });
});

describe("ActivitySchema", () => {
  it("accepts valid activity", () => {
    expect(
      ActivitySchema.safeParse({ activityType: "Running (6 mph)", durationMin: 30 }).success,
    ).toBe(true);
  });

  it("rejects empty activityType", () => {
    expect(ActivitySchema.safeParse({ activityType: "", durationMin: 30 }).success).toBe(false);
  });

  it("rejects zero duration", () => {
    expect(
      ActivitySchema.safeParse({ activityType: "Running (6 mph)", durationMin: 0 }).success,
    ).toBe(false);
  });

  it("rejects duration above 1440", () => {
    expect(
      ActivitySchema.safeParse({ activityType: "Running (6 mph)", durationMin: 1441 }).success,
    ).toBe(false);
  });

  it("accepts max duration of 1440", () => {
    expect(
      ActivitySchema.safeParse({ activityType: "Walking (slow, 2 mph)", durationMin: 1440 })
        .success,
    ).toBe(true);
  });

  it("rejects fractional duration", () => {
    expect(
      ActivitySchema.safeParse({ activityType: "Running (6 mph)", durationMin: 30.5 }).success,
    ).toBe(false);
  });
});

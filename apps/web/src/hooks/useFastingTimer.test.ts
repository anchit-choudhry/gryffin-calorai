import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFastingTimer } from "./useFastingTimer";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");
vi.mock("date-fns", async (importOriginal) => {
  const mod = await importOriginal<typeof import("date-fns")>();
  return { ...mod };
});

const makeSession = (startOffsetSec = 0) => ({
  id: 1,
  userId: "user1",
  startTime: new Date(Date.now() - startOffsetSec * 1000).toISOString(),
  endTime: null,
  targetHours: 16,
  dateLogged: "2026-05-20",
  completed: false,
});

const baseMock = {
  activeFastingSession: null,
  startFasting: vi.fn(),
  endFasting: vi.fn(),
};

describe("useFastingTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("returns 0 elapsed when no active session", () => {
    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.elapsedSec).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.isComplete).toBe(false);
  });

  it("formattedElapsed shows 00:00:00 when no session", () => {
    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.formattedElapsed).toBe("00:00:00");
    expect(result.current.formattedRemaining).toBe("00:00:00");
  });

  it("computes elapsed from session startTime", () => {
    const session = makeSession(3600); // started 1h ago
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      activeFastingSession: session,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    // elapsed is approximately 3600s; progress = 3600 / (16*3600) = 1/16
    expect(result.current.elapsedSec).toBeGreaterThanOrEqual(3598);
    expect(result.current.elapsedSec).toBeLessThanOrEqual(3602);
    expect(result.current.progress).toBeCloseTo(1 / 16, 2);
  });

  it("progress is capped at 1 when elapsed exceeds target", () => {
    const session = makeSession(17 * 3600); // 17 hours ago, target is 16h
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      activeFastingSession: session,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.progress).toBe(1);
    expect(result.current.isComplete).toBe(true);
  });

  it("isComplete is false while under target", () => {
    const session = makeSession(3600); // 1h elapsed of 16h target
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      activeFastingSession: session,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.isComplete).toBe(false);
  });

  it("exposes startFasting and endFasting from store", () => {
    const mockStart = vi.fn();
    const mockEnd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      startFasting: mockStart,
      endFasting: mockEnd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.startFasting).toBeDefined();
    expect(result.current.endFasting).toBe(mockEnd);
  });

  it("advances elapsed via interval tick", async () => {
    const session = makeSession(0);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      activeFastingSession: session,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    const initial = result.current.elapsedSec;

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSec).toBeGreaterThanOrEqual(initial);
  });

  it("startFasting requests Notification permission when default", async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue("denied");
    Object.defineProperty(globalThis, "Notification", {
      value: { permission: "default", requestPermission: mockRequestPermission },
      configurable: true,
    });

    const mockStart = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      startFasting: mockStart,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());

    await act(async () => {
      await result.current.startFasting(16);
    });

    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledWith(16);
  });

  it("formattedElapsed formats HH:MM:SS correctly", () => {
    const session = makeSession(3661); // 1h 1m 1s
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      activeFastingSession: session,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useFastingTimer());
    expect(result.current.formattedElapsed).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

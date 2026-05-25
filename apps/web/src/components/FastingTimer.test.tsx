import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import FastingTimer from "./FastingTimer";
import * as appState from "../state/AppState";
import * as fastingTimerHook from "../hooks/useFastingTimer";
import { FastingSessionId, ISODate, UserId } from "@/types";
import { toast } from "sonner";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../hooks/useFastingTimer");
vi.mock("motion/react", () => ({
  useReducedMotion: () => false,
}));

const baseTimerMock = {
  elapsedSec: 0,
  targetSec: 0,
  progress: 0,
  isComplete: false,
  formattedElapsed: "00:00:00",
  formattedRemaining: "--:--:--",
  startFasting: vi.fn(),
  endFasting: vi.fn(),
};

const activeSession = {
  id: FastingSessionId(1),
  userId: UserId("test"),
  startTime: new Date().toISOString(),
  endTime: null,
  targetHours: 16,
  dateLogged: ISODate("2026-05-20"),
  completed: false,
};

describe("FastingTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue(baseTimerMock);
    vi.mocked(appState).useAppState.mockReturnValue({
      activeFastingSession: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders preset buttons when no active session", () => {
    render(<FastingTimer />);
    expect(screen.getByText("Select a protocol to start")).toBeTruthy();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("renders all fasting presets", () => {
    render(<FastingTimer />);
    expect(screen.getByText("16:8")).toBeTruthy();
  });

  it("calls startFasting and toast.success when preset clicked", async () => {
    const mockStart = vi.fn().mockResolvedValue(undefined);
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      ...baseTimerMock,
      startFasting: mockStart,
    });

    render(<FastingTimer />);
    const buttons = screen.getAllByRole("button");
    await act(async () => {
      fireEvent.click(buttons[0]!);
    });

    expect(mockStart).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("renders active fasting ring when session is active", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      activeFastingSession: activeSession,
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      ...baseTimerMock,
      elapsedSec: 3600,
      targetSec: 57600,
      progress: 0.0625,
      formattedElapsed: "01:00:00",
      formattedRemaining: "15:00:00",
    });

    render(<FastingTimer />);
    expect(screen.getByText("16h fast")).toBeTruthy();
    expect(screen.getByText("End fast")).toBeTruthy();
  });

  it("shows elapsed time during active session", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      activeFastingSession: activeSession,
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      ...baseTimerMock,
      elapsedSec: 7200,
      targetSec: 57600,
      progress: 0.125,
      formattedElapsed: "02:00:00",
      formattedRemaining: "14:00:00",
    });

    render(<FastingTimer />);
    expect(screen.getByText("02:00:00")).toBeTruthy();
  });

  it("shows Done! and Confirm complete button when fast is complete", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      activeFastingSession: activeSession,
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      ...baseTimerMock,
      elapsedSec: 57600,
      targetSec: 57600,
      progress: 1,
      isComplete: true,
      formattedElapsed: "16:00:00",
      formattedRemaining: "00:00:00",
    });

    render(<FastingTimer />);
    expect(screen.getByText("Done!")).toBeTruthy();
    expect(screen.getByText("Confirm complete")).toBeTruthy();
  });

  it("calls endFasting when End fast button is clicked", async () => {
    const mockEnd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      activeFastingSession: activeSession,
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      ...baseTimerMock,
      endFasting: mockEnd,
    });

    render(<FastingTimer />);
    const endButton = screen.getByText("End fast");
    await act(async () => {
      fireEvent.click(endButton);
    });

    expect(mockEnd).toHaveBeenCalledWith(false);
    expect(toast).toHaveBeenCalled();
  });

  it("shows persist note when no active session and no target", () => {
    render(<FastingTimer />);
    expect(screen.getByText(/Timer persists/)).toBeTruthy();
  });
});

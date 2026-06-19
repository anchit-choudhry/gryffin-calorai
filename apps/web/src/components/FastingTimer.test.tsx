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

  describe("E3 moon disk", () => {
    it("renders moon disk SVG circle when session is active", () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        activeFastingSession: activeSession,
      } as unknown as ReturnType<typeof appState.useAppState>);
      vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
        ...baseTimerMock,
        progress: 0.5,
      });

      const { container } = render(<FastingTimer />);
      expect(container.querySelector("[data-moon-disk]")).toBeTruthy();
    });

    it("time display renders below moon disk (not inside it)", () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        activeFastingSession: activeSession,
      } as unknown as ReturnType<typeof appState.useAppState>);
      vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
        ...baseTimerMock,
        elapsedSec: 7200,
        progress: 0.125,
        formattedElapsed: "02:00:00",
      });

      const { container } = render(<FastingTimer />);
      const disk = container.querySelector("[data-moon-disk]");
      const timeEl = screen.getByText("02:00:00");
      expect(disk).toBeTruthy();
      // time element must not be a descendant of the disk SVG
      expect(disk!.contains(timeEl)).toBe(false);
    });

    it("progress 0 renders clip ellipse with rx near 0", () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        activeFastingSession: activeSession,
      } as unknown as ReturnType<typeof appState.useAppState>);
      vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
        ...baseTimerMock,
        progress: 0,
      });

      const { container } = render(<FastingTimer />);
      const ellipse = container.querySelector("[data-moon-clip-ellipse]");
      expect(ellipse).toBeTruthy();
      const rx = parseFloat(ellipse!.getAttribute("rx") ?? "999");
      expect(rx).toBeLessThan(5);
    });

    it("progress 1 renders clip ellipse with rx equal to radius (full moon)", () => {
      vi.mocked(appState).useAppState.mockReturnValue({
        activeFastingSession: activeSession,
      } as unknown as ReturnType<typeof appState.useAppState>);
      vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
        ...baseTimerMock,
        progress: 1,
        isComplete: true,
      });

      const { container } = render(<FastingTimer />);
      const ellipse = container.querySelector("[data-moon-clip-ellipse]");
      const disk = container.querySelector("[data-moon-disk]");
      expect(ellipse).toBeTruthy();
      expect(disk).toBeTruthy();
      // rx should equal the SVG radius (40)
      const rx = parseFloat(ellipse!.getAttribute("rx") ?? "0");
      expect(rx).toBeCloseTo(40, 0);
    });
  });
});

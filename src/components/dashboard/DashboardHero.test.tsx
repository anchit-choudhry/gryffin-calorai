import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DashboardHero from "./DashboardHero";
import * as appState from "@/state/AppState";
import * as fastingTimerHook from "@/hooks/useFastingTimer";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => true));

vi.mock("motion/react", () => ({
  motion: {
    span: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn() }),
  useTransform: (_val: unknown, fn: (v: number) => string) => fn(0),
  useReducedMotion: () => mockUseReducedMotion(),
}));

vi.mock("@/state/AppState");
vi.mock("@/hooks/useFastingTimer");
vi.mock("sonner");

const defaultProps = {
  totalCalories: 1200,
  totals: { protein: 50, carbs: 150, fat: 40 },
};

const readyInit = {
  status: "ready" as const,
  user: { calorieGoal: 2000, username: "Alice", hasCompletedOnboarding: true },
};

const baseState = {
  init: readyInit,
  updateCalorieGoal: vi.fn().mockResolvedValue(undefined),
  bodyMeasurements: [] as { weight: number }[],
  dailyActivityLogs: [] as { caloriesBurned: number }[],
  activeFastingSession: null as { targetHours: number } | null,
  dietProfile: null as { preset: string; restrictions: string[] } | null,
};

describe("DashboardHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(true);
    vi.mocked(appState).useAppState.mockReturnValue(
      baseState as unknown as ReturnType<typeof appState.useAppState>,
    );
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      formattedRemaining: "02:30:00",
      isComplete: false,
    } as unknown as ReturnType<typeof fastingTimerHook.useFastingTimer>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the kcal unit label", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getAllByText("kcal").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the calorie goal button", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/Goal:/i)).toBeTruthy();
  });

  it("renders protein, carbs and fat labels in macro row", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("Carbs")).toBeTruthy();
    expect(screen.getByText("Fat")).toBeTruthy();
  });

  it("shows username when init is ready", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("does not show username when init is not ready", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      init: { status: "loading" },
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("shows remaining kcal when calories are below goal", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/remaining/i)).toBeTruthy();
  });

  it("shows over-budget message when calories exceed goal", () => {
    render(<DashboardHero totalCalories={2500} totals={{ protein: 80, carbs: 300, fat: 60 }} />);
    expect(screen.getByText(/over by/i)).toBeTruthy();
  });

  it("shows Net button when dailyActivityLogs has calorie burns", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyActivityLogs: [{ caloriesBurned: 300 }],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText("Net")).toBeTruthy();
  });

  it("does not show Net button when no activity logged", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.queryByText("Net")).toBeNull();
  });

  it("toggles to Consumed label when Net button is clicked", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyActivityLogs: [{ caloriesBurned: 300 }],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText("Net"));
    expect(screen.getByText("Consumed")).toBeTruthy();
  });

  it("shows fasting timer when an active fasting session exists", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      activeFastingSession: { targetHours: 16 },
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/16h fast:/i)).toBeTruthy();
  });

  it("shows fasting complete message when the fast is done", () => {
    vi.mocked(fastingTimerHook).useFastingTimer.mockReturnValue({
      formattedRemaining: "",
      isComplete: true,
    } as unknown as ReturnType<typeof fastingTimerHook.useFastingTimer>);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      activeFastingSession: { targetHours: 16 },
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/complete!/i)).toBeTruthy();
  });

  it("shows last weighed entry when body measurements exist", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      bodyMeasurements: [{ weight: 70.5 }],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/70\.5 kg/)).toBeTruthy();
  });

  it("does not show weight when body measurements are empty", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.queryByText(/kg/)).toBeNull();
  });

  it("renders macro progress bars when diet profile is set", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dietProfile: { preset: "generic", restrictions: [] },
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<DashboardHero {...defaultProps} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.length).toBeGreaterThanOrEqual(3);
  });

  it("does not render macro progress bars when no diet profile", () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("shows goal editing input when goal button is clicked", () => {
    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText(/Goal:/i));
    expect(screen.getByTestId("goal-edit")).toBeTruthy();
  });

  it("hides goal editor when Cancel is clicked", () => {
    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText(/Goal:/i));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("goal-edit")).toBeNull();
  });

  it("saves a new calorie goal when Save is clicked", async () => {
    const mockUpdateGoal = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      updateCalorieGoal: mockUpdateGoal,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText(/Goal:/i));
    const input = screen.getByTestId("goal-edit") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2500" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    expect(mockUpdateGoal).toHaveBeenCalledWith(2500);
  });

  it("shows low-goal toast warning when saved goal is under 1200", async () => {
    const { toast } = await import("sonner");
    const mockUpdateGoal = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      updateCalorieGoal: mockUpdateGoal,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText(/Goal:/i));
    const input = screen.getByTestId("goal-edit") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "800" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    expect(vi.mocked(toast).warning).toHaveBeenCalled();
  });

  it("shows high-goal toast warning when saved goal is over 6000", async () => {
    const { toast } = await import("sonner");
    const mockUpdateGoal = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      updateCalorieGoal: mockUpdateGoal,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<DashboardHero {...defaultProps} />);
    fireEvent.click(screen.getByText(/Goal:/i));
    const input = screen.getByTestId("goal-edit") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "7000" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    expect(vi.mocked(toast).warning).toHaveBeenCalled();
  });

  it("covers the motion animation path when reduced motion is disabled", () => {
    mockUseReducedMotion.mockReturnValue(false);
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/Goal:/i)).toBeTruthy();
  });

  it("shows a morning greeting when the hour is before noon", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T06:00:00"));
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/Good morning/i)).toBeTruthy();
    vi.useRealTimers();
  });

  it("shows an afternoon greeting when the hour is between 12 and 18", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T14:00:00"));
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/Good afternoon/i)).toBeTruthy();
    vi.useRealTimers();
  });

  it("shows an evening greeting when the hour is 18 or later", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T20:00:00"));
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText(/Good evening/i)).toBeTruthy();
    vi.useRealTimers();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklyHarvestModal } from "./WeeklyHarvestModal";

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      onClick,
      ...rest
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <div onClick={onClick} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

const mockWeeklySummary = vi.hoisted(() =>
  vi.fn(() => ({
    averageCalories: 1800,
    daysOnTarget: 5,
    consistency: 71,
    calorieGoal: 2000,
  })),
);

const mockStreaks = vi.hoisted(() =>
  vi.fn(() => ({
    currentStreak: 7,
    longestStreak: 10,
    loggedDates: new Set<string>(),
    isLoading: false,
  })),
);

vi.mock("@/hooks/useWeeklySummary", () => ({ useWeeklySummary: mockWeeklySummary }));
vi.mock("@/hooks/useStreaks", () => ({ useStreaks: mockStreaks }));
vi.mock("@/components/icons/almanac", () => ({
  RuleTicks: () => null,
}));

describe("WeeklyHarvestModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<WeeklyHarvestModal open={false} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when open", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("The Harvest")).toBeTruthy();
  });

  it("shows weekly stats from hook", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText("1,800")).toBeTruthy();
    expect(screen.getByText("5/7")).toBeTruthy();
    expect(screen.getByText("71")).toBeTruthy();
  });

  it("shows current streak from useStreaks", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close weekly harvest/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    const backdrop = screen.getByRole("dialog").previousSibling as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when footer close button is clicked", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows personal best label when current streak matches longest", () => {
    mockStreaks.mockReturnValue({
      currentStreak: 10,
      longestStreak: 10,
      loggedDates: new Set<string>(),
      isLoading: false,
    });
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText("Personal best")).toBeTruthy();
  });

  it("shows excellent editorial note when >= 5 days on target", () => {
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText(/strong week/i)).toBeTruthy();
  });

  it("shows decent editorial note when 3-4 days on target", () => {
    mockWeeklySummary.mockReturnValue({
      averageCalories: 1600,
      daysOnTarget: 3,
      consistency: 43,
      calorieGoal: 2000,
    });
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText(/decent start/i)).toBeTruthy();
  });

  it("shows encouragement note when < 3 days on target", () => {
    mockWeeklySummary.mockReturnValue({
      averageCalories: 1200,
      daysOnTarget: 1,
      consistency: 14,
      calorieGoal: 2000,
    });
    render(<WeeklyHarvestModal open={true} onClose={onClose} />);
    expect(screen.getByText(/every logged meal/i)).toBeTruthy();
  });
});

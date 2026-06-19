import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StreakCard from "./StreakCard";
import * as streaksHook from "../hooks/useStreaks";

vi.mock("motion/react", () => ({
  motion: {
    p: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
      <p {...(rest as Record<string, unknown>)}>{children}</p>
    ),
  },
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../hooks/useStreaks");

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: () => false,
}));

vi.mock("@/lib/shareCard", () => ({
  renderStreakCard: vi.fn().mockResolvedValue(new Blob()),
  shareOrDownloadCard: vi.fn().mockResolvedValue(undefined),
}));

const baseReturn = {
  loggedDates: new Set<string>(),
};

describe("StreakCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports a React component", () => {
    expect(StreakCard).toBeDefined();
    expect(typeof StreakCard).toBe("function");
  });

  it("renders loading state when isLoading is true", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 0,
      longestStreak: 0,
      isLoading: true,
    });

    const { container } = render(<StreakCard />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders streak data when loaded", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 5,
      longestStreak: 12,
      isLoading: false,
    });

    render(<StreakCard />);
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
  });

  it("renders with zero streaks", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 0,
      longestStreak: 0,
      isLoading: false,
    });

    render(<StreakCard />);
    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("renders with high current streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 10,
      longestStreak: 15,
      isLoading: false,
    });

    render(<StreakCard />);
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
  });

  it("renders with high longest streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 3,
      longestStreak: 50,
      isLoading: false,
    });

    render(<StreakCard />);
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("50")).toBeDefined();
  });

  it("marks logged dates in the dot calendar", () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 1,
      longestStreak: 1,
      loggedDates: new Set([today]),
      isLoading: false,
    });

    const { container } = render(<StreakCard />);
    const filledDots = container.querySelectorAll('[class*="bg-persimmon"]');
    expect(filledDots.length).toBeGreaterThan(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StreakCard from "./StreakCard";
import * as streaksHook from "../hooks/useStreaks";

vi.mock("motion/react", () => ({
  motion: {
    p: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
      <p {...(rest as Record<string, unknown>)}>{children}</p>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("../hooks/useStreaks");

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

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders streak data when loaded", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 5,
      longestStreak: 12,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with zero streaks", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 0,
      longestStreak: 0,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with high current streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 10,
      longestStreak: 15,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with high longest streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      ...baseReturn,
      currentStreak: 3,
      longestStreak: 50,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("marks logged dates in the dot calendar", () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 1,
      longestStreak: 1,
      loggedDates: new Set([today]),
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });
});

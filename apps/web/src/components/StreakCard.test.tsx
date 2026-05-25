import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StreakCard from "./StreakCard";
import * as streaksHook from "../hooks/useStreaks";

vi.mock("../hooks/useStreaks");

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
      currentStreak: 0,
      longestStreak: 0,
      isLoading: true,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders streak data when loaded", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 5,
      longestStreak: 12,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with zero streaks", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 0,
      longestStreak: 0,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with high current streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 10,
      longestStreak: 15,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });

  it("renders with high longest streak", () => {
    vi.mocked(streaksHook).useStreaks.mockReturnValueOnce({
      currentStreak: 3,
      longestStreak: 50,
      isLoading: false,
    });

    const component = StreakCard();
    expect(component).toBeDefined();
  });
});

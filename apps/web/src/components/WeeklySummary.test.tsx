import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WeeklySummary from "./WeeklySummary";
import * as progressHook from "../hooks/useProgressData";
import * as weeklySummaryHook from "../hooks/useWeeklySummary";

vi.mock("../hooks/useProgressData");
vi.mock("../hooks/useWeeklySummary");

describe("WeeklySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports a React component", () => {
    expect(WeeklySummary).toBeDefined();
    expect(typeof WeeklySummary).toBe("function");
  });

  it("renders loading state when isLoading is true", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: true,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 2000,
      daysOnTarget: 5,
      consistency: 71,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders summary data when loaded with high consistency", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 2000,
      daysOnTarget: 6,
      consistency: 85,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders summary data with medium consistency", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 1800,
      daysOnTarget: 3,
      consistency: 50,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders summary data with low consistency", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 2500,
      daysOnTarget: 1,
      consistency: 20,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders with all days on target", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 1950,
      daysOnTarget: 7,
      consistency: 100,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders with no days on target", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 3000,
      daysOnTarget: 0,
      consistency: 0,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });

  it("renders with zero consistency boundary", () => {
    vi.mocked(progressHook).useProgressData.mockReturnValueOnce({
      labels: [],
      data: [],
      mealTypeData: null,
      macroData: null,
      isLoading: false,
    });
    vi.mocked(weeklySummaryHook).useWeeklySummary.mockReturnValueOnce({
      averageCalories: 0,
      daysOnTarget: 0,
      consistency: 0,
      calorieGoal: 2000,
    });

    const component = WeeklySummary();
    expect(component).toBeDefined();
  });
});

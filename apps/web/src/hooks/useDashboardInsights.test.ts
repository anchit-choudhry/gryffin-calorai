import { describe, expect, it } from "vitest";
import { computeInsights, useDashboardInsights } from "./useDashboardInsights";

const base = {
  currentStreak: 0,
  totalCaloriesToday: 0,
  calorieGoal: 2000,
  totalProteinToday: 0,
  dailyLogCount: 0,
  daysOnTargetThisWeek: 0,
};

describe("computeInsights", () => {
  it("returns empty array when no conditions met", () => {
    expect(computeInsights(base)).toStrictEqual([]);
  });

  it("returns streak insight when streak >= 3", () => {
    const insights = computeInsights({ ...base, currentStreak: 5 });
    expect(insights.some((i) => i.id === "streak")).toBe(true);
    expect(insights.find((i) => i.id === "streak")?.text).toContain("5-day");
  });

  it("does not return streak insight when streak < 3", () => {
    const insights = computeInsights({ ...base, currentStreak: 2 });
    expect(insights.some((i) => i.id === "streak")).toBe(false);
  });

  it("returns goal-close insight when 85-105% of goal consumed", () => {
    const insights = computeInsights({
      ...base,
      totalCaloriesToday: 1800,
      calorieGoal: 2000,
      dailyLogCount: 3,
    });
    expect(insights.some((i) => i.id === "goal-close")).toBe(true);
  });

  it("returns over-goal insight when > 105% of goal consumed", () => {
    const insights = computeInsights({
      ...base,
      totalCaloriesToday: 2200,
      calorieGoal: 2000,
      dailyLogCount: 3,
    });
    expect(insights.some((i) => i.id === "over-goal")).toBe(true);
  });

  it("does not return goal insight when no logs", () => {
    const insights = computeInsights({
      ...base,
      totalCaloriesToday: 1800,
      calorieGoal: 2000,
      dailyLogCount: 0,
    });
    expect(insights.some((i) => i.id === "goal-close")).toBe(false);
  });

  it("returns protein-low insight when protein is very low and logs exist", () => {
    const insights = computeInsights({
      ...base,
      totalCaloriesToday: 400,
      calorieGoal: 2000,
      totalProteinToday: 5,
      dailyLogCount: 2,
    });
    expect(insights.some((i) => i.id === "protein-low")).toBe(true);
  });

  it("returns consistency insight when >= 5 days on target", () => {
    const insights = computeInsights({ ...base, daysOnTargetThisWeek: 6 });
    expect(insights.some((i) => i.id === "consistency")).toBe(true);
    expect(insights.find((i) => i.id === "consistency")?.text).toContain("6 days");
  });

  it("does not return consistency insight when < 5 days on target", () => {
    const insights = computeInsights({ ...base, daysOnTargetThisWeek: 4 });
    expect(insights.some((i) => i.id === "consistency")).toBe(false);
  });

  it("caps results at 3 insights", () => {
    const insights = computeInsights({
      currentStreak: 10,
      totalCaloriesToday: 1900,
      calorieGoal: 2000,
      totalProteinToday: 0,
      dailyLogCount: 5,
      daysOnTargetThisWeek: 6,
    });
    expect(insights.length).toBeLessThanOrEqual(3);
  });

  it("includes subtext for streak insight", () => {
    const insights = computeInsights({ ...base, currentStreak: 7 });
    const streakInsight = insights.find((i) => i.id === "streak");
    expect(streakInsight?.subtext).toBeDefined();
  });
});

describe("useDashboardInsights", () => {
  it("delegates to computeInsights and returns the same result", () => {
    const params = { ...base, currentStreak: 5 };
    expect(useDashboardInsights(params)).toStrictEqual(computeInsights(params));
  });
});

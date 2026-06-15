import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMealPatterns, getMealSuggestions, getCurrentMealType } from "./mealPatterns";
import type { FoodItem } from "@/db/dbService";
import type { UserId } from "@/types";
import { ISODate } from "@/types";

const UID = "u1" as UserId;

function makeLog(
  name: string,
  mealType: FoodItem["mealType"],
  daysAgo: number,
  calories = 300,
): FoodItem {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateLogged = ISODate(d.toISOString().slice(0, 10));
  return { name, mealType, calories, servingSize: 1, dateLogged, userId: UID, isFavorite: false };
}

describe("getMealPatterns", () => {
  it("returns empty array for empty logs", () => {
    expect(getMealPatterns([])).toStrictEqual([]);
  });

  it("returns pattern when food appears 3+ times for same meal type", () => {
    const logs = [
      makeLog("Oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("Oatmeal", "Breakfast", 3),
    ];
    const patterns = getMealPatterns(logs);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]!.name).toBe("Oatmeal");
    expect(patterns[0]!.mealType).toBe("Breakfast");
    expect(patterns[0]!.count).toBe(3);
  });

  it("does not return pattern when count is below minCount", () => {
    const logs = [makeLog("Oatmeal", "Breakfast", 1), makeLog("Oatmeal", "Breakfast", 2)];
    expect(getMealPatterns(logs)).toHaveLength(0);
  });

  it("matches names case-insensitively", () => {
    const logs = [
      makeLog("oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("OATMEAL", "Breakfast", 3),
    ];
    const patterns = getMealPatterns(logs);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]!.count).toBe(3);
  });

  it("keeps separate patterns for same food in different meal types", () => {
    const logs = [
      makeLog("Eggs", "Breakfast", 1),
      makeLog("Eggs", "Breakfast", 2),
      makeLog("Eggs", "Breakfast", 3),
      makeLog("Eggs", "Dinner", 4),
      makeLog("Eggs", "Dinner", 5),
      makeLog("Eggs", "Dinner", 6),
    ];
    const patterns = getMealPatterns(logs);
    expect(patterns).toHaveLength(2);
    const mealTypes = patterns.map((p) => p.mealType).sort();
    expect(mealTypes).toStrictEqual(["Breakfast", "Dinner"]);
  });

  it("excludes logs older than windowDays", () => {
    const logs = [
      makeLog("Oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("Oatmeal", "Breakfast", 15), // outside 14-day window
    ];
    // only 2 logs within 14 days, below minCount of 3
    expect(getMealPatterns(logs, 14)).toHaveLength(0);
  });

  it("includes log exactly at the window boundary", () => {
    const logs = [
      makeLog("Oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("Oatmeal", "Breakfast", 14), // exactly at boundary
    ];
    // 3 logs within 14 days (inclusive), meets minCount
    expect(getMealPatterns(logs, 14)).toHaveLength(1);
  });

  it("sorts patterns by count descending", () => {
    const logs = [
      makeLog("Banana", "Breakfast", 1),
      makeLog("Banana", "Breakfast", 2),
      makeLog("Banana", "Breakfast", 3),
      makeLog("Oatmeal", "Breakfast", 4),
      makeLog("Oatmeal", "Breakfast", 5),
      makeLog("Oatmeal", "Breakfast", 6),
      makeLog("Oatmeal", "Breakfast", 7),
    ];
    const patterns = getMealPatterns(logs);
    expect(patterns[0]!.name).toBe("Oatmeal");
    expect(patterns[1]!.name).toBe("Banana");
  });

  it("preserves nutrition fields from the first matching log", () => {
    const logs = [
      { ...makeLog("Eggs", "Breakfast", 1, 150), protein: 12, carbs: 1, fat: 10 },
      makeLog("Eggs", "Breakfast", 2, 150),
      makeLog("Eggs", "Breakfast", 3, 150),
    ];
    const patterns = getMealPatterns(logs);
    expect(patterns[0]!.calories).toBe(150);
    expect(patterns[0]!.protein).toBe(12);
  });

  it("skips logs with no mealType", () => {
    const logs = [
      makeLog("Oatmeal", undefined, 1),
      makeLog("Oatmeal", undefined, 2),
      makeLog("Oatmeal", undefined, 3),
    ];
    expect(getMealPatterns(logs)).toHaveLength(0);
  });

  it("respects a custom minCount argument", () => {
    const logs = [makeLog("Oatmeal", "Breakfast", 1), makeLog("Oatmeal", "Breakfast", 2)];
    expect(getMealPatterns(logs, 14, 2)).toHaveLength(1);
  });
});

describe("getMealSuggestions", () => {
  it("returns only patterns for the given meal type", () => {
    const logs = [
      makeLog("Oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("Oatmeal", "Breakfast", 3),
      makeLog("Chicken", "Dinner", 1),
      makeLog("Chicken", "Dinner", 2),
      makeLog("Chicken", "Dinner", 3),
    ];
    const suggestions = getMealSuggestions(logs, "Breakfast");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]!.name).toBe("Oatmeal");
  });

  it("returns empty when no patterns exist for the given meal type", () => {
    const logs = [
      makeLog("Oatmeal", "Breakfast", 1),
      makeLog("Oatmeal", "Breakfast", 2),
      makeLog("Oatmeal", "Breakfast", 3),
    ];
    expect(getMealSuggestions(logs, "Dinner")).toHaveLength(0);
  });
});

describe("getCurrentMealType", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Breakfast at 7am", () => {
    vi.setSystemTime(new Date("2026-06-14T07:00:00"));
    expect(getCurrentMealType()).toBe("Breakfast");
  });

  it("returns Breakfast at 5am (boundary)", () => {
    vi.setSystemTime(new Date("2026-06-14T05:00:00"));
    expect(getCurrentMealType()).toBe("Breakfast");
  });

  it("returns Lunch at noon", () => {
    vi.setSystemTime(new Date("2026-06-14T12:00:00"));
    expect(getCurrentMealType()).toBe("Lunch");
  });

  it("returns Snacks at 3pm", () => {
    vi.setSystemTime(new Date("2026-06-14T15:00:00"));
    expect(getCurrentMealType()).toBe("Snacks");
  });

  it("returns Dinner at 7pm", () => {
    vi.setSystemTime(new Date("2026-06-14T19:00:00"));
    expect(getCurrentMealType()).toBe("Dinner");
  });

  it("returns Dinner late at night (11pm)", () => {
    vi.setSystemTime(new Date("2026-06-14T23:00:00"));
    expect(getCurrentMealType()).toBe("Dinner");
  });
});

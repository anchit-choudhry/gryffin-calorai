import { describe, expect, it } from "vitest";
import { computeWeeklySummary } from "./useWeeklySummary";

describe("computeWeeklySummary", () => {
  it("should calculate averageCalories as sum divided by 7", () => {
    const data = [2000, 1800, 2100, 1900, 2000, 2100, 2000]; // 7 days
    const result = computeWeeklySummary(data, 2000);
    const expected = Math.round(13900 / 7); // 1985
    expect(result.averageCalories).toBe(expected);
  });

  it("should count daysOnTarget correctly", () => {
    const data = [1800, 2000, 2100, 2000, 2200, 2000, 2000]; // 5 days on target
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(5);
  });

  it("should calculate consistency as percentage", () => {
    const data = [1800, 1900, 2000, 2100, 2200, 2100, 2000]; // 4/7 on target
    const result = computeWeeklySummary(data, 2000);
    expect(result.consistency).toBe(57); // Math.round((4 / 7) * 100)
  });

  it("should handle all zeros", () => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const result = computeWeeklySummary(data, 2000);
    expect(result.averageCalories).toBe(0);
    expect(result.daysOnTarget).toBe(0);
    expect(result.consistency).toBe(0);
  });

  it("should handle all days on target", () => {
    const data = [1500, 1800, 1900, 2000, 1700, 1800, 1900];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(7);
    expect(result.consistency).toBe(100);
  });

  it("should handle no days on target", () => {
    const data = [2100, 2200, 2300, 2400, 2500, 2600, 2700];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(0);
    expect(result.consistency).toBe(0);
  });

  it("should exclude zero values from average calculation", () => {
    const data = [2000, 0, 2000, 0, 2000, 0, 2000]; // 4 days with data
    const result = computeWeeklySummary(data, 2000);
    expect(result.averageCalories).toBe(Math.round(8000 / 7)); // Still divide by 7, not 4
  });

  it("should handle mixed data with some zeros", () => {
    const data = [1800, 0, 2000, 1900, 0, 2000, 1800];
    const result = computeWeeklySummary(data, 2000);
    expect(result.daysOnTarget).toBe(5); // 1800, 2000, 1900, 2000, 1800 all <= 2000
    expect(result.averageCalories).toBe(Math.round(9500 / 7));
  });
});

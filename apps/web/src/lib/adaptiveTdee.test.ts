import { describe, expect, it } from "vitest";
import { computeAdaptiveTdee, computeWeeklyForecast, detectPlateau } from "./adaptiveTdee";
import type { BodyMeasurement, FoodItem } from "@/db/dbService";
import type { BodyMeasurementId, FoodItemId, ISODate, UserId } from "@/types";

const USER_ID = "user1" as UserId;

function makeWeight(date: string, weight: number): BodyMeasurement {
  return {
    id: 1 as BodyMeasurementId,
    userId: USER_ID,
    measuredAt: date as ISODate,
    weight,
  };
}

function makeLog(date: string, calories: number): FoodItem {
  return {
    id: 1 as FoodItemId,
    userId: USER_ID,
    name: "test",
    calories,
    servingSize: 100,
    dateLogged: date as ISODate,
    isFavorite: false,
  };
}

describe("computeAdaptiveTdee", () => {
  it("returns undefined with fewer than 2 weight entries", () => {
    expect(computeAdaptiveTdee([makeWeight("2026-01-01", 80)], [])).toBeUndefined();
  });

  it("returns undefined when no food logs exist in window", () => {
    const measurements = [makeWeight("2026-01-01", 80), makeWeight("2026-01-22", 79)];
    expect(computeAdaptiveTdee(measurements, [])).toBeUndefined();
  });

  it("returns undefined when day span is less than 7", () => {
    const measurements = [makeWeight("2026-01-01", 80), makeWeight("2026-01-05", 79.5)];
    const logs = [makeLog("2026-01-01", 2000), makeLog("2026-01-05", 2000)];
    expect(computeAdaptiveTdee(measurements, logs)).toBeUndefined();
  });

  it("computes observed TDEE from deficit + weight loss", () => {
    // 14-day window: 0.5 kg lost, avg intake 1800 kcal/day
    // Expected TDEE ~= 1800 + (0.5 * 7700 / 14) = 1800 + 275 = 2075
    const measurements = [
      makeWeight("2026-01-01", 80),
      makeWeight("2026-01-08", 79.8),
      makeWeight("2026-01-15", 79.5),
    ];
    const logs: FoodItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date("2026-01-01");
      d.setDate(d.getDate() + i);
      logs.push(makeLog(d.toISOString().slice(0, 10), 1800));
    }
    const result = computeAdaptiveTdee(measurements, logs, 21);
    expect(result).toBeDefined();
    expect(result!.observedTdee).toBeGreaterThan(1800);
    expect(result!.avgIntake).toBeCloseTo(1800, -1);
    expect(result!.weightChangeKg).toBeCloseTo(0.5, 1);
    expect(result!.confidence).toBe("medium");
  });

  it("assigns high confidence with 21+ days and 4+ measurements", () => {
    const measurements = [
      makeWeight("2026-01-01", 80),
      makeWeight("2026-01-08", 79.7),
      makeWeight("2026-01-15", 79.4),
      makeWeight("2026-01-22", 79.0),
    ];
    const logs: FoodItem[] = [];
    for (let i = 0; i < 22; i++) {
      const d = new Date("2026-01-01");
      d.setDate(d.getDate() + i);
      logs.push(makeLog(d.toISOString().slice(0, 10), 2000));
    }
    const result = computeAdaptiveTdee(measurements, logs, 30);
    expect(result).toBeDefined();
    expect(result!.confidence).toBe("high");
  });

  it("handles surplus (weight gain) scenario", () => {
    // User gained 0.3 kg in 14 days eating 2500 kcal/day
    // TDEE ~= 2500 - (0.3 * 7700 / 14) = 2500 - 165 = 2335
    const measurements = [
      makeWeight("2026-01-01", 75),
      makeWeight("2026-01-08", 75.15),
      makeWeight("2026-01-15", 75.3),
    ];
    const logs: FoodItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date("2026-01-01");
      d.setDate(d.getDate() + i);
      logs.push(makeLog(d.toISOString().slice(0, 10), 2500));
    }
    const result = computeAdaptiveTdee(measurements, logs, 21);
    expect(result).toBeDefined();
    expect(result!.observedTdee).toBeLessThan(2500);
    expect(result!.weightChangeKg).toBeCloseTo(-0.3, 1);
  });
});

describe("detectPlateau", () => {
  it("returns no plateau with fewer than 2 measurements", () => {
    const result = detectPlateau([]);
    expect(result.isPlateauing).toBe(false);
  });

  it("returns no plateau when daySpan is less than 21 days", () => {
    const today = new Date();
    const start = new Date(today);
    // 20-day span is below the 21-day threshold regardless of weight change
    start.setDate(today.getDate() - 20);
    const measurements = [
      makeWeight(start.toISOString().slice(0, 10), 80),
      makeWeight(today.toISOString().slice(0, 10), 79),
    ];
    const result = detectPlateau(measurements);
    expect(result.isPlateauing).toBe(false);
  });

  it("detects plateau when weight change < 0.5 kg over 21+ days", () => {
    const today = new Date();
    const start = new Date(today);
    // Exactly 21 days puts start at the cutoff boundary (>= cutoffISO passes)
    start.setDate(today.getDate() - 21);
    const measurements = [
      makeWeight(start.toISOString().slice(0, 10), 80),
      makeWeight(today.toISOString().slice(0, 10), 80.1),
    ];
    const result = detectPlateau(measurements);
    expect(result.isPlateauing).toBe(true);
    expect(result.daySpan).toBeGreaterThanOrEqual(21);
  });
});

describe("computeWeeklyForecast", () => {
  it("projects surplus when daily intake exceeds goal", () => {
    const today = "2026-01-07"; // Wednesday
    const logs = [
      makeLog("2026-01-05", 2500), // Mon
      makeLog("2026-01-06", 2500), // Tue
      makeLog("2026-01-07", 2500), // Wed
    ];
    const result = computeWeeklyForecast(logs, 2000, today);
    expect(result.projectedTotal).toBeGreaterThan(result.weeklyBudget);
    expect(result.projectedBalance).toBeGreaterThan(0);
    expect(result.daysLogged).toBe(3);
  });

  it("projects deficit when daily intake is below goal", () => {
    const today = "2026-01-07";
    const logs = [
      makeLog("2026-01-05", 1500),
      makeLog("2026-01-06", 1500),
      makeLog("2026-01-07", 1500),
    ];
    const result = computeWeeklyForecast(logs, 2000, today);
    expect(result.projectedTotal).toBeLessThan(result.weeklyBudget);
    expect(result.projectedBalance).toBeLessThan(0);
  });

  it("returns zero days logged when no logs exist this week", () => {
    const result = computeWeeklyForecast([], 2000, "2026-01-07");
    expect(result.daysLogged).toBe(0);
  });
});

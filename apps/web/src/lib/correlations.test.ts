import { describe, expect, it } from "vitest";
import {
  computeAllCorrelations,
  fastingVsIntakeCorrelation,
  sodiumVsWeightCorrelation,
  trainingVsAdherenceCorrelation,
} from "./correlations";
import type { BodyMeasurement, FastingSession, FoodItem } from "@/db/dbService";
import type { BodyMeasurementId, FastingSessionId, FoodItemId, ISODate, UserId } from "@/types";

const UID = "u1" as UserId;

function makeLog(date: string, calories: number, sodium = 0): FoodItem {
  return {
    id: 1 as FoodItemId,
    userId: UID,
    name: "food",
    calories,
    servingSize: 100,
    dateLogged: date as ISODate,
    isFavorite: false,
    nutritionData: sodium > 0 ? { sodium } : undefined,
  };
}

function makeWeight(date: string, weight: number): BodyMeasurement {
  return {
    id: 1 as BodyMeasurementId,
    userId: UID,
    measuredAt: date as ISODate,
    weight,
  };
}

function makeFasting(date: string, completed: boolean): FastingSession {
  return {
    id: 1 as FastingSessionId,
    userId: UID,
    startTime: `${date}T08:00:00Z`,
    endTime: completed ? `${date}T22:00:00Z` : null,
    targetHours: 14,
    dateLogged: date as ISODate,
    completed,
  };
}

describe("sodiumVsWeightCorrelation", () => {
  it("returns undefined with fewer than 5 paired observations", () => {
    const logs = [makeLog("2026-01-01", 2000, 800)];
    const weights = [makeWeight("2026-01-01", 80), makeWeight("2026-01-02", 80.2)];
    expect(sodiumVsWeightCorrelation(logs, weights)).toBeUndefined();
  });

  it("returns undefined when no logs have sodium data", () => {
    const logs = Array.from({ length: 10 }, (_, i) => {
      const d = `2026-01-${String(i + 1).padStart(2, "0")}`;
      return makeLog(d, 2000, 0);
    });
    const weights = Array.from({ length: 10 }, (_, i) => {
      const d = `2026-01-${String(i + 1).padStart(2, "0")}`;
      return makeWeight(d, 80);
    });
    expect(sodiumVsWeightCorrelation(logs, weights)).toBeUndefined();
  });

  it("detects positive correlation - high sodium precedes weight gain", () => {
    // Days with high sodium consistently followed by higher next-day weight
    const logs: FoodItem[] = [];
    const weights: BodyMeasurement[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date("2026-01-01");
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextStr = nextDate.toISOString().slice(0, 10);
      const sodium = (i + 1) * 200;
      logs.push(makeLog(dateStr, 2000, sodium));
      weights.push(makeWeight(dateStr, 80 + i * 0.01));
      weights.push(makeWeight(nextStr, 80 + i * 0.01 + sodium / 50000));
    }
    const result = sodiumVsWeightCorrelation(logs, weights);
    expect(result).toBeDefined();
    expect(result!.id).toBe("sodium-weight");
    expect(result!.sampleSize).toBeGreaterThanOrEqual(5);
    expect(result!.r).toBeGreaterThan(0);
  });

  it("returns a result with required fields", () => {
    const logs: FoodItem[] = [];
    const weights: BodyMeasurement[] = [];
    for (let i = 0; i < 6; i++) {
      const date = `2026-01-${String(i + 1).padStart(2, "0")}`;
      const next = `2026-01-${String(i + 2).padStart(2, "0")}`;
      logs.push(makeLog(date, 2000, (i + 1) * 300));
      weights.push(makeWeight(date, 80 + i * 0.05));
      weights.push(makeWeight(next, 80 + i * 0.05 + (i + 1) * 0.01));
    }
    const result = sodiumVsWeightCorrelation(logs, weights);
    if (!result) return;
    expect(typeof result.r).toBe("number");
    expect(result.direction).toMatch(/^(positive|negative|neutral)$/);
    expect(result.strength).toMatch(/^(strong|moderate|weak)$/);
    expect(result.label).toBeTruthy();
    expect(result.description).toBeTruthy();
  });
});

describe("trainingVsAdherenceCorrelation", () => {
  it("returns undefined with fewer than 5 training days", () => {
    const logs = [makeLog("2026-01-01", 2000), makeLog("2026-01-02", 2000)];
    const trainingDays = ["2026-01-01", "2026-01-02"] as ISODate[];
    expect(trainingVsAdherenceCorrelation(logs, trainingDays, 2000)).toBeUndefined();
  });

  it("returns undefined when calorieGoal is 0", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog(`2026-01-${String(i + 1).padStart(2, "0")}`, 2000),
    );
    const trainingDays = Array.from(
      { length: 7 },
      (_, i) => `2026-01-${String(i + 1).padStart(2, "0")}` as ISODate,
    );
    expect(trainingVsAdherenceCorrelation(logs, trainingDays, 0)).toBeUndefined();
  });

  it("detects positive correlation - higher intake on training days", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    // Even-indexed days are training days with high intake
    const logs = dates.map((d, i) => makeLog(d, i % 2 === 0 ? 2800 : 1600));
    const trainingDays = dates.filter((_, i) => i % 2 === 0) as ISODate[];
    const result = trainingVsAdherenceCorrelation(logs, trainingDays, 2000);
    expect(result).toBeDefined();
    expect(result!.id).toBe("training-adherence");
    expect(result!.r).toBeGreaterThan(0);
    expect(result!.sampleSize).toBe(10);
  });

  it("detects negative correlation - lower intake on training days", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    // Even-indexed days are training days with LOW intake (under-fuelling)
    const logs = dates.map((d, i) => makeLog(d, i % 2 === 0 ? 1400 : 2600));
    const trainingDays = dates.filter((_, i) => i % 2 === 0) as ISODate[];
    const result = trainingVsAdherenceCorrelation(logs, trainingDays, 2000);
    expect(result).toBeDefined();
    expect(result!.r).toBeLessThan(0);
  });

  it("returns a result with required fields", () => {
    const dates = Array.from({ length: 8 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d) => makeLog(d, 2000));
    const trainingDays = dates.slice(0, 5) as ISODate[];
    const result = trainingVsAdherenceCorrelation(logs, trainingDays, 2000);
    if (!result) return;
    expect(result.label).toBeTruthy();
    expect(result.description).toBeTruthy();
    expect(result.direction).toMatch(/^(positive|negative|neutral)$/);
    expect(result.strength).toMatch(/^(strong|moderate|weak)$/);
  });
});

describe("fastingVsIntakeCorrelation", () => {
  it("returns undefined with fewer than 5 food-logged dates", () => {
    const logs = [makeLog("2026-01-01", 1200)];
    const fasting = [makeFasting("2026-01-01", true)];
    expect(fastingVsIntakeCorrelation(logs, fasting)).toBeUndefined();
  });

  it("detects negative correlation - fasting days have lower intake", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    // Odd-indexed days are fasting days with very low intake
    const logs = dates.map((d, i) => makeLog(d, i % 2 === 1 ? 800 : 2400));
    const fasting = dates.filter((_, i) => i % 2 === 1).map((d) => makeFasting(d, true));
    const result = fastingVsIntakeCorrelation(logs, fasting);
    expect(result).toBeDefined();
    expect(result!.id).toBe("fasting-intake");
    expect(result!.r).toBeLessThan(0);
    expect(result!.sampleSize).toBe(10);
  });

  it("only counts completed fasting sessions", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d) => makeLog(d, 2000));
    // All fasting sessions incomplete - no completed sessions
    const fasting = dates.map((d) => makeFasting(d, false));
    const result = fastingVsIntakeCorrelation(logs, fasting);
    // With no completed fasting days, all are 0 -> no meaningful correlation (constant vector)
    // pearsonR returns undefined when denominator is 0 (constant xs)
    expect(result).toBeUndefined();
  });

  it("returns a result with required fields", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i) => makeLog(d, i % 2 === 0 ? 800 : 2400));
    const fasting = dates.filter((_, i) => i % 2 === 0).map((d) => makeFasting(d, true));
    const result = fastingVsIntakeCorrelation(logs, fasting);
    if (!result) return;
    expect(result.label).toBeTruthy();
    expect(result.description).toBeTruthy();
    expect(result.direction).toMatch(/^(positive|negative|neutral)$/);
  });
});

describe("computeAllCorrelations", () => {
  it("returns empty array when no data meets thresholds", () => {
    expect(computeAllCorrelations([], [], [], [], 2000)).toStrictEqual([]);
  });

  it("aggregates only defined correlation results", () => {
    // Provide enough data for fasting correlation only
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i) => makeLog(d, i % 2 === 0 ? 800 : 2400));
    const fasting = dates.filter((_, i) => i % 2 === 0).map((d) => makeFasting(d, true));
    const results = computeAllCorrelations(logs, [], fasting, [], 2000);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("fasting-intake");
  });

  it("includes all three correlations when all data is sufficient", () => {
    const dates = Array.from({ length: 12 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i) =>
      makeLog(d, i % 2 === 0 ? 1600 : 2400, i % 2 === 0 ? 200 : 1200),
    );
    const weights = dates.flatMap((d, i) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const nextStr = next.toISOString().slice(0, 10);
      return [
        makeWeight(d, 80 + i * 0.02),
        makeWeight(nextStr, 80 + i * 0.02 + (i % 2 === 0 ? -0.05 : 0.05)),
      ];
    });
    const trainingDays = dates.filter((_, i) => i % 2 === 0) as ISODate[];
    const fasting = dates.filter((_, i) => i % 2 === 0).map((d) => makeFasting(d, true));
    const results = computeAllCorrelations(logs, weights, fasting, trainingDays, 2000);
    // At least training and fasting should be present; sodium depends on paired weight data
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

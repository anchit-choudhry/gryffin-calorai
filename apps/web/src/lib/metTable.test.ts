import { describe, expect, it } from "vitest";
import { computeCaloriesBurned, MET_ACTIVITY_NAMES, MET_VALUES } from "./metTable";

describe("MET_VALUES", () => {
  it("contains walking activities", () => {
    expect(MET_VALUES["Walking (moderate, 3 mph)"]).toBeDefined();
  });

  it("running has higher MET than walking", () => {
    expect(MET_VALUES["Running (6 mph)"]!).toBeGreaterThan(MET_VALUES["Walking (brisk, 3.5 mph)"]!);
  });

  it("all values are positive numbers", () => {
    for (const [, value] of Object.entries(MET_VALUES)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe("MET_ACTIVITY_NAMES", () => {
  it("contains all keys from MET_VALUES", () => {
    expect(MET_ACTIVITY_NAMES).toStrictEqual(Object.keys(MET_VALUES));
  });

  it("is non-empty", () => {
    expect(MET_ACTIVITY_NAMES.length).toBeGreaterThan(0);
  });
});

describe("computeCaloriesBurned", () => {
  it("calculates calories for running 30 min at 70 kg", () => {
    // MET 9.8 * 3.5 * 70 * 30 / 200 = 360.15 -> 360
    const result = computeCaloriesBurned("Running (6 mph)", 30, 70);
    expect(result).toBe(360);
  });

  it("calculates calories for walking 60 min at 70 kg", () => {
    // MET 3.5 * 3.5 * 70 * 60 / 200 = 257.25 -> 257
    const result = computeCaloriesBurned("Walking (moderate, 3 mph)", 60, 70);
    expect(result).toBe(257);
  });

  it("heavier person burns more calories", () => {
    const light = computeCaloriesBurned("Running (6 mph)", 30, 60);
    const heavy = computeCaloriesBurned("Running (6 mph)", 30, 90);
    expect(heavy).toBeGreaterThan(light);
  });

  it("longer duration burns more calories", () => {
    const short = computeCaloriesBurned("Running (6 mph)", 15, 70);
    const long = computeCaloriesBurned("Running (6 mph)", 60, 70);
    expect(long).toBeGreaterThan(short);
  });

  it("uses default MET 4.0 for unknown activity", () => {
    // MET 4.0 * 3.5 * 70 * 30 / 200 = 147
    const result = computeCaloriesBurned("Unknown Activity XYZ", 30, 70);
    expect(result).toBe(147);
  });

  it("returns 0 for 0 duration", () => {
    expect(computeCaloriesBurned("Running (6 mph)", 0, 70)).toBe(0);
  });

  it("result is always a whole number", () => {
    const result = computeCaloriesBurned("Yoga", 45, 65);
    expect(Number.isInteger(result)).toBe(true);
  });
});

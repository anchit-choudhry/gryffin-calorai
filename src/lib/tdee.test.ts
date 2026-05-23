import { describe, expect, it } from "vitest";
import {
  computeCalorieGoal,
  computeTDEE,
  mifflinStJeorBMR,
  projectedDateForWeightChange,
} from "./tdee";

describe("mifflinStJeorBMR", () => {
  it("calculates male BMR correctly", () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 -> 1649
    expect(mifflinStJeorBMR("male", 70, 175, 30)).toBe(1649);
  });

  it("calculates female BMR correctly", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    expect(mifflinStJeorBMR("female", 60, 165, 25)).toBe(1345);
  });

  it("male BMR is higher than female for same inputs", () => {
    const male = mifflinStJeorBMR("male", 70, 175, 30);
    const female = mifflinStJeorBMR("female", 70, 175, 30);
    expect(male).toBeGreaterThan(female);
  });

  it("higher weight increases BMR", () => {
    const low = mifflinStJeorBMR("male", 70, 175, 30);
    const high = mifflinStJeorBMR("male", 90, 175, 30);
    expect(high).toBeGreaterThan(low);
  });

  it("higher age decreases BMR", () => {
    const young = mifflinStJeorBMR("male", 70, 175, 25);
    const older = mifflinStJeorBMR("male", 70, 175, 50);
    expect(young).toBeGreaterThan(older);
  });

  it("taller height increases BMR", () => {
    const short = mifflinStJeorBMR("male", 70, 160, 30);
    const tall = mifflinStJeorBMR("male", 70, 190, 30);
    expect(tall).toBeGreaterThan(short);
  });
});

describe("computeTDEE", () => {
  it("sedentary multiplier is 1.2", () => {
    const bmr = 1600;
    expect(computeTDEE(bmr, "sedentary")).toBe(Math.round(1600 * 1.2));
  });

  it("active multiplier is higher than moderate", () => {
    const bmr = 1600;
    expect(computeTDEE(bmr, "active")).toBeGreaterThan(computeTDEE(bmr, "moderate"));
  });

  it("very_active produces highest TDEE", () => {
    const bmr = 1600;
    const values = (["sedentary", "light", "moderate", "active", "very_active"] as const).map((l) =>
      computeTDEE(bmr, l),
    );
    const max = Math.max(...values);
    expect(computeTDEE(bmr, "very_active")).toBe(max);
  });

  it("sedentary produces lowest TDEE", () => {
    const bmr = 1600;
    const values = (["sedentary", "light", "moderate", "active", "very_active"] as const).map((l) =>
      computeTDEE(bmr, l),
    );
    const min = Math.min(...values);
    expect(computeTDEE(bmr, "sedentary")).toBe(min);
  });
});

describe("computeCalorieGoal", () => {
  it("maintain returns TDEE unchanged (if >= 1200)", () => {
    expect(computeCalorieGoal(2000, "maintain")).toBe(2000);
  });

  it("lose subtracts 500 from TDEE", () => {
    expect(computeCalorieGoal(2000, "lose")).toBe(1500);
  });

  it("gain adds 300 to TDEE", () => {
    expect(computeCalorieGoal(2000, "gain")).toBe(2300);
  });

  it("floors result at 1200 for very low TDEE", () => {
    expect(computeCalorieGoal(1400, "lose")).toBe(1200);
  });

  it("never returns below 1200", () => {
    expect(computeCalorieGoal(100, "lose")).toBe(1200);
  });
});

describe("projectedDateForWeightChange", () => {
  it("returns null when current equals target", () => {
    expect(projectedDateForWeightChange(70, 70, 500)).toBeNull();
  });

  it("returns null when deficit is zero", () => {
    expect(projectedDateForWeightChange(70, 65, 0)).toBeNull();
  });

  it("returns null when deficit is negligible", () => {
    expect(projectedDateForWeightChange(70, 65, 0.5)).toBeNull();
  });

  it("returns a future Date for valid inputs", () => {
    const result = projectedDateForWeightChange(80, 75, 500);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeGreaterThan(Date.now());
  });

  it("larger deficit means sooner target date", () => {
    const small = projectedDateForWeightChange(80, 75, 250);
    const large = projectedDateForWeightChange(80, 75, 500);
    expect(large!.getTime()).toBeLessThan(small!.getTime());
  });

  it("works for weight gain scenario", () => {
    const result = projectedDateForWeightChange(60, 65, 300);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBeGreaterThan(Date.now());
  });
});

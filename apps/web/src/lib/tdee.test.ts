import { describe, expect, it } from "vitest";
import {
  applyPeriodization,
  computeCalorieGoal,
  computeMacroTargets,
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

describe("computeMacroTargets", () => {
  it("generic preset: 25% protein at 2000 kcal gives 125g", () => {
    // (2000 * 25) / 100 / 4 = 125
    expect(computeMacroTargets(2000, "generic").protein).toBe(125);
  });

  it("generic preset: 50% carbs at 2000 kcal gives 250g", () => {
    // (2000 * 50) / 100 / 4 = 250
    expect(computeMacroTargets(2000, "generic").carbs).toBe(250);
  });

  it("generic preset: 25% fat at 2000 kcal gives 56g", () => {
    // (2000 * 25) / 100 / 9 = 55.55 -> 56
    expect(computeMacroTargets(2000, "generic").fat).toBe(56);
  });

  it("keto preset has very low carb target", () => {
    // keto: carbs = 5%, so (2000 * 5) / 100 / 4 = 25g
    expect(computeMacroTargets(2000, "keto").carbs).toBe(25);
  });

  it("high_protein preset has more protein than generic", () => {
    const hp = computeMacroTargets(2000, "high_protein");
    const generic = computeMacroTargets(2000, "generic");
    expect(hp.protein).toBeGreaterThan(generic.protein);
  });

  it("scales proportionally with calorie goal", () => {
    const at2000 = computeMacroTargets(2000, "generic");
    const at4000 = computeMacroTargets(4000, "generic");
    expect(at4000.protein).toBe(at2000.protein * 2);
    expect(at4000.carbs).toBe(at2000.carbs * 2);
  });

  it("returns zero targets for zero calorie goal", () => {
    const result = computeMacroTargets(0, "generic");
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });
});

describe("applyPeriodization", () => {
  const base = { protein: 150, carbs: 250, fat: 56 };

  it("training day increases carbs by 30%", () => {
    expect(applyPeriodization(base, true).carbs).toBe(Math.round(250 * 1.3));
  });

  it("training day reduces fat by 10%", () => {
    expect(applyPeriodization(base, true).fat).toBe(Math.round(56 * 0.9));
  });

  it("training day leaves protein unchanged", () => {
    expect(applyPeriodization(base, true).protein).toBe(150);
  });

  it("rest day reduces carbs by 20%", () => {
    expect(applyPeriodization(base, false).carbs).toBe(Math.round(250 * 0.8));
  });

  it("rest day increases fat by 10%", () => {
    expect(applyPeriodization(base, false).fat).toBe(Math.round(56 * 1.1));
  });

  it("rest day leaves protein unchanged", () => {
    expect(applyPeriodization(base, false).protein).toBe(150);
  });

  it("fat is floored at 0 on training day with zero fat", () => {
    expect(applyPeriodization({ protein: 150, carbs: 250, fat: 0 }, true).fat).toBe(0);
  });

  it("carbs are floored at 0 on rest day with zero carbs", () => {
    expect(applyPeriodization({ protein: 150, carbs: 0, fat: 56 }, false).carbs).toBe(0);
  });

  it("returns new object - does not mutate base", () => {
    const original = { protein: 150, carbs: 250, fat: 56 };
    applyPeriodization(original, true);
    expect(original).toStrictEqual({ protein: 150, carbs: 250, fat: 56 });
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

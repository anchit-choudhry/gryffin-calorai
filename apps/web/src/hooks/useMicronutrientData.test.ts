import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { FEATURED_NUTRIENTS, useMicronutrientData } from "./useMicronutrientData";
import type { FoodItem, TdeeProfile } from "../db/dbService";
import type { UserId } from "@/types";

const mockDailyLogs = vi.hoisted(() => ({ value: [] as Partial<FoodItem>[] }));
const mockTdeeProfile = vi.hoisted<{ value: TdeeProfile | null }>(() => ({ value: null }));

vi.mock("../state/AppState", () => ({
  useAppState: () => ({ dailyLogs: mockDailyLogs.value, tdeeProfile: mockTdeeProfile.value }),
}));

vi.mock("../lib/micronutrientRDA", () => ({
  getPersonalizedRDA: vi.fn((key: string, profile: TdeeProfile) => {
    if (key === "iron") return profile.sex === "female" && profile.age <= 50 ? 18 : 8;
    if (key === "calcium") {
      if (profile.age >= 71) return 1200;
      if (profile.sex === "female" && profile.age >= 51) return 1200;
      return 1000;
    }
    const defaults: Record<string, number> = {
      vitaminC: 90,
      fiber: 28,
      sodium: 2300,
    };
    return defaults[key] ?? 0;
  }),
}));

function makeLog(nutritionData?: Partial<FoodItem["nutritionData"]>): Partial<FoodItem> {
  return { nutritionData: nutritionData as FoodItem["nutritionData"] };
}

function makeProfile(sex: "male" | "female", age: number): TdeeProfile {
  return {
    userId: "u1" as UserId,
    age,
    sex,
    heightCm: 170,
    weightKg: 70,
    activityLevel: "moderate",
    goal: "maintain",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("FEATURED_NUTRIENTS", () => {
  it("contains exactly 5 entries", () => {
    expect(FEATURED_NUTRIENTS).toHaveLength(5);
  });

  it("includes vitaminC, calcium, iron, fiber, sodium", () => {
    expect(FEATURED_NUTRIENTS).toContain("vitaminC");
    expect(FEATURED_NUTRIENTS).toContain("calcium");
    expect(FEATURED_NUTRIENTS).toContain("iron");
    expect(FEATURED_NUTRIENTS).toContain("fiber");
    expect(FEATURED_NUTRIENTS).toContain("sodium");
  });
});

describe("useMicronutrientData", () => {
  beforeEach(() => {
    mockDailyLogs.value = [];
    mockTdeeProfile.value = null;
  });

  it("returns one chart entry per featured nutrient", () => {
    const { result } = renderHook(() => useMicronutrientData());
    expect(result.current.chartData).toHaveLength(FEATURED_NUTRIENTS.length);
  });

  it("returns hasData=false when logs list is empty", () => {
    const { result } = renderHook(() => useMicronutrientData());
    expect(result.current.hasData).toBe(false);
  });

  it("returns hasData=false when logs have no nutritionData", () => {
    mockDailyLogs.value = [{ name: "Apple", calories: 95 }];
    const { result } = renderHook(() => useMicronutrientData());
    expect(result.current.hasData).toBe(false);
  });

  it("returns hasData=true when at least one featured nutrient has a value", () => {
    mockDailyLogs.value = [makeLog({ vitaminC: 30 })];
    const { result } = renderHook(() => useMicronutrientData());
    expect(result.current.hasData).toBe(true);
  });

  it("sums vitaminC across multiple logs", () => {
    mockDailyLogs.value = [makeLog({ vitaminC: 30 }), makeLog({ vitaminC: 60 })];
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Vitamin C")!;
    expect(entry.value).toBe(90);
  });

  it("computes pct as percentage of RDA (vitaminC RDA=90)", () => {
    mockDailyLogs.value = [makeLog({ vitaminC: 45 })];
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Vitamin C")!;
    expect(entry.pct).toBe(50);
  });

  it("caps pct at 150 when value exceeds 1.5x RDA", () => {
    mockDailyLogs.value = [makeLog({ vitaminC: 200 })];
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Vitamin C")!;
    expect(entry.pct).toBe(150);
  });

  it("returns pct=0 for nutrients with no logged value", () => {
    mockDailyLogs.value = [makeLog({ calcium: 100 })];
    const { result } = renderHook(() => useMicronutrientData());
    const iron = result.current.chartData.find((d) => d.name === "Iron")!;
    expect(iron.pct).toBe(0);
    expect(iron.value).toBe(0);
  });

  it("skips logs where nutritionData is undefined", () => {
    mockDailyLogs.value = [makeLog(undefined), makeLog({ iron: 9 })];
    const { result } = renderHook(() => useMicronutrientData());
    const iron = result.current.chartData.find((d) => d.name === "Iron")!;
    expect(iron.value).toBe(9);
  });

  it("ignores non-featured nutrients (e.g. vitaminA)", () => {
    mockDailyLogs.value = [makeLog({ vitaminA: 500 })];
    const { result } = renderHook(() => useMicronutrientData());
    expect(result.current.hasData).toBe(false);
  });

  it("chart entries include correct unit and rda for vitaminC", () => {
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Vitamin C")!;
    expect(entry.unit).toBe("mg");
    expect(entry.rda).toBe(90);
  });

  it("chart entries include correct unit and rda for fiber", () => {
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Fiber")!;
    expect(entry.unit).toBe("g");
    expect(entry.rda).toBe(28);
  });

  it("chart entries include correct unit and rda for sodium", () => {
    const { result } = renderHook(() => useMicronutrientData());
    const entry = result.current.chartData.find((d) => d.name === "Sodium")!;
    expect(entry.unit).toBe("mg");
    expect(entry.rda).toBe(2300);
  });

  it("accumulates values from logs that only have partial nutritionData", () => {
    mockDailyLogs.value = [
      makeLog({ vitaminC: 20, calcium: 100 }),
      makeLog({ vitaminC: 25, iron: 5 }),
      makeLog({ sodium: 800 }),
    ];
    const { result } = renderHook(() => useMicronutrientData());
    const vitC = result.current.chartData.find((d) => d.name === "Vitamin C")!;
    const calc = result.current.chartData.find((d) => d.name === "Calcium")!;
    const iron = result.current.chartData.find((d) => d.name === "Iron")!;
    const sodium = result.current.chartData.find((d) => d.name === "Sodium")!;
    expect(vitC.value).toBe(45);
    expect(calc.value).toBe(100);
    expect(iron.value).toBe(5);
    expect(sodium.value).toBe(800);
  });

  describe("isPersonalized", () => {
    it("returns isPersonalized=false when no tdeeProfile", () => {
      const { result } = renderHook(() => useMicronutrientData());
      expect(result.current.isPersonalized).toBe(false);
    });

    it("returns isPersonalized=true when tdeeProfile is set", () => {
      mockTdeeProfile.value = makeProfile("female", 30);
      const { result } = renderHook(() => useMicronutrientData());
      expect(result.current.isPersonalized).toBe(true);
    });
  });

  describe("personalized RDA", () => {
    it("uses personalized iron RDA (8mg) for males", () => {
      mockTdeeProfile.value = makeProfile("male", 30);
      mockDailyLogs.value = [makeLog({ iron: 8 })];
      const { result } = renderHook(() => useMicronutrientData());
      const iron = result.current.chartData.find((d) => d.name === "Iron")!;
      expect(iron.rda).toBe(8);
      expect(iron.pct).toBe(100);
    });

    it("uses personalized iron RDA (18mg) for females age 30", () => {
      mockTdeeProfile.value = makeProfile("female", 30);
      mockDailyLogs.value = [makeLog({ iron: 9 })];
      const { result } = renderHook(() => useMicronutrientData());
      const iron = result.current.chartData.find((d) => d.name === "Iron")!;
      expect(iron.rda).toBe(18);
      expect(iron.pct).toBe(50);
    });

    it("uses personalized calcium RDA (1200mg) for females age 55", () => {
      mockTdeeProfile.value = makeProfile("female", 55);
      mockDailyLogs.value = [makeLog({ calcium: 600 })];
      const { result } = renderHook(() => useMicronutrientData());
      const calcium = result.current.chartData.find((d) => d.name === "Calcium")!;
      expect(calcium.rda).toBe(1200);
      expect(calcium.pct).toBe(50);
    });

    it("uses personalized calcium RDA (1000mg) for males age 55", () => {
      mockTdeeProfile.value = makeProfile("male", 55);
      mockDailyLogs.value = [makeLog({ calcium: 500 })];
      const { result } = renderHook(() => useMicronutrientData());
      const calcium = result.current.chartData.find((d) => d.name === "Calcium")!;
      expect(calcium.rda).toBe(1000);
      expect(calcium.pct).toBe(50);
    });
  });
});

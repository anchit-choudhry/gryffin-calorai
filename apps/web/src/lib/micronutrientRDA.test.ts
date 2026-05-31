import { describe, expect, it } from "vitest";
import { getPersonalizedRDA } from "./micronutrientRDA";
import type { UserId } from "@/types";
import { MICRONUTRIENT_RDA } from "@/types";
import type { TdeeProfile } from "../db/dbService";

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

describe("getPersonalizedRDA - iron", () => {
  it("returns 8 for males regardless of age", () => {
    expect(getPersonalizedRDA("iron", makeProfile("male", 25))).toBe(8);
    expect(getPersonalizedRDA("iron", makeProfile("male", 55))).toBe(8);
  });

  it("returns 18 for females age 50 or under", () => {
    expect(getPersonalizedRDA("iron", makeProfile("female", 19))).toBe(18);
    expect(getPersonalizedRDA("iron", makeProfile("female", 50))).toBe(18);
  });

  it("returns 8 for females over age 50", () => {
    expect(getPersonalizedRDA("iron", makeProfile("female", 51))).toBe(8);
    expect(getPersonalizedRDA("iron", makeProfile("female", 70))).toBe(8);
  });
});

describe("getPersonalizedRDA - calcium", () => {
  it("returns 1000 for males and females under 51", () => {
    expect(getPersonalizedRDA("calcium", makeProfile("male", 30))).toBe(1000);
    expect(getPersonalizedRDA("calcium", makeProfile("female", 30))).toBe(1000);
    expect(getPersonalizedRDA("calcium", makeProfile("male", 50))).toBe(1000);
    expect(getPersonalizedRDA("calcium", makeProfile("female", 50))).toBe(1000);
  });

  it("returns 1200 for females age 51 to 70", () => {
    expect(getPersonalizedRDA("calcium", makeProfile("female", 51))).toBe(1200);
    expect(getPersonalizedRDA("calcium", makeProfile("female", 70))).toBe(1200);
  });

  it("returns 1000 for males age 51 to 70", () => {
    expect(getPersonalizedRDA("calcium", makeProfile("male", 51))).toBe(1000);
    expect(getPersonalizedRDA("calcium", makeProfile("male", 70))).toBe(1000);
  });

  it("returns 1200 for all sexes age 71+", () => {
    expect(getPersonalizedRDA("calcium", makeProfile("male", 71))).toBe(1200);
    expect(getPersonalizedRDA("calcium", makeProfile("female", 71))).toBe(1200);
    expect(getPersonalizedRDA("calcium", makeProfile("male", 80))).toBe(1200);
  });
});

describe("getPersonalizedRDA - other nutrients", () => {
  it("returns default MICRONUTRIENT_RDA for vitaminC", () => {
    expect(getPersonalizedRDA("vitaminC", makeProfile("male", 30))).toBe(
      MICRONUTRIENT_RDA.vitaminC,
    );
    expect(getPersonalizedRDA("vitaminC", makeProfile("female", 60))).toBe(
      MICRONUTRIENT_RDA.vitaminC,
    );
  });

  it("returns default MICRONUTRIENT_RDA for sodium", () => {
    expect(getPersonalizedRDA("sodium", makeProfile("male", 30))).toBe(MICRONUTRIENT_RDA.sodium);
  });

  it("returns default MICRONUTRIENT_RDA for fiber", () => {
    expect(getPersonalizedRDA("fiber", makeProfile("female", 40))).toBe(MICRONUTRIENT_RDA.fiber);
  });

  it("returns default for all non-personalized nutrients", () => {
    const profile = makeProfile("male", 30);
    const nonPersonalized: (keyof typeof MICRONUTRIENT_RDA)[] = [
      "vitaminA",
      "vitaminB12",
      "vitaminB6",
      "vitaminC",
      "vitaminD",
      "vitaminE",
      "vitaminK",
      "folate",
      "niacin",
      "thiamine",
      "magnesium",
      "potassium",
      "sodium",
      "zinc",
      "copper",
      "iodine",
      "phosphorus",
      "selenium",
      "fiber",
      "sugar",
      "saturatedFat",
      "transFat",
      "cholesterol",
    ];
    for (const key of nonPersonalized) {
      expect(getPersonalizedRDA(key, profile)).toBe(MICRONUTRIENT_RDA[key]);
    }
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  assertDefined,
  checkFoodNameRestrictions,
  computeStreaks,
  fuzzyMatchFoodName,
  getTodayDayIndex,
  isBodyMeasurementId,
  isDietProfileId,
  isFoodItemId,
  isISODate,
  isLengthUnit,
  isRecipeId,
  isRecurringMealId,
  isStepLogId,
  isUserAchievementId,
  isUserId,
  isWaterLogId,
  isWeightUnit,
  sanitizeBarcodeInput,
  sanitizeVoiceTranscript,
} from "./index";

describe("sanitizeBarcodeInput", () => {
  it("accepts valid string ≤100 chars", () => {
    expect(sanitizeBarcodeInput("012345")).toBe("012345");
  });

  it("returns null for empty string", () => {
    expect(sanitizeBarcodeInput("")).toBeNull();
  });

  it("returns null for string >100 chars", () => {
    expect(sanitizeBarcodeInput("1".repeat(101))).toBeNull();
  });

  it("accepts string exactly 100 chars", () => {
    expect(sanitizeBarcodeInput("1".repeat(100))).toBe("1".repeat(100));
  });

  it("strips non-printable ASCII characters", () => {
    expect(sanitizeBarcodeInput("Hello\x00World")).toBe("HelloWorld");
  });

  it("returns null if result is empty after stripping", () => {
    expect(sanitizeBarcodeInput("\x00\x01\x02")).toBeNull();
  });

  it("trims leading/trailing whitespace", () => {
    expect(sanitizeBarcodeInput("  test  ")).toBe("test");
  });

  it("trims whitespace and rejects if still too long after trim", () => {
    expect(sanitizeBarcodeInput("  " + "1".repeat(101) + "  ")).toBeNull();
  });
});

describe("sanitizeVoiceTranscript", () => {
  it("accepts valid transcript", () => {
    expect(sanitizeVoiceTranscript("apple")).toBe("apple");
  });

  it("returns null for empty string", () => {
    expect(sanitizeVoiceTranscript("")).toBeNull();
  });

  it("returns null for string exceeding 200 chars", () => {
    expect(sanitizeVoiceTranscript("a".repeat(201))).toBeNull();
  });

  it("accepts string exactly 200 chars", () => {
    expect(sanitizeVoiceTranscript("a".repeat(200))).toBe("a".repeat(200));
  });

  it("strips control characters", () => {
    expect(sanitizeVoiceTranscript("hello\x00world")).toBe("helloworld");
  });

  it("collapses multiple spaces into one", () => {
    expect(sanitizeVoiceTranscript("apple   juice")).toBe("apple juice");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeVoiceTranscript("  apple  ")).toBe("apple");
  });

  it("returns null if result is empty after stripping", () => {
    expect(sanitizeVoiceTranscript("\x00\x01")).toBeNull();
  });
});

describe("fuzzyMatchFoodName", () => {
  const corpus = [
    { name: "Apple" },
    { name: "Apple Juice" },
    { name: "Banana" },
    { name: "Greek Yogurt" },
    { name: "Chicken Breast" },
  ];

  it("returns empty array for empty query", () => {
    expect(fuzzyMatchFoodName("", corpus)).toStrictEqual([]);
  });

  it("returns empty array for empty corpus", () => {
    expect(fuzzyMatchFoodName("apple", [])).toStrictEqual([]);
  });

  it("returns exact match first", () => {
    const results = fuzzyMatchFoodName("apple", corpus);
    expect(results[0]!.name).toBe("Apple");
  });

  it("is case-insensitive", () => {
    const results = fuzzyMatchFoodName("APPLE", corpus);
    expect(results[0]!.name).toBe("Apple");
  });

  it("matches substrings", () => {
    const results = fuzzyMatchFoodName("apple", corpus);
    const names = results.map((r) => r.name);
    expect(names).toContain("Apple Juice");
  });

  it("returns no more than limit results", () => {
    const results = fuzzyMatchFoodName("apple", corpus, 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("returns empty array when nothing matches", () => {
    const results = fuzzyMatchFoodName("zzzzz", corpus);
    expect(results).toStrictEqual([]);
  });

  it("default limit is 3", () => {
    const large = Array.from({ length: 10 }, (_, i) => ({ name: `apple ${i}` }));
    const results = fuzzyMatchFoodName("apple", large);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

describe("isFoodItemId", () => {
  it("accepts positive number", () => {
    expect(isFoodItemId(1)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isFoodItemId(0)).toBe(false);
  });

  it("rejects negative number", () => {
    expect(isFoodItemId(-1)).toBe(false);
  });

  it("rejects string", () => {
    expect(isFoodItemId("1")).toBe(false);
  });
});

describe("isUserId", () => {
  it("accepts non-empty string", () => {
    expect(isUserId("abc")).toBe(true);
  });

  it("accepts single character", () => {
    expect(isUserId("a")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isUserId("")).toBe(false);
  });

  it("rejects number", () => {
    expect(isUserId(1)).toBe(false);
  });
});

describe("isRecipeId", () => {
  it("accepts positive number", () => {
    expect(isRecipeId(5)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isRecipeId(0)).toBe(false);
  });

  it("rejects negative number", () => {
    expect(isRecipeId(-5)).toBe(false);
  });

  it("rejects string", () => {
    expect(isRecipeId("5")).toBe(false);
  });
});

describe("isISODate", () => {
  it("accepts valid ISO date", () => {
    expect(isISODate("2026-04-28")).toBe(true);
  });

  it("rejects single digit month", () => {
    expect(isISODate("2026-4-28")).toBe(false);
  });

  it("rejects single digit day", () => {
    expect(isISODate("2026-04-8")).toBe(false);
  });

  it("rejects non-date string", () => {
    expect(isISODate("not-a-date")).toBe(false);
  });

  it("rejects non-string", () => {
    expect(isISODate(20260428)).toBe(false);
  });
});

describe("isWaterLogId", () => {
  it("accepts positive integer", () => {
    expect(isWaterLogId(1)).toBe(true);
  });

  it("rejects float", () => {
    expect(isWaterLogId(1.5)).toBe(false);
  });

  it("rejects unsafe integer", () => {
    expect(isWaterLogId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isWaterLogId(0)).toBe(false);
  });

  it("rejects negative", () => {
    expect(isWaterLogId(-1)).toBe(false);
  });
});

describe("isBodyMeasurementId", () => {
  it("accepts positive integer", () => {
    expect(isBodyMeasurementId(1)).toBe(true);
  });

  it("rejects float", () => {
    expect(isBodyMeasurementId(1.5)).toBe(false);
  });

  it("rejects unsafe integer", () => {
    expect(isBodyMeasurementId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isBodyMeasurementId(0)).toBe(false);
  });
});

describe("isUserAchievementId", () => {
  it("accepts positive integer", () => {
    expect(isUserAchievementId(1)).toBe(true);
  });

  it("rejects float", () => {
    expect(isUserAchievementId(1.5)).toBe(false);
  });

  it("rejects unsafe integer", () => {
    expect(isUserAchievementId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isUserAchievementId(0)).toBe(false);
  });
});

describe("isStepLogId", () => {
  it("accepts positive integer", () => {
    expect(isStepLogId(1)).toBe(true);
  });

  it("rejects float", () => {
    expect(isStepLogId(1.5)).toBe(false);
  });

  it("rejects unsafe integer", () => {
    expect(isStepLogId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isStepLogId(0)).toBe(false);
  });
});

describe("computeStreaks", () => {
  it("returns zeros for empty input", () => {
    expect(computeStreaks([])).toStrictEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("counts consecutive days correctly for longest streak", () => {
    const dates = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-05"];
    const { longestStreak } = computeStreaks(dates);
    expect(longestStreak).toBe(3);
  });

  it("counts a single date as longestStreak of 1", () => {
    const { longestStreak } = computeStreaks(["2026-04-01"]);
    expect(longestStreak).toBe(1);
  });

  it("handles duplicate dates without inflating streak", () => {
    const dates = ["2026-04-01", "2026-04-01", "2026-04-02"];
    const { longestStreak } = computeStreaks(dates);
    expect(longestStreak).toBe(2);
  });

  it("identifies the longest run among multiple runs", () => {
    const dates = [
      "2026-03-01",
      "2026-03-02",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
      "2026-04-13",
    ];
    const { longestStreak } = computeStreaks(dates);
    expect(longestStreak).toBe(4);
  });

  it("returns currentStreak 0 when last log is more than 1 day ago", () => {
    const old = "2020-01-01";
    const { currentStreak } = computeStreaks([old]);
    expect(currentStreak).toBe(0);
  });

  it("counts currentStreak when logs include today", () => {
    const today = new Date().toISOString().split("T")[0]!;
    const dates = [
      new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split("T")[0]!,
      new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]!,
      today,
    ];
    const { currentStreak } = computeStreaks(dates);
    expect(currentStreak).toBeGreaterThan(0);
  });

  it("correctly computes currentStreak with yesterday and today", () => {
    const today = new Date().toISOString().split("T")[0]!;
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split("T")[0]!;
    const { currentStreak } = computeStreaks([yesterday, today]);
    expect(currentStreak).toBeGreaterThan(0);
  });
});

describe("fuzzyMatchFoodName edge cases", () => {
  const corpus = [{ name: "Apple" }, { name: "Apple Juice" }, { name: "Banana" }];

  it("matches when query is substring of name", () => {
    const results = fuzzyMatchFoodName("apple", corpus);
    expect(results.map((r) => r.name)).toContain("Apple");
  });

  it("matches when name is substring of query", () => {
    const results = fuzzyMatchFoodName("apple juice blend", corpus);
    expect(results.map((r) => r.name)).toContain("Apple Juice");
  });

  it("matches substring containment when query contains name", () => {
    const results = fuzzyMatchFoodName("fresh apple juice", corpus);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("assertDefined", () => {
  it("does not throw for defined value", () => {
    const value: string | undefined = "test";
    expect(() => assertDefined(value, "Should be defined")).not.toThrow();
  });

  it("throws for undefined value", () => {
    const value: string | undefined = undefined;
    expect(() => assertDefined(value, "Value is undefined")).toThrow("Value is undefined");
  });

  it("throws for null value", () => {
    const value: string | null = null;
    expect(() => assertDefined(value, "Value is null")).toThrow("Value is null");
  });

  it("throws with custom message", () => {
    const value: number | null = null;
    expect(() => assertDefined(value, "Custom error message")).toThrow("Custom error message");
  });
});

describe("isWeightUnit", () => {
  it("accepts kg", () => {
    expect(isWeightUnit("kg")).toBe(true);
  });

  it("accepts lb", () => {
    expect(isWeightUnit("lb")).toBe(true);
  });

  it("rejects invalid unit", () => {
    expect(isWeightUnit("g")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isWeightUnit("")).toBe(false);
  });
});

describe("isLengthUnit", () => {
  it("accepts cm", () => {
    expect(isLengthUnit("cm")).toBe(true);
  });

  it("accepts in", () => {
    expect(isLengthUnit("in")).toBe(true);
  });

  it("rejects invalid unit", () => {
    expect(isLengthUnit("m")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isLengthUnit("")).toBe(false);
  });
});

describe("isDietProfileId", () => {
  it("accepts positive integer", () => {
    expect(isDietProfileId(1)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isDietProfileId(0)).toBe(false);
  });

  it("rejects float", () => {
    expect(isDietProfileId(1.5)).toBe(false);
  });

  it("rejects string", () => {
    expect(isDietProfileId("1")).toBe(false);
  });

  it("rejects negative", () => {
    expect(isDietProfileId(-1)).toBe(false);
  });
});

describe("isRecurringMealId", () => {
  it("accepts positive integer", () => {
    expect(isRecurringMealId(5)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isRecurringMealId(0)).toBe(false);
  });

  it("rejects float", () => {
    expect(isRecurringMealId(2.2)).toBe(false);
  });

  it("rejects null", () => {
    expect(isRecurringMealId(null)).toBe(false);
  });
});

describe("checkFoodNameRestrictions", () => {
  it("returns empty array when no restrictions", () => {
    expect(checkFoodNameRestrictions("Chicken Salad", [])).toStrictEqual([]);
  });

  it("detects dairy keyword", () => {
    const violations = checkFoodNameRestrictions("Cheddar Cheese Burger", ["dairy"]);
    expect(violations).toContain("dairy");
  });

  it("detects gluten keyword", () => {
    const violations = checkFoodNameRestrictions("Whole Wheat Bread", ["gluten"]);
    expect(violations).toContain("gluten");
  });

  it("detects multiple violations", () => {
    const violations = checkFoodNameRestrictions("Cheese Egg Sandwich", ["dairy", "eggs"]);
    expect(violations).toContain("dairy");
    expect(violations).toContain("eggs");
  });

  it("returns empty for non-matching food", () => {
    const violations = checkFoodNameRestrictions("Grilled Chicken", ["dairy", "gluten", "nuts"]);
    expect(violations).toStrictEqual([]);
  });

  it("is case-insensitive", () => {
    const violations = checkFoodNameRestrictions("MILK SHAKE", ["dairy"]);
    expect(violations).toContain("dairy");
  });
});

describe("getTodayDayIndex", () => {
  it("returns 0 for Monday (getDay() === 1)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1)); // January 1, 2024 = Monday (local)
    expect(getTodayDayIndex()).toBe(0);
    vi.useRealTimers();
  });

  it("returns 6 for Sunday (getDay() === 0)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 7)); // January 7, 2024 = Sunday (local)
    expect(getTodayDayIndex()).toBe(6);
    vi.useRealTimers();
  });

  it("returns 4 for Friday (getDay() === 5)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5)); // January 5, 2024 = Friday (local)
    expect(getTodayDayIndex()).toBe(4);
    vi.useRealTimers();
  });
});

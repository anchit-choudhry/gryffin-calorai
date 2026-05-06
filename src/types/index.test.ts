import { describe, expect, it } from "vitest";
import {
  computeStreaks,
  fuzzyMatchFoodName,
  isFoodItemId,
  isISODate,
  isRecipeId,
  isUserId,
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
    expect(fuzzyMatchFoodName("", corpus)).toEqual([]);
  });

  it("returns empty array for empty corpus", () => {
    expect(fuzzyMatchFoodName("apple", [])).toEqual([]);
  });

  it("returns exact match first", () => {
    const results = fuzzyMatchFoodName("apple", corpus);
    expect(results[0].name).toBe("Apple");
  });

  it("is case-insensitive", () => {
    const results = fuzzyMatchFoodName("APPLE", corpus);
    expect(results[0].name).toBe("Apple");
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
    expect(results).toEqual([]);
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

describe("computeStreaks", () => {
  it("returns zeros for empty input", () => {
    expect(computeStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
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
});

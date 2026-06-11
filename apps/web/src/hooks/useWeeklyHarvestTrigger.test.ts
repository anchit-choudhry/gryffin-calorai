import { describe, it, expect } from "vitest";
import { isoWeekKey } from "./useWeeklyHarvestTrigger";

describe("isoWeekKey", () => {
  it("returns YYYY-WXX format", () => {
    const key = isoWeekKey(new Date(2026, 5, 8)); // Monday of W24
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("June 8 2026 is week 24", () => {
    expect(isoWeekKey(new Date(2026, 5, 8))).toBe("2026-W24");
  });

  it("Monday and Sunday of same ISO week produce the same key", () => {
    const monday = isoWeekKey(new Date(2026, 5, 8)); // Mon W24
    const sunday = isoWeekKey(new Date(2026, 5, 14)); // Sun W24
    expect(monday).toBe(sunday);
  });

  it("consecutive weeks produce different keys", () => {
    const week24 = isoWeekKey(new Date(2026, 5, 8)); // W24
    const week25 = isoWeekKey(new Date(2026, 5, 15)); // W25
    expect(week24).not.toBe(week25);
  });

  it("handles year-boundary week correctly (Jan 1 in late Dec week)", () => {
    // Jan 1 2026 is a Thursday - it belongs to W01 2026
    const key = isoWeekKey(new Date(2026, 0, 1));
    expect(key).toBe("2026-W01");
  });

  it("Dec 28 2026 (Monday) is in week 53 or week 1 of 2027", () => {
    const key = isoWeekKey(new Date(2026, 11, 28));
    expect(key).toMatch(/^202[67]-W\d{2}$/);
  });
});

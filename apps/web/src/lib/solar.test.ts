import { describe, expect, it } from "vitest";
import { getDayOfYear, getMoonPhase, getSeason, getSunTimes } from "./solar";

describe("getDayOfYear", () => {
  it("returns 1 for January 1st", () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1);
  });

  it("returns 365 for December 31st in a non-leap year", () => {
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365);
  });

  it("returns 60 for February 29th in a leap year", () => {
    expect(getDayOfYear(new Date(2024, 1, 29))).toBe(60);
  });
});

describe("getSeason", () => {
  it("returns Summer for June in the northern hemisphere", () => {
    expect(getSeason(new Date(2026, 5, 15), "north")).toBe("Summer");
  });

  it("returns Spring for April in the northern hemisphere", () => {
    expect(getSeason(new Date(2026, 3, 15), "north")).toBe("Spring");
  });

  it("returns Autumn for October in the northern hemisphere", () => {
    expect(getSeason(new Date(2026, 9, 15), "north")).toBe("Autumn");
  });

  it("returns Winter for January in the northern hemisphere", () => {
    expect(getSeason(new Date(2026, 0, 15), "north")).toBe("Winter");
  });

  it("returns Winter for June in the southern hemisphere (inverted)", () => {
    expect(getSeason(new Date(2026, 5, 15), "south")).toBe("Winter");
  });
});

describe("getMoonPhase", () => {
  it("returns New Moon label for known new moon date (Jan 2 2022)", () => {
    // Jan 2 2022 was a known new moon
    const result = getMoonPhase(new Date(2022, 0, 2));
    expect(result.label).toBe("New Moon");
    expect(result.emoji).toBe("🌑");
  });

  it("returns Full Moon label for known full moon date (Jan 17 2022)", () => {
    const result = getMoonPhase(new Date(2022, 0, 17));
    expect(result.label).toBe("Full Moon");
    expect(result.emoji).toBe("🌕");
  });

  it("phase is between 0 and 1 for any date", () => {
    const result = getMoonPhase(new Date(2026, 5, 18));
    expect(result.phase).toBeGreaterThanOrEqual(0);
    expect(result.phase).toBeLessThan(1);
  });
});

describe("getSunTimes", () => {
  it("returns sunrise before sunset for London on June 21", () => {
    // London: lat 51.5, lng -0.1; June 21 is near summer solstice
    // Timezone-independent assertion: sunrise always precedes sunset
    const result = getSunTimes(new Date(2026, 5, 21), 51.5, -0.1);
    expect(result).not.toBeNull();
    expect(result!.sunrise < result!.sunset).toBe(true);
  });

  it("returns HH:MM formatted strings for London on June 21", () => {
    const result = getSunTimes(new Date(2026, 5, 21), 51.5, -0.1);
    expect(result).not.toBeNull();
    expect(result!.sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(result!.sunset).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns null when lat is undefined", () => {
    expect(getSunTimes(new Date(2026, 5, 21))).toBeNull();
  });

  it("returns null when lng is undefined", () => {
    expect(getSunTimes(new Date(2026, 5, 21), 51.5)).toBeNull();
  });
});

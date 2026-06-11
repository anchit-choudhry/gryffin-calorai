import { describe, expect, it } from "vitest";
import { CONTEXTUAL_COACHMARKS, TOUR_STEPS, TOUR_TOTAL_STEPS } from "./tourSteps";

const pageContentsMap = import.meta.glob("../../pages/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const pageContents = Object.values(pageContentsMap);

describe("TOUR_STEPS", () => {
  it("has the expected total steps count", () => {
    expect(TOUR_STEPS).toHaveLength(TOUR_TOTAL_STEPS);
  });

  it("every targetId has a corresponding data-tour-id attribute in one of the page files", () => {
    for (const step of TOUR_STEPS) {
      const attr = `data-tour-id="${step.targetId}"`;
      const found = pageContents.some((content) => content.includes(attr));
      expect(found, `data-tour-id="${step.targetId}" not found in any page file`).toBe(true);
    }
  });

  it("all steps have required fields", () => {
    for (const step of TOUR_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.page).toMatch(/^(dashboard|recipes|progress)$/);
      expect(step.targetId).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.body).toBeTruthy();
    }
  });

  it("step ids are unique", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("CONTEXTUAL_COACHMARKS", () => {
  it("is a non-empty array", () => {
    expect(CONTEXTUAL_COACHMARKS).toBeInstanceOf(Array);
    expect(CONTEXTUAL_COACHMARKS.length).toBeGreaterThan(0);
  });

  it("all coachmarks have required fields", () => {
    for (const coachmark of CONTEXTUAL_COACHMARKS) {
      expect(coachmark.id).toBeTruthy();
      expect(coachmark.title).toBeTruthy();
      expect(coachmark.body).toBeTruthy();
    }
  });

  it("coachmark ids are unique", () => {
    const ids = CONTEXTUAL_COACHMARKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

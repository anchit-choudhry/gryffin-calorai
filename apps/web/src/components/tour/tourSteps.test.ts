import { describe, expect, it } from "vitest";
import { TOUR_STEPS, TOUR_TOTAL_STEPS } from "./tourSteps";

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

import { describe, expect, it } from "vitest";
import {
  MAIN_CONTENT_ID,
  assertiveRegionProps,
  liveRegionProps,
  visuallyHiddenProps,
} from "./a11y";

describe("a11y utilities", () => {
  describe("MAIN_CONTENT_ID", () => {
    it("equals 'main'", () => {
      expect(MAIN_CONTENT_ID).toBe("main");
    });
  });

  describe("liveRegionProps", () => {
    it("defaults to polite", () => {
      const props = liveRegionProps();
      expect(props["aria-live"]).toBe("polite");
      expect(props["aria-atomic"]).toBe(true);
      expect(props.role).toBe("status");
    });

    it("respects explicit politeness override", () => {
      expect(liveRegionProps("off")["aria-live"]).toBe("off");
      expect(liveRegionProps("assertive")["aria-live"]).toBe("assertive");
    });
  });

  describe("assertiveRegionProps", () => {
    it("returns assertive aria-live and alert role", () => {
      const props = assertiveRegionProps();
      expect(props["aria-live"]).toBe("assertive");
      expect(props["aria-atomic"]).toBe(true);
      expect(props.role).toBe("alert");
    });
  });

  describe("visuallyHiddenProps", () => {
    it("returns sr-only class", () => {
      expect(visuallyHiddenProps().className).toBe("sr-only");
    });
  });
});

describe("useReducedMotion re-export", () => {
  it("is exported from a11y", async () => {
    const mod = await import("./a11y");
    expect(typeof mod.useReducedMotion).toBe("function");
  });
});

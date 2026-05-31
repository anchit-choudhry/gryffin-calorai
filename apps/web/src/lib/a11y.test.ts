import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  assertiveRegionProps,
  liveRegionProps,
  MAIN_CONTENT_ID,
  useMotionPreset,
  visuallyHiddenProps,
} from "./a11y";

vi.mock("motion/react", () => ({
  useReducedMotion: vi.fn(),
}));

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

describe("useMotionPreset", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns full spatial variants when motion is not reduced", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const { result } = renderHook(() => useMotionPreset("achievementStamp"));
    expect((result.current.hidden as Record<string, unknown>).scale).toBe(0.6);
    expect((result.current.visible as Record<string, unknown>).scale).toBe(1);
  });

  it("returns crossfade-only variants (no spatial transforms) when motion is reduced", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { result } = renderHook(() => useMotionPreset("achievementStamp"));
    expect(result.current.hidden).toStrictEqual({ opacity: 0 });
    expect((result.current.visible as Record<string, unknown>).scale).toBeUndefined();
    expect((result.current.visible as Record<string, unknown>).y).toBeUndefined();
  });

  it("crossfade variant has opacity: 1 in visible state for all preset names", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const presetNames = [
      "pageTransition",
      "dialogOpen",
      "achievementStamp",
      "sectionEntry",
    ] as const;
    for (const name of presetNames) {
      const { result } = renderHook(() => useMotionPreset(name));
      expect((result.current.visible as Record<string, unknown>).opacity).toBe(1);
    }
  });

  it("full pageTransition variant has y offset in hidden state", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const { result } = renderHook(() => useMotionPreset("pageTransition"));
    expect((result.current.hidden as Record<string, unknown>).y).toBeDefined();
  });
});

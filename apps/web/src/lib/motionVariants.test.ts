import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  coachmarkVariants,
  motionTokens,
  pageVariants,
  sectionVariants,
  spotlightVariants,
  useSectionMotion,
} from "./motionVariants";

vi.mock("motion/react", () => ({
  useReducedMotion: vi.fn(),
}));

describe("motionTokens", () => {
  it("exports numeric duration tokens", () => {
    expect(typeof motionTokens.durInstant).toBe("number");
    expect(typeof motionTokens.durState).toBe("number");
    expect(typeof motionTokens.durLayout).toBe("number");
    expect(typeof motionTokens.durEntrance).toBe("number");
  });

  it("exports easing arrays with four numbers", () => {
    expect(motionTokens.easeOutExpo).toHaveLength(4);
    expect(motionTokens.easeOutQuart).toHaveLength(4);
    expect(motionTokens.easeInOut).toHaveLength(4);
  });
});

describe("pageVariants", () => {
  it("has hidden and show states", () => {
    expect(pageVariants.hidden).toBeDefined();
    expect(pageVariants.show).toBeDefined();
  });
});

describe("sectionVariants", () => {
  it("hidden state has opacity 0", () => {
    expect(sectionVariants.hidden.opacity).toBe(0);
  });

  it("show state has opacity 1", () => {
    expect(sectionVariants.show.opacity).toBe(1);
  });
});

describe("coachmarkVariants", () => {
  it("has hidden, show, and exit states", () => {
    expect(coachmarkVariants.hidden).toBeDefined();
    expect(coachmarkVariants.show).toBeDefined();
    expect(coachmarkVariants.exit).toBeDefined();
  });

  it("exit y is negative (exits upward)", () => {
    expect(coachmarkVariants.exit.y).toBeLessThan(0);
  });
});

describe("spotlightVariants", () => {
  it("has hidden, show, and exit states", () => {
    expect(spotlightVariants.hidden).toBeDefined();
    expect(spotlightVariants.show).toBeDefined();
    expect(spotlightVariants.exit).toBeDefined();
  });

  it("hidden state has scale less than 1", () => {
    expect(spotlightVariants.hidden.scale).toBeLessThan(1);
  });
});

describe("useSectionMotion", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns section variants when motion is not reduced", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(false);
    const { result } = renderHook(() => useSectionMotion());
    expect(result.current).toStrictEqual({ variants: sectionVariants });
  });

  it("returns empty object when motion is reduced", async () => {
    const { useReducedMotion } = await import("motion/react");
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { result } = renderHook(() => useSectionMotion());
    expect(result.current).toStrictEqual({});
  });
});

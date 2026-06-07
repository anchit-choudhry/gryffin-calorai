import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WheatSprig } from "./WheatSprig";
import { MoonPhase } from "./MoonPhase";
import { SunRay } from "./SunRay";
import { RuleCorner } from "./RuleCorner";
import { RuleTicks } from "./RuleTicks";
import { SeasonalFlourish } from "./SeasonalFlourish";

describe("Almanac ornament icons", () => {
  it.each([
    ["WheatSprig", WheatSprig],
    ["MoonPhase", MoonPhase],
    ["SunRay", SunRay],
    ["RuleCorner", RuleCorner],
    ["SeasonalFlourish", SeasonalFlourish],
  ] as const)("%s renders as aria-hidden SVG", (_name, Component) => {
    const { container } = render(<Component className="text-ink-soft w-6 h-6" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("WheatSprig accepts className prop", () => {
    const { container } = render(<WheatSprig className="custom-class" />);
    expect(container.querySelector("svg")?.classList.contains("custom-class")).toBe(true);
  });

  it("SeasonalFlourish renders a horizontal ornament (wide viewBox)", () => {
    const { container } = render(<SeasonalFlourish />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 120 24");
  });

  it("RuleCorner renders corner rules", () => {
    const { container } = render(<RuleCorner />);
    const polylines = container.querySelectorAll("polyline");
    expect(polylines).toHaveLength(2);
  });

  describe("RuleTicks", () => {
    it("renders as aria-hidden SVG", () => {
      const { container } = render(<RuleTicks />);
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });

    it("renders the correct number of tick lines (default 5)", () => {
      const { container } = render(<RuleTicks />);
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(5);
    });

    it("renders a custom tick count", () => {
      const { container } = render(<RuleTicks ticks={7} />);
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(7);
    });

    it("accepts className prop", () => {
      const { container } = render(<RuleTicks className="h-3 text-rule" />);
      expect(container.querySelector("svg")?.classList.contains("h-3")).toBe(true);
    });

    it("alternates short and long ticks for typographic scale", () => {
      const { container } = render(<RuleTicks ticks={3} spacing={8} />);
      const lines = Array.from(container.querySelectorAll("line"));
      // Even-indexed (0, 2) are tall; odd-indexed (1) are short.
      const heights = lines.map((l) => {
        const y1 = parseFloat(l.getAttribute("y1") ?? "0");
        const y2 = parseFloat(l.getAttribute("y2") ?? "0");
        return Math.abs(y2 - y1);
      });
      expect(heights[0]).toBeGreaterThan(heights[1] ?? 0);
      expect(heights[2]).toBeGreaterThan(heights[1] ?? 0);
    });
  });
});

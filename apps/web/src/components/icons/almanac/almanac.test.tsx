import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WheatSprig } from "./WheatSprig";
import { MoonPhase } from "./MoonPhase";
import { SunRay } from "./SunRay";
import { RuleCorner } from "./RuleCorner";
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
});

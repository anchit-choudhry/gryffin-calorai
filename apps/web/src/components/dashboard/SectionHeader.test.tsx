import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionHeader from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders the title as an h2", () => {
    render(<SectionHeader title="Today's Log" />);
    expect(screen.getByRole("heading", { level: 2, name: "Today's Log" })).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    render(<SectionHeader title="Diary" subtitle="12 entries" />);
    expect(screen.getByText("12 entries")).toBeTruthy();
  });

  it("does not render subtitle element when omitted", () => {
    render(<SectionHeader title="Diary" />);
    expect(screen.queryByText(/entries/i)).toBeNull();
  });

  it("renders kicker text when provided", () => {
    render(<SectionHeader kicker="Weekly overview" title="The Week in Review" />);
    expect(screen.getByText("Weekly overview")).toBeTruthy();
  });

  it("does not render kicker element when omitted", () => {
    const { container } = render(<SectionHeader title="Diary" />);
    // kicker wrapper has flex items-center — verify no extra div siblings above h2
    const h2 = container.querySelector("h2");
    expect(h2?.parentElement?.children).toHaveLength(1);
  });

  it("applies section variant border-t by default", () => {
    const { container } = render(<SectionHeader title="Log" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border-t");
  });

  it("does not apply border-t for inline variant", () => {
    const { container } = render(<SectionHeader title="Log" variant="inline" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).not.toContain("border-t");
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<SectionHeader title="Log" className="col-span-12" />);
    expect(container.firstElementChild?.className).toContain("col-span-12");
  });

  it("renders RuleTicks ornament when kicker is provided", () => {
    const { container } = render(<SectionHeader kicker="Log" title="Add to Today's Log" />);
    // RuleTicks renders an SVG alongside the kicker text
    const kickerWrapper = container.querySelector(".flex.items-center");
    expect(kickerWrapper).toBeTruthy();
    expect(kickerWrapper?.querySelector("svg")).toBeTruthy();
  });

  it("title uses editorial-serif class", () => {
    const { container } = render(<SectionHeader title="Diary" />);
    const h2 = container.querySelector("h2");
    expect(h2?.className).toContain("editorial-serif");
  });
});

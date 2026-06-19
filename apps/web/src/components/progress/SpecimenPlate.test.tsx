import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { SpecimenPlate } from "./SpecimenPlate";

const achievement = ACHIEVEMENTS[0]!; // streak_3 "Three-Peat", icon "⚡"
const ISO_DATE = "2026-06-01T00:00:00.000Z";

describe("SpecimenPlate - earned", () => {
  it("renders the achievement emoji", () => {
    render(
      <SpecimenPlate
        achievement={achievement}
        plateNum="I"
        isUnlocked={true}
        unlockedAt={ISO_DATE}
      />,
    );
    expect(screen.getAllByText(achievement.icon).length).toBeGreaterThan(0);
  });

  it("renders the roman numeral plate label", () => {
    render(<SpecimenPlate achievement={achievement} plateNum="XIV" isUnlocked={true} />);
    expect(screen.getByText("Plate XIV")).toBeInTheDocument();
  });

  it("renders the formatted unlock date as month + year", () => {
    render(
      <SpecimenPlate
        achievement={achievement}
        plateNum="I"
        isUnlocked={true}
        unlockedAt={ISO_DATE}
      />,
    );
    expect(screen.getByText("Jun 2026")).toBeInTheDocument();
  });

  it("renders the SVG dashed ring", () => {
    const { container } = render(
      <SpecimenPlate achievement={achievement} plateNum="I" isUnlocked={true} />,
    );
    expect(container.querySelector('[stroke-dasharray="3 4"]')).toBeTruthy();
  });
});

describe("SpecimenPlate - unearned", () => {
  it("applies opacity-[0.18] class when not unlocked", () => {
    const { container } = render(
      <SpecimenPlate achievement={achievement} plateNum="I" isUnlocked={false} />,
    );
    expect(container.firstChild).toHaveClass("opacity-[0.18]");
  });

  it("does not render the unlock date when locked", () => {
    render(
      <SpecimenPlate
        achievement={achievement}
        plateNum="I"
        isUnlocked={false}
        unlockedAt={ISO_DATE}
      />,
    );
    expect(screen.queryByText("Jun 2026")).toBeNull();
  });

  it("renders the achievement title when locked", () => {
    render(<SpecimenPlate achievement={achievement} plateNum="I" isUnlocked={false} />);
    expect(screen.getByText(achievement.title)).toBeInTheDocument();
  });

  it("still renders the SVG dashed ring when locked", () => {
    const { container } = render(
      <SpecimenPlate achievement={achievement} plateNum="I" isUnlocked={false} />,
    );
    expect(container.querySelector('[stroke-dasharray="3 4"]')).toBeTruthy();
  });
});

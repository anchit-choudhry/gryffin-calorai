import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { WaterTideWeek } from "./WaterTideWeek";

const BASE_LABELS = ["06-13", "06-14", "06-15", "06-16", "06-17", "06-18", "06-19"];
const TODAY = "06-19";

describe("WaterTideWeek", () => {
  it("renders 7 bar columns", () => {
    const { container } = render(
      <WaterTideWeek
        data={[100, 200, 300, 400, 500, 600, 700]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    expect(container.querySelectorAll('[data-testid="week-bar"]')).toHaveLength(7);
  });

  it("today column has persimmon fill; other columns have ink fill", () => {
    const { container } = render(
      <WaterTideWeek
        data={[100, 100, 100, 100, 100, 100, 100]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    const bars = container.querySelectorAll('[data-testid="week-bar"]');
    expect((bars[6] as HTMLElement).className).toContain("bg-persimmon");
    expect((bars[0] as HTMLElement).className).toContain("bg-ink");
  });

  it("today label span has persimmon color class; other spans have ink-soft class", () => {
    const { container } = render(
      <WaterTideWeek
        data={[0, 0, 0, 0, 0, 0, 0]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    const spans = container.querySelectorAll("span.font-mono");
    expect((spans[6] as HTMLElement).className).toContain("text-persimmon");
    expect((spans[0] as HTMLElement).className).toContain("text-ink-soft");
  });

  it("zero data renders bars with 0% height", () => {
    const { container } = render(
      <WaterTideWeek
        data={[0, 0, 0, 0, 0, 0, 0]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    const bars = container.querySelectorAll('[data-testid="week-bar"]');
    expect((bars[0] as HTMLElement).style.height).toBe("0%");
    expect((bars[3] as HTMLElement).style.height).toBe("0%");
  });

  it("data equal to goal renders 100% height bar", () => {
    const { container } = render(
      <WaterTideWeek
        data={[0, 0, 0, 0, 0, 0, 2000]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    const bars = container.querySelectorAll('[data-testid="week-bar"]');
    expect((bars[6] as HTMLElement).style.height).toBe("100%");
  });

  it("data exceeding goal clamps bar height to 100%", () => {
    const { container } = render(
      <WaterTideWeek
        data={[0, 0, 0, 0, 0, 0, 5000]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    const bars = container.querySelectorAll('[data-testid="week-bar"]');
    expect((bars[6] as HTMLElement).style.height).toBe("100%");
  });

  it("isLoading renders 7 skeleton columns without week-bar elements", () => {
    const { container } = render(
      <WaterTideWeek data={[]} labels={[]} goalMl={2000} todayLabel={TODAY} isLoading={true} />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
    expect(container.querySelectorAll('[data-testid="week-bar"]')).toHaveLength(0);
  });

  it("isLoading false renders actual bars and no skeleton columns", () => {
    const { container } = render(
      <WaterTideWeek
        data={[100, 200, 300, 400, 500, 600, 700]}
        labels={BASE_LABELS}
        goalMl={2000}
        todayLabel={TODAY}
        isLoading={false}
      />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="week-bar"]')).toHaveLength(7);
  });
});

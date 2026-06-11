import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import EditorialChartCard from "./EditorialChartCard";

describe("EditorialChartCard", () => {
  it("renders children by default", () => {
    render(
      <EditorialChartCard>
        <span>chart content</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("chart content")).toBeTruthy();
  });

  it("renders label when provided", () => {
    render(
      <EditorialChartCard label="Weight Trend">
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("Weight Trend")).toBeTruthy();
  });

  it("does not render label section when label is omitted", () => {
    render(
      <EditorialChartCard>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.queryByText("Weight Trend")).toBeNull();
  });

  it("applies raised background class when raised is true", () => {
    const { container } = render(
      <EditorialChartCard raised>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(container.firstElementChild?.className).toContain("bg-paper-raised");
  });

  it("does not apply raised background class when raised is false", () => {
    const { container } = render(
      <EditorialChartCard>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(container.firstElementChild?.className).not.toContain("bg-paper-raised");
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <EditorialChartCard isLoading>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.queryByText("chart")).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows default empty message when isEmpty is true", () => {
    render(
      <EditorialChartCard isEmpty>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("No data yet.")).toBeTruthy();
  });

  it("shows custom empty message when isEmpty and emptyMessage are provided", () => {
    render(
      <EditorialChartCard isEmpty emptyMessage="No measurements logged.">
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("No measurements logged.")).toBeTruthy();
  });

  it("renders children over isEmpty state when isLoading is true", () => {
    const { container } = render(
      <EditorialChartCard isLoading isEmpty>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
    expect(screen.queryByText("No data yet.")).toBeNull();
  });

  it("uses provided height for the inner container", () => {
    const { container } = render(
      <EditorialChartCard height={200}>
        <span>chart</span>
      </EditorialChartCard>,
    );
    const inner = container.querySelector("[style]");
    expect(inner?.getAttribute("style")).toContain("200");
  });

  it("renders eyebrow text when provided", () => {
    render(
      <EditorialChartCard eyebrow="Last 30 days">
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("Last 30 days")).toBeTruthy();
  });

  it("does not render eyebrow section when eyebrow is omitted", () => {
    render(
      <EditorialChartCard>
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.queryByText("Last 30 days")).toBeNull();
  });

  it("renders both eyebrow and label together", () => {
    render(
      <EditorialChartCard eyebrow="12 entries" label="Weight Trajectory">
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(screen.getByText("12 entries")).toBeTruthy();
    expect(screen.getByText("Weight Trajectory")).toBeTruthy();
  });

  it("renders header when only eyebrow is provided (no label)", () => {
    const { container } = render(
      <EditorialChartCard eyebrow="Meta only">
        <span>chart</span>
      </EditorialChartCard>,
    );
    expect(container.querySelector(".border-b")).toBeTruthy();
    expect(screen.getByText("Meta only")).toBeTruthy();
  });
});

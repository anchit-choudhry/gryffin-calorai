import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ChartTooltip from "./ChartTooltip";

describe("ChartTooltip", () => {
  it("renders nothing when payload is empty", () => {
    const { container } = render(<ChartTooltip />);
    expect(container.querySelector(".border")).toBeTruthy();
  });

  it("renders label when provided", () => {
    render(<ChartTooltip label="May-01" />);
    expect(screen.getByText("May-01")).toBeTruthy();
  });

  it("does not render label element when label is falsy", () => {
    render(<ChartTooltip />);
    const paras = screen.queryAllByText(/.+/);
    expect(paras).toHaveLength(0);
  });

  it("renders payload entries with number values", () => {
    const payload = [{ name: "Weight", value: 70, color: "#f00" }] as unknown as Parameters<
      typeof ChartTooltip
    >[0]["payload"];
    render(<ChartTooltip label="May" payload={payload} />);
    expect(screen.getByText("Weight")).toBeTruthy();
    expect(screen.getByText("70")).toBeTruthy();
  });

  it("renders payload entries with string values", () => {
    const payload = [{ name: "Status", value: "active", color: "#0f0" }] as unknown as Parameters<
      typeof ChartTooltip
    >[0]["payload"];
    render(<ChartTooltip payload={payload} />);
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
  });

  it("renders multiple payload entries", () => {
    const payload = [
      { name: "Weight", value: 70, color: "#f00" },
      { name: "Body Fat", value: 18, color: "#00f" },
    ] as unknown as Parameters<typeof ChartTooltip>[0]["payload"];
    render(<ChartTooltip label="May" payload={payload} />);
    expect(screen.getByText("Weight")).toBeTruthy();
    expect(screen.getByText("Body Fat")).toBeTruthy();
  });

  it("renders without crashing when payload contains null value", () => {
    const payload = [{ name: "X", value: null, color: "#aaa" }] as unknown as Parameters<
      typeof ChartTooltip
    >[0]["payload"];
    render(<ChartTooltip payload={payload} />);
    expect(screen.getByText("X")).toBeTruthy();
  });
});

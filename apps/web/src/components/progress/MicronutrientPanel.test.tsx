import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MicronutrientPanel from "./MicronutrientPanel";
import type { MicronutrientChartEntry } from "../../hooks/useMicronutrientData";

const mockHasData = vi.hoisted(() => ({ value: false }));
const mockIsPersonalized = vi.hoisted(() => ({ value: false }));
const mockChartData = vi.hoisted<{ value: MicronutrientChartEntry[] }>(() => ({
  value: [
    { name: "Vitamin C", pct: 50, value: 45, unit: "mg", rda: 90 },
    { name: "Calcium", pct: 23, value: 299, unit: "mg", rda: 1300 },
    { name: "Iron", pct: 67, value: 12, unit: "mg", rda: 18 },
    { name: "Fiber", pct: 36, value: 10, unit: "g", rda: 28 },
    { name: "Sodium", pct: 52, value: 1196, unit: "mg", rda: 2300 },
  ],
}));

vi.mock("../../hooks/useMicronutrientData", () => ({
  useMicronutrientData: () => ({
    chartData: mockChartData.value,
    hasData: mockHasData.value,
    isPersonalized: mockIsPersonalized.value,
  }),
}));

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
}));

vi.mock("../charts/EditorialChartCard", () => ({
  default: ({
    children,
    isEmpty,
    emptyMessage,
    label,
  }: {
    children: React.ReactNode;
    isEmpty?: boolean;
    emptyMessage?: string;
    label?: string;
  }) =>
    isEmpty ? (
      <div data-testid="empty-card">{emptyMessage}</div>
    ) : (
      <div data-testid="chart-card">
        {label && <span data-testid="chart-label">{label}</span>}
        {children}
      </div>
    ),
}));

vi.mock("../charts/ChartTooltip", () => ({ default: () => null }));

describe("MicronutrientPanel", () => {
  beforeEach(() => {
    mockHasData.value = false;
    mockIsPersonalized.value = false;
  });

  it("shows empty state message when no data logged", () => {
    render(<MicronutrientPanel />);
    expect(screen.getByTestId("empty-card")).toBeTruthy();
    expect(
      screen.getByText("Log foods with micronutrient data to see your coverage."),
    ).toBeTruthy();
  });

  it("renders the chart card when data is present", () => {
    mockHasData.value = true;
    render(<MicronutrientPanel />);
    expect(screen.getByTestId("chart-card")).toBeTruthy();
  });

  it("shows the 'Today vs. Daily Value' label when not personalized", () => {
    mockHasData.value = true;
    render(<MicronutrientPanel />);
    expect(screen.getByTestId("chart-label").textContent).toBe("Today vs. Daily Value");
  });

  it("shows the personalized label when isPersonalized is true", () => {
    mockHasData.value = true;
    mockIsPersonalized.value = true;
    render(<MicronutrientPanel />);
    expect(screen.getByTestId("chart-label").textContent).toBe(
      "Today vs. Daily Value (personalized)",
    );
  });

  it("renders the recharts BarChart when data is present", () => {
    mockHasData.value = true;
    render(<MicronutrientPanel />);
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
  });

  it("does not render the chart when no data", () => {
    render(<MicronutrientPanel />);
    expect(screen.queryByTestId("bar-chart")).toBeNull();
  });
});

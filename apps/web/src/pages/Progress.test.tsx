import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { TdeeProfile } from "../db/dbService";
import { UserId } from "@/types";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");

vi.mock("../hooks/useProgressData", () => ({
  useProgressData: () => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [1800, 2100, 1950, 2200, 1750, 2050, 1900],
    rollingAvg: [1900, 1950, 1950, 2000, 1950, 2000, 2000],
    mealTypeData: {
      Breakfast: [400, 450, 420, 500, 380, 430, 410],
      Lunch: [500, 550, 530, 600, 480, 520, 510],
      Snacks: [300, 250, 280, 200, 320, 260, 270],
      Dinner: [600, 850, 720, 900, 570, 840, 710],
    },
    macroData: {
      protein: [80, 90, 85, 95, 75, 88, 82],
      carbs: [200, 220, 210, 240, 190, 215, 205],
      fat: [60, 70, 65, 75, 55, 68, 62],
    },
    isLoading: false,
    allLogs: [],
  }),
}));

vi.mock("../hooks/useWaterHistoryData", () => ({
  useWaterHistoryData: () => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [1500, 1800, 2000, 1700, 1900, 2000, 1600],
    isLoading: false,
  }),
}));

vi.mock("motion/react", () => ({
  motion: {
    main: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  Bar: () => null,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

vi.mock("@/components/ui/tabs", () => {
  let tabsOVC: ((v: string) => void) | undefined;
  let tabsValue = "";
  return {
    Tabs: ({
      children,
      value,
      onValueChange,
    }: {
      children: React.ReactNode;
      value?: string;
      onValueChange?: (v: string) => void;
    }) => {
      tabsOVC = onValueChange;
      tabsValue = value ?? "";
      return <div>{children}</div>;
    },
    TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <button
        type="button"
        role="tab"
        aria-selected={tabsValue === value}
        onClick={() => tabsOVC?.(value)}
      >
        {children}
      </button>
    ),
    TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <div data-state={tabsValue === value ? "active" : "inactive"}>{children}</div>
    ),
  };
});

vi.mock("../components/dashboard/SectionHeader", () => ({
  default: ({ title, subtitle, kicker }: { title: string; subtitle?: string; kicker?: string }) => (
    <>
      {kicker && <span data-testid="section-kicker">{kicker}</span>}
      <h2>{title}</h2>
      {subtitle && <span data-testid="section-subtitle">{subtitle}</span>}
    </>
  ),
}));

vi.mock("../components/charts/EditorialChartCard", () => ({
  default: ({ label, children }: { label: string; children?: React.ReactNode }) => (
    <div>
      {label}
      {children}
    </div>
  ),
}));
vi.mock("../components/charts/ChartTooltip", () => ({ default: () => null }));
vi.mock("../components/charts/ChartLegend", () => ({ default: () => null }));

// ProgressHero: mocked to expose plain buttons for setDays so fireEvent works
// (Radix Tabs onValueChange does not fire in jsdom)
vi.mock("../components/progress/ProgressHero", () => ({
  default: ({ setDays }: { days: 7 | 30; setDays: (d: 7 | 30) => void }) => (
    <div data-testid="progress-hero">
      <button type="button" onClick={() => setDays(7)}>
        7 days
      </button>
      <button type="button" onClick={() => setDays(30)}>
        30 days
      </button>
    </div>
  ),
}));

vi.mock("../components/progress/AdaptiveTdeePanel", () => ({
  AdaptiveTdeePanel: () => <div>AdaptiveTdeePanel</div>,
}));
vi.mock("../components/progress/CorrelationInsightsPanel", () => ({
  CorrelationInsightsPanel: () => <div>CorrelationInsightsPanel</div>,
}));
vi.mock("../components/progress/EnergyForecastCard", () => ({
  EnergyForecastCard: () => <div>EnergyForecastCard</div>,
}));
vi.mock("../components/progress/ProjectedWeightCard", () => ({
  default: () => <div>ProjectedWeightCard</div>,
}));
vi.mock("../components/progress/MicronutrientPanel", () => ({
  default: () => <div>MicronutrientPanel</div>,
}));
vi.mock("../components/progress/MicronutrientHeatmap", () => ({
  MicronutrientHeatmap: () => <div>MicronutrientHeatmap</div>,
}));
vi.mock("../components/progress/PhenologyWheel", () => ({
  PhenologyWheel: () => <div>PhenologyWheel</div>,
}));
vi.mock("../components/progress/SpecimenPlate", () => ({
  SpecimenPlate: () => <div>SpecimenPlate</div>,
}));
vi.mock("../components/BodyMeasurements", () => ({
  default: () => <div>BodyMeasurements</div>,
}));
vi.mock("@/components/illustrations", () => ({
  BodyScale: () => null,
}));

vi.mock("../lib/motionVariants", () => ({
  pageVariants: {},
  useSectionMotion: () => ({}),
}));
vi.mock("../lib/adaptiveTdee", () => ({
  computeWeightForecast: () => [],
}));

const userId = UserId("u1");

function makeMock(
  overrides: Partial<ReturnType<typeof appState.useAppState>> = {},
): ReturnType<typeof appState.useAppState> {
  return {
    init: {
      status: "ready",
      user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
    },
    waterGoalMl: 2000,
    bodyMeasurements: [],
    unlockedAchievements: [],
    allActivityLogs: [],
    fastingHistory: [],
    tdeeProfile: null,
    dailyLogs: [],
    dailyWaterLogs: [],
    dailyStepLogs: [],
    dailyActivityLogs: [],
    activeFastingSession: null,
    favoriteFoods: [],
    allFoodItems: [],
    userId,
    deleteFoodLog: vi.fn(),
    toggleFavorite: vi.fn(),
    addFoodLog: vi.fn(),
    openQuickAdd: vi.fn(),
    copyYesterdayLogs: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof appState.useAppState>;
}

beforeEach(() => {
  history.replaceState(null, "", "#progress");
  vi.mocked(appState.useAppState).mockReturnValue(makeMock());
});

describe("Progress - Macro Nutrient Trends range consistency", () => {
  it("renders the section at 7 days (default)", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Macro Nutrient Trends")).toBeInTheDocument();
  });

  it("renders the section at 30 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(screen.getByText("Macro Nutrient Trends")).toBeInTheDocument();
  });

  it("does not show '7-day only' subtitle at 7 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.queryAllByText("7-day only")).toHaveLength(0);
  });

  it("does not show '7-day only' subtitle at 30 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(screen.queryAllByText("7-day only")).toHaveLength(0);
  });

  it("uses stacked AreaChart at 30 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    const macroSection = screen.getByRole("figure", {
      name: /macro nutrient trends/i,
    });
    expect(macroSection.querySelector("[data-testid='area-chart']")).toBeInTheDocument();
  });
});

describe("Progress - Calorie Distribution range consistency", () => {
  it("renders the section at 7 days (default)", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("Calorie Distribution")).toBeInTheDocument();
  });

  it("renders the section at 30 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(screen.getByText("Calorie Distribution")).toBeInTheDocument();
  });

  it("shows PieChart at 7 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    const distSection = screen.getByRole("figure", {
      name: /calorie distribution/i,
    });
    expect(distSection.querySelector("[data-testid='pie-chart']")).toBeInTheDocument();
  });

  it("shows AreaChart (not PieChart) at 30 days", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    const distSection = screen.getByRole("figure", {
      name: /calorie distribution/i,
    });
    expect(distSection.querySelector("[data-testid='area-chart']")).toBeInTheDocument();
    expect(distSection.querySelector("[data-testid='pie-chart']")).not.toBeInTheDocument();
  });
});

describe("Progress - page tabs", () => {
  beforeEach(() => {
    history.replaceState(null, "", "#progress");
  });

  it("renders four tab triggers", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("tab", { name: "Nutrition" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Body" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plates" })).toBeInTheDocument();
  });

  it("defaults to Nutrition - Nutrition tab trigger is selected", async () => {
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Daily Calorie Trend" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Nutrition" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Plates" })).toHaveAttribute("aria-selected", "false");
  });

  it("reads ?tab=body from hash and selects the Body tab trigger", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Body Measurements" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Body" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Nutrition" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("reads ?tab=activity from hash and selects the Activity tab trigger", async () => {
    history.replaceState(null, "", "#progress?tab=activity");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Nutrition" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("reads ?tab=plates from hash and selects the Plates tab trigger", async () => {
    history.replaceState(null, "", "#progress?tab=plates");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Specimen Plates" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plates" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Nutrition" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("clicking Body tab calls history.replaceState with ?tab=body", async () => {
    const replaceStateSpy = vi.spyOn(history, "replaceState");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    fireEvent.click(screen.getByRole("tab", { name: "Body" }));
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#progress?tab=body");
  });

  it("falls back to nutrition tab for unrecognised ?tab= value", async () => {
    history.replaceState(null, "", "#progress?tab=invalid");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Daily Calorie Trend" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Nutrition" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Body" })).toHaveAttribute("aria-selected", "false");
  });
});

describe("Progress - Track 3 voice consistency", () => {
  beforeEach(() => {
    history.replaceState(null, "", "#progress");
  });

  it("renders 'Patterns in the Ledger' heading in Body tab (title rename)", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByRole("heading", { name: "Patterns in the Ledger" })).toBeInTheDocument();
  });

  it("does not render 'Correlation Insights' heading after rename", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.queryByRole("heading", { name: "Correlation Insights" })).not.toBeInTheDocument();
  });

  it("shows 'Recalibrated' kicker for Adaptive TDEE in Body tab", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Recalibrated")).toBeInTheDocument();
  });

  it("shows 'Metabolism re-read from recent days' subtitle for Adaptive TDEE", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Metabolism re-read from recent days")).toBeInTheDocument();
  });

  it("shows 'The week ahead' kicker for Energy Forecast in Body tab", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("The week ahead")).toBeInTheDocument();
  });

  it("shows 'Projected energy balance' subtitle for Energy Forecast", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Projected energy balance")).toBeInTheDocument();
  });

  it("shows 'Patterns' kicker for Patterns in the Ledger section", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Patterns")).toBeInTheDocument();
  });

  it("shows 'What moves with what' subtitle for Patterns in the Ledger", async () => {
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("What moves with what")).toBeInTheDocument();
  });

  it("shows 'Trajectory' kicker and subtitle for Weight Projection", async () => {
    vi.mocked(appState.useAppState).mockReturnValue(
      makeMock({
        tdeeProfile: {} as unknown as TdeeProfile,
      }),
    );
    history.replaceState(null, "", "#progress?tab=body");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("Trajectory")).toBeInTheDocument();
    expect(screen.getByText("Where the current trend leads")).toBeInTheDocument();
  });

  it("shows 'The day’s shape' kicker for Calorie Distribution in Activity tab", async () => {
    history.replaceState(null, "", "#progress?tab=activity");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("The day's shape")).toBeInTheDocument();
  });

  it("shows 'When calories land across the day' subtitle for Calorie Distribution", async () => {
    history.replaceState(null, "", "#progress?tab=activity");
    const Progress = (await import("./Progress")).default;
    render(<Progress />);
    expect(screen.getByText("When calories land across the day")).toBeInTheDocument();
  });
});

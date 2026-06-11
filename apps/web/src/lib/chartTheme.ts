export const chartTheme = {
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  chart6: "var(--chart-6)",
  chart7: "var(--chart-7)",
  grid: "var(--chart-grid)",
  goal: "var(--chart-goal)",
  trend: "var(--ink-soft)",
  tooltipBg: "var(--chart-tooltip-bg)",
  tooltipBorder: "var(--chart-tooltip-border)",
  axisFontSize: 11,
  axisFontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
} as const;

export const MEAL_CHART_COLOR: Record<"Breakfast" | "Lunch" | "Snacks" | "Dinner", string> = {
  Breakfast: chartTheme.chart1,
  Lunch: chartTheme.chart2,
  Snacks: chartTheme.chart4,
  Dinner: chartTheme.chart3,
};

export const MACRO_CHART_COLOR = {
  protein: chartTheme.chart1,
  carbs: chartTheme.chart4,
  fat: chartTheme.chart5,
} as const;

export const BODY_CHART_COLOR = {
  weight: chartTheme.chart1,
  bodyFat: chartTheme.chart3,
  waist: chartTheme.chart2,
  chest: chartTheme.chart4,
  hips: chartTheme.chart5,
} as const;

export const TRACKER_CHART_COLOR = {
  water: chartTheme.chart6,
  steps: chartTheme.chart2,
  activity: chartTheme.chart5,
} as const;

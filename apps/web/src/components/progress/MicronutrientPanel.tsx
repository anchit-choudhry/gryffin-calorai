import type { FC } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMicronutrientData } from "../../hooks/useMicronutrientData";
import EditorialChartCard from "../charts/EditorialChartCard";
import ChartTooltip from "../charts/ChartTooltip";
import { chartTheme } from "../../lib/chartTheme";

const AXIS_TICK_STYLE = {
  fill: "var(--ink-soft)",
  fontSize: chartTheme.axisFontSize,
  fontFamily: chartTheme.axisFontFamily,
} as const;

const MicronutrientPanel: FC = () => {
  const { chartData, hasData, isPersonalized } = useMicronutrientData();

  const label = isPersonalized ? "Today vs. Daily Value (personalized)" : "Today vs. Daily Value";

  return (
    <EditorialChartCard
      label={label}
      height={220}
      raised
      isEmpty={!hasData}
      emptyMessage="Log foods with micronutrient data to see your coverage."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 4, right: 40, left: 70, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 150]}
            tick={AXIS_TICK_STYLE}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} width={68} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            x={100}
            stroke={chartTheme.goal}
            strokeDasharray="5 5"
            label={{
              value: "100%",
              position: "top",
              fontSize: 10,
              fill: "var(--ink-soft)",
            }}
          />
          <Bar dataKey="pct" name="% DV" radius={[0, 2, 2, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.pct >= 100 ? chartTheme.chart3 : chartTheme.chart2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </EditorialChartCard>
  );
};

export default MicronutrientPanel;

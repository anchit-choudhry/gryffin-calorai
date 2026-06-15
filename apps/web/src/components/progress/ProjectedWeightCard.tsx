import { useMemo } from "react";
import { Target } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import type { TdeeProfile } from "@/db/dbService";
import { GOAL_LABELS, GOAL_OFFSETS, kgToLb } from "@/types";
import { projectedDateForWeightChange } from "@/lib/tdee";
import { BODY_CHART_COLOR, chartTheme } from "@/lib/chartTheme";
import { useAppState } from "@/state/AppState";

interface ProjectedWeightCardProps {
  tdeeProfile: TdeeProfile;
  weightUnit?: "kg" | "lb";
}

interface WeightPoint {
  d: string;
  actual?: number;
  forecast?: number;
}

function formatProjectedDate(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86400000);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (diffDays <= 7) return `${dateStr} (this week)`;
  if (diffDays <= 30) return `${dateStr} (${Math.round(diffDays / 7)} weeks)`;
  if (diffDays <= 365) return `${dateStr} (~${Math.round(diffDays / 30)} months)`;
  return `${dateStr} (~${(diffDays / 365).toFixed(1)} years)`;
}

const ProjectedWeightCard = ({ tdeeProfile, weightUnit = "kg" }: ProjectedWeightCardProps) => {
  const { bodyMeasurements } = useAppState();
  const { goal, weightKg, targetWeightKg } = tdeeProfile;
  const dailyOffsetKcal = Math.abs(GOAL_OFFSETS[goal]);
  const weeklyRateKg = Math.round(((dailyOffsetKcal * 7) / 7700) * 100) / 100;
  const weeklyRateDisplay =
    weightUnit === "lb" ? Math.round(kgToLb(weeklyRateKg) * 100) / 100 : weeklyRateKg;

  const projection = useMemo(() => {
    if (goal === "maintain" || targetWeightKg === undefined) return null;
    return projectedDateForWeightChange(weightKg, targetWeightKg, dailyOffsetKcal);
  }, [goal, weightKg, targetWeightKg, dailyOffsetKcal]);

  const currentDisplay =
    weightUnit === "lb" ? Math.round(kgToLb(weightKg) * 10) / 10 : Math.round(weightKg * 10) / 10;
  const targetDisplay =
    targetWeightKg !== undefined
      ? weightUnit === "lb"
        ? Math.round(kgToLb(targetWeightKg) * 10) / 10
        : Math.round(targetWeightKg * 10) / 10
      : null;

  const diffKg = targetWeightKg !== undefined ? targetWeightKg - weightKg : null;
  const diffDisplay =
    diffKg !== null
      ? weightUnit === "lb"
        ? Math.round(kgToLb(Math.abs(diffKg)) * 10) / 10
        : Math.round(Math.abs(diffKg) * 10) / 10
      : null;

  const chartData = useMemo((): WeightPoint[] | null => {
    if (goal === "maintain") return null;

    const today = new Date();
    const dailyRateKg = GOAL_OFFSETS[goal] / 7700;

    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 30);
    const cutoffISO = cutoff.toISOString().slice(0, 10);

    const sorted = [...bodyMeasurements]
      .filter(
        (m): m is typeof m & { weight: number } =>
          m.weight !== undefined && m.measuredAt >= cutoffISO,
      )
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

    const byDate = new Map<string, number>();
    for (const m of sorted) {
      const w = weightUnit === "lb" ? kgToLb(m.weight) : m.weight;
      byDate.set(m.measuredAt, Math.round(w * 10) / 10);
    }

    const points = new Map<string, WeightPoint>();

    for (const [date, w] of byDate) {
      points.set(date, { d: date.slice(5), actual: w });
    }

    for (let i = 0; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dISO = d.toISOString().slice(0, 10);
      const projectedKg = weightKg + dailyRateKg * i;
      const displayW = weightUnit === "lb" ? kgToLb(projectedKg) : projectedKg;
      const existing = points.get(dISO);
      if (existing) {
        existing.forecast = Math.round(displayW * 10) / 10;
      } else {
        points.set(dISO, { d: dISO.slice(5), forecast: Math.round(displayW * 10) / 10 });
      }
    }

    return [...points.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [bodyMeasurements, goal, weightKg, weightUnit]);

  const showChart = chartData !== null && chartData.some((p) => p.forecast !== undefined);
  const todayDateStr = new Date().toISOString().slice(5, 10);

  return (
    <div className="border border-rule p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Target className="w-4 h-4 text-persimmon shrink-0" />
        <h3 className="font-sans text-sm font-semibold text-ink">Weight Projection</h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink-soft border border-rule px-2 py-0.5">
          {GOAL_LABELS[goal]}
        </span>
      </div>

      {showChart && chartData && (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: 0,
                  fontFamily: chartTheme.axisFontFamily,
                  fontSize: 11,
                }}
                formatter={(value: unknown) =>
                  typeof value === "number" ? [`${value} ${weightUnit}`, ""] : null
                }
                labelFormatter={(label: unknown) => String(label)}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={BODY_CHART_COLOR.weight}
                strokeWidth={1.5}
                dot={{ r: 2, strokeWidth: 0, fill: BODY_CHART_COLOR.weight }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke={chartTheme.goal}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-1 px-1">
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-ink-soft">
              <span
                className="inline-block w-4 h-px"
                style={{ background: BODY_CHART_COLOR.weight }}
              />
              Actual
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-ink-soft">
              <span
                className="inline-block w-4 h-px border-t border-dashed"
                style={{ borderColor: chartTheme.goal }}
              />
              30-day forecast
            </span>
            <span className="ml-auto font-mono text-[9px] text-ink-soft/60">
              from {todayDateStr}
            </span>
          </div>
        </div>
      )}

      {goal === "maintain" ? (
        <p className="font-sans text-sm text-ink-soft">
          You're set to maintain your current weight of{" "}
          <span className="font-semibold text-ink">
            {currentDisplay} {weightUnit}
          </span>
          . No projection needed.
        </p>
      ) : (
        <div className="divide-y divide-rule border border-rule">
          <div className="flex justify-between px-4 py-3">
            <span className="font-sans text-sm text-ink-soft">Current weight</span>
            <span className="font-mono text-sm text-ink">
              {currentDisplay} {weightUnit}
            </span>
          </div>

          {targetDisplay !== null ? (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">Target weight</span>
              <span className="font-mono text-sm text-ink">
                {targetDisplay} {weightUnit}
              </span>
            </div>
          ) : (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">Target weight</span>
              <span className="font-mono text-sm text-ink-soft italic">
                Set in Settings - Profile
              </span>
            </div>
          )}

          <div className="flex justify-between px-4 py-3">
            <span className="font-sans text-sm text-ink-soft">
              Pace ({goal === "lose" ? "deficit" : "surplus"})
            </span>
            <span className="font-mono text-sm text-ink">
              ~{weeklyRateDisplay} {weightUnit}/week
            </span>
          </div>

          {diffDisplay !== null && projection && (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">
                {diffDisplay} {weightUnit} to go
              </span>
              <span className="font-mono text-sm font-semibold text-persimmon">
                {formatProjectedDate(projection)}
              </span>
            </div>
          )}

          {diffDisplay !== null && !projection && targetWeightKg !== undefined && (
            <div className="px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">
                Target matches current weight - update your goal.
              </span>
            </div>
          )}
        </div>
      )}

      {goal !== "maintain" && targetWeightKg === undefined && (
        <p className="font-sans text-xs text-ink-soft">
          Add a target weight in Settings - Profile to see your projected goal date.
        </p>
      )}
    </div>
  );
};

export default ProjectedWeightCard;

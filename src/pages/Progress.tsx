import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LegendPayload, TooltipContentProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MEAL_TYPES } from "../types";
import { useProgressData } from "../hooks/useProgressData";
import { useAppState } from "../state/AppState";
import BodyMeasurements from "../components/BodyMeasurements";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionHeader from "../components/dashboard/SectionHeader";
import { pageVariants, sectionVariants } from "../lib/motionVariants";

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "#f59e0b",
  Lunch: "#22c55e",
  Snacks: "#a855f7",
  Dinner: "#3b82f6",
};

const ChartTooltip = ({ label, payload }: TooltipContentProps) => (
  <div className="rounded border border-rule bg-paper p-2 text-xs shadow-sm text-ink">
    <p className="mb-1 font-semibold">{label}</p>
    {payload?.map((p) => (
      <p key={p.name} style={{ color: p.color ?? undefined }}>
        {p.name}: {p.value}
      </p>
    ))}
  </div>
);

const ChartLegend = ({ payload }: { payload?: ReadonlyArray<LegendPayload> }) => (
  <ul className="flex flex-wrap justify-center gap-3 pt-1 text-xs">
    {payload?.map((p) => (
      <li key={p.value} className="flex items-center gap-1">
        <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
        {p.value}
      </li>
    ))}
  </ul>
);

const Progress = () => {
  const [days, setDays] = useState<7 | 30>(7);
  const { labels, data, mealTypeData, isLoading } = useProgressData(days);
  const { init } = useAppState();
  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;
  const shouldReduceMotion = useReducedMotion();

  const chartData = useMemo(
    () =>
      labels.map((label, i) => ({
        label,
        calories: data[i] ?? 0,
        ...(mealTypeData
          ? {
              Breakfast: mealTypeData.Breakfast[i] ?? 0,
              Lunch: mealTypeData.Lunch[i] ?? 0,
              Snacks: mealTypeData.Snacks[i] ?? 0,
              Dinner: mealTypeData.Dinner[i] ?? 0,
            }
          : {}),
      })),
    [labels, data, mealTypeData],
  );

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: pageVariants, initial: "hidden", animate: "show" };
  const sv = shouldReduceMotion ? {} : { variants: sectionVariants };

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        {...motionProps}
      >
        {/* Section A — Progress Tracking */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <div className="col-span-12 flex justify-between items-center">
            <SectionHeader kicker="01" title="Progress Tracking" />
            <Tabs
              value={String(days)}
              onValueChange={(v) => {
                const n = Number(v);
                if (n === 7 || n === 30) setDays(n);
              }}
            >
              <TabsList>
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="30">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="col-span-12 text-ink-soft font-mono text-[10px] uppercase tracking-[0.2em]">
              Loading...
            </div>
          ) : (
            <>
              <div className="col-span-12 border border-rule p-6 h-[400px] text-ink-soft">
                <ResponsiveContainer width="100%" height="100%">
                  {days === 7 && mealTypeData !== null ? (
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
                      <YAxis tick={{ fill: "currentColor", fontSize: 12 }} />
                      <Tooltip content={ChartTooltip} />
                      <Legend content={ChartLegend} />
                      <ReferenceLine
                        y={calorieGoal}
                        stroke="rgba(239,68,68,0.7)"
                        strokeDasharray="5 5"
                        label={{
                          value: "Goal",
                          position: "insideTopRight",
                          fontSize: 11,
                          fill: "rgba(239,68,68,0.8)",
                        }}
                      />
                      {MEAL_TYPES.map((mt) => (
                        <Bar key={mt} dataKey={mt} stackId="meals" fill={MEAL_COLORS[mt]} />
                      ))}
                    </ComposedChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
                      <YAxis tick={{ fill: "currentColor", fontSize: 12 }} />
                      <Tooltip content={ChartTooltip} />
                      <Legend content={ChartLegend} />
                      <ReferenceLine
                        y={calorieGoal}
                        stroke="rgba(239,68,68,0.6)"
                        strokeDasharray="5 5"
                        label={{
                          value: "Goal",
                          position: "insideTopRight",
                          fontSize: 11,
                          fill: "rgba(239,68,68,0.8)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="calories"
                        name="Calories Consumed"
                        stroke="rgb(79,70,229)"
                        fill="rgba(79,70,229,0.1)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
              <p className="col-span-12 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                The dashed red line shows your daily calorie goal.
              </p>
            </>
          )}
        </motion.section>

        {/* Section B — Body Measurements */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="02" title="Body Measurements" />
          <div className="col-span-12 border border-rule p-6">
            <BodyMeasurements />
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Progress;

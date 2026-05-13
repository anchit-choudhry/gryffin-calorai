import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LegendPayload, TooltipContentProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cmToIn, MEAL_TYPES } from "@/types";
import { useProgressData } from "../hooks/useProgressData";
import { useWaterHistoryData } from "../hooks/useWaterHistoryData";
import { useAppState } from "../state/AppState";
import BodyMeasurements from "../components/BodyMeasurements";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionHeader from "../components/dashboard/SectionHeader";
import { pageVariants, sectionVariants } from "../lib/motionVariants";
import { ACHIEVEMENTS } from "../lib/achievements";

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
  const [displayUnit, setDisplayUnit] = useState<"cm" | "in">("cm");
  const { labels, data, mealTypeData, macroData, isLoading } = useProgressData(days);
  const {
    labels: waterLabels,
    data: waterData,
    isLoading: waterLoading,
  } = useWaterHistoryData(days);
  const { init, waterGoalMl, bodyMeasurements, unlockedAchievements } = useAppState();
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

  const macroChartData = useMemo(() => {
    if (!macroData) return [];
    return labels.map((label, i) => ({
      label,
      protein: macroData.protein[i] ?? 0,
      carbs: macroData.carbs[i] ?? 0,
      fat: macroData.fat[i] ?? 0,
    }));
  }, [labels, macroData]);

  const waterChartData = useMemo(
    () =>
      waterLabels.map((label, i) => ({
        label,
        water: waterData[i] ?? 0,
      })),
    [waterLabels, waterData],
  );

  const bodyChartData = useMemo(() => {
    return bodyMeasurements.map((m) => ({
      label: m.measuredAt.substring(5),
      bodyFat: m.bodyFat,
      waist: m.waist !== undefined ? (displayUnit === "cm" ? m.waist : cmToIn(m.waist)) : undefined,
      chest: m.chest !== undefined ? (displayUnit === "cm" ? m.chest : cmToIn(m.chest)) : undefined,
      hips: m.hips !== undefined ? (displayUnit === "cm" ? m.hips : cmToIn(m.hips)) : undefined,
    }));
  }, [bodyMeasurements, displayUnit]);

  const pieData = useMemo(() => {
    if (!mealTypeData) return [];
    const totals = MEAL_TYPES.map((mt) => {
      const sum = mealTypeData[mt].reduce((acc, val) => acc + val, 0);
      return { name: mt, value: sum };
    }).filter((d) => d.value > 0);
    return totals;
  }, [mealTypeData]);

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

        {/* Section C — Macro Nutrient Trends */}
        {days === 7 ? (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader className="col-span-12" kicker="03" title="Macro Nutrient Trends" />
            {macroData && !isLoading ? (
              <div className="col-span-12 border border-rule p-6 h-[400px] text-ink-soft">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={macroChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      label={{ value: "(g)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip content={ChartTooltip} />
                    <Legend content={ChartLegend} />
                    <Area
                      type="monotone"
                      dataKey="protein"
                      name="Protein"
                      stroke="var(--persimmon)"
                      fill="var(--persimmon)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="carbs"
                      name="Carbs"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="fat"
                      name="Fat"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </motion.section>
        ) : (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader className="col-span-12" kicker="03" title="Macro Nutrient Trends" />
            <div className="col-span-12 border border-rule p-6 h-[400px] flex items-center justify-center text-ink-soft text-sm">
              Available for 7-day view only. Switch to 7-day tab above.
            </div>
          </motion.section>
        )}

        {/* Section D — Water Intake Trend */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="04" title="Water Intake Trend" />
          {waterLoading ? (
            <div className="col-span-12 text-ink-soft font-mono text-[10px] uppercase tracking-[0.2em]">
              Loading...
            </div>
          ) : (
            <div className="col-span-12 border border-rule p-6 h-[400px] text-ink-soft">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={waterChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    label={{ value: "(ml)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip content={ChartTooltip} />
                  <Legend content={ChartLegend} />
                  <ReferenceLine
                    y={waterGoalMl}
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
                    dataKey="water"
                    name="Water Intake"
                    stroke="var(--persimmon)"
                    fill="var(--persimmon)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.section>

        {/* Section E — Body Composition */}
        {bodyMeasurements.length >= 2 ? (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <div className="col-span-12 flex justify-between items-center">
              <SectionHeader kicker="05" title="Body Composition" />
              <div className="flex gap-2">
                <button
                  onClick={() => setDisplayUnit("cm")}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border ${
                    displayUnit === "cm"
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-ink-soft hover:bg-paper-muted"
                  } transition-colors`}
                >
                  cm
                </button>
                <button
                  onClick={() => setDisplayUnit("in")}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border ${
                    displayUnit === "in"
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-ink-soft hover:bg-paper-muted"
                  } transition-colors`}
                >
                  in
                </button>
              </div>
            </div>
            <div className="col-span-12 border border-rule p-6 h-[400px] text-ink-soft">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <YAxis tick={{ fill: "currentColor", fontSize: 12 }} />
                  <Tooltip content={ChartTooltip} />
                  <Legend content={ChartLegend} />
                  {bodyChartData.some((d) => d.bodyFat !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      name="Body Fat %"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {bodyChartData.some((d) => d.waist !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="waist"
                      name={`Waist (${displayUnit})`}
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {bodyChartData.some((d) => d.chest !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="chest"
                      name={`Chest (${displayUnit})`}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {bodyChartData.some((d) => d.hips !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="hips"
                      name={`Hips (${displayUnit})`}
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        ) : null}

        {/* Section F — Calorie Distribution */}
        {days === 7 ? (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader className="col-span-12" kicker="06" title="Calorie Distribution" />
            {pieData.length > 0 && !isLoading ? (
              <div className="col-span-12 border border-rule p-6 h-[400px] text-ink-soft">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <Tooltip content={ChartTooltip} />
                    <Legend content={ChartLegend} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                      }
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={MEAL_COLORS[entry.name]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </motion.section>
        ) : (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader className="col-span-12" kicker="06" title="Calorie Distribution" />
            <div className="col-span-12 border border-rule p-6 h-[400px] flex items-center justify-center text-ink-soft text-sm">
              Available for 7-day view only. Switch to 7-day tab above.
            </div>
          </motion.section>
        )}

        {/* Section 07 — Achievements */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="07" title="Achievements" />
          <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievements.some(
                (ua) => ua.achievementId === achievement.id,
              );
              const unlockedEntry = unlockedAchievements.find(
                (ua) => ua.achievementId === achievement.id,
              );

              return (
                <motion.div
                  key={achievement.id}
                  className={`border p-4 flex flex-col gap-2 transition-all ${
                    isUnlocked
                      ? "border-ink bg-paper-muted text-ink"
                      : "border-rule/40 bg-paper text-ink-soft opacity-50"
                  }`}
                  whileHover={isUnlocked ? { scale: 1.02 } : undefined}
                >
                  <div className="text-3xl mb-1">{isUnlocked ? achievement.icon : "?"}</div>
                  <h3 className="font-semibold text-sm">{achievement.title}</h3>
                  {!isUnlocked && (
                    <p className="text-xs text-ink-soft">{achievement.description}</p>
                  )}
                  {isUnlocked && unlockedEntry && (
                    <p className="text-xs text-ink-soft">
                      {new Date(unlockedEntry.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="col-span-12 text-sm text-ink-soft text-center border-t border-rule pt-4">
            {unlockedAchievements.length} / {ACHIEVEMENTS.length} achievements unlocked
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Progress;

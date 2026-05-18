import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
import { pageVariants, useSectionMotion } from "../lib/motionVariants";
import { ACHIEVEMENTS } from "../lib/achievements";
import {
  BODY_CHART_COLOR,
  chartTheme,
  MACRO_CHART_COLOR,
  MEAL_CHART_COLOR,
} from "../lib/chartTheme";
import ChartTooltip from "../components/charts/ChartTooltip";
import ChartLegend from "../components/charts/ChartLegend";
import EditorialChartCard from "../components/charts/EditorialChartCard";
import ProgressHero from "../components/progress/ProgressHero";

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
    return MEAL_TYPES.map((mt) => {
      const sum = mealTypeData[mt].reduce((acc, val) => acc + val, 0);
      return { name: mt, value: sum };
    }).filter((d) => d.value > 0);
  }, [mealTypeData]);

  const { avgCalories, avgProtein, avgCarbs, avgFat, daysLogged, daysOnTrack } = useMemo(() => {
    const activeDays = data.filter((v) => v > 0);
    const avg =
      activeDays.length > 0 ? activeDays.reduce((a, b) => a + b, 0) / activeDays.length : 0;
    const tolerance = calorieGoal * 0.1;
    const onTrack = data.filter(
      (v) => v > 0 && v >= calorieGoal - tolerance && v <= calorieGoal + tolerance,
    ).length;

    const avgP = macroData
      ? macroData.protein.reduce((a, b) => a + b, 0) / (activeDays.length || 1)
      : null;
    const avgC = macroData
      ? macroData.carbs.reduce((a, b) => a + b, 0) / (activeDays.length || 1)
      : null;
    const avgF = macroData
      ? macroData.fat.reduce((a, b) => a + b, 0) / (activeDays.length || 1)
      : null;

    return {
      avgCalories: Math.round(avg),
      avgProtein: avgP !== null ? Math.round(avgP) : null,
      avgCarbs: avgC !== null ? Math.round(avgC) : null,
      avgFat: avgF !== null ? Math.round(avgF) : null,
      daysLogged: activeDays.length,
      daysOnTrack: onTrack,
    };
  }, [data, macroData, calorieGoal]);

  const axisTickStyle = {
    fill: "var(--ink-soft)",
    fontSize: chartTheme.axisFontSize,
    fontFamily: chartTheme.axisFontFamily,
  };

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: pageVariants, initial: "hidden", animate: "show" };
  const sv = useSectionMotion();

  const isCaloriesEmpty = chartData.every((d) => d.calories === 0);
  const isMacroEmpty =
    !macroData ||
    (macroData.protein.every((v) => v === 0) &&
      macroData.carbs.every((v) => v === 0) &&
      macroData.fat.every((v) => v === 0));
  const isWaterEmpty = waterData.every((v) => v === 0);

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        {...motionProps}
      >
        {/* Section A - Progress Hero */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6 hero-wash" {...sv}>
          <ProgressHero
            days={days}
            setDays={setDays}
            avgCalories={avgCalories}
            avgProtein={avgProtein}
            avgCarbs={avgCarbs}
            avgFat={avgFat}
            daysLogged={daysLogged}
            daysOnTrack={daysOnTrack}
          />
        </motion.section>

        {/* Section B - Daily Calorie Trend */}
        <motion.section
          data-tour-id="progress-calorie"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader className="col-span-12" title="Daily Calorie Trend" />
          <div
            className="col-span-12"
            role="figure"
            aria-label={`Daily calorie trend chart for the last ${days} days`}
          >
            <EditorialChartCard
              label="Daily Calories"
              height={400}
              raised
              isLoading={isLoading}
              isEmpty={isCaloriesEmpty}
              emptyMessage="No logs in this window. Start logging on the Dashboard."
            >
              <ResponsiveContainer width="100%" height="100%">
                {days === 7 && mealTypeData !== null ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    <ReferenceLine
                      y={calorieGoal}
                      stroke={chartTheme.goal}
                      strokeDasharray="5 5"
                      label={{
                        value: "Goal",
                        position: "insideTopRight",
                        fontSize: 11,
                        fill: "var(--ink-soft)",
                      }}
                    />
                    {MEAL_TYPES.map((mt) => (
                      <Bar key={mt} dataKey={mt} stackId="meals" fill={MEAL_CHART_COLOR[mt]} />
                    ))}
                  </ComposedChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    <ReferenceLine
                      y={calorieGoal}
                      stroke={chartTheme.goal}
                      strokeDasharray="5 5"
                      label={{
                        value: "Goal",
                        position: "insideTopRight",
                        fontSize: 11,
                        fill: "var(--ink-soft)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      name="Calories Consumed"
                      stroke={chartTheme.chart1}
                      fill={chartTheme.chart1}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </EditorialChartCard>
          </div>
          <p className="col-span-12 text-xs text-ink-soft">
            Dashed persimmon line marks your daily goal.
          </p>
          <table className="sr-only col-span-12" aria-label="Daily calorie data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td>{d.calories}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>

        {/* Section C - Body Measurements */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" title="Body Measurements" accent />
          <div className="col-span-12 border border-rule p-6">
            <BodyMeasurements />
          </div>
        </motion.section>

        {/* Section D - Macro Nutrient Trends (7-day only) */}
        {days === 7 && (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader
              className="col-span-12"
              title="Macro Nutrient Trends"
              subtitle="7-day only"
              accent
            />
            <div
              className="col-span-12"
              role="figure"
              aria-label="Macro nutrient trends chart for the last 7 days"
            >
              <EditorialChartCard
                label="Macro Breakdown"
                height={400}
                raised
                isLoading={isLoading}
                isEmpty={isMacroEmpty}
                emptyMessage="Macro breakdown unlocks once you log foods with protein/carbs/fat."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={macroChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={axisTickStyle} />
                    <YAxis
                      tick={axisTickStyle}
                      label={{
                        value: "(g)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--ink-soft)",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    <Area
                      type="monotone"
                      dataKey="protein"
                      name="Protein"
                      stroke={MACRO_CHART_COLOR.protein}
                      fill={MACRO_CHART_COLOR.protein}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="carbs"
                      name="Carbs"
                      stroke={MACRO_CHART_COLOR.carbs}
                      fill={MACRO_CHART_COLOR.carbs}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="fat"
                      name="Fat"
                      stroke={MACRO_CHART_COLOR.fat}
                      fill={MACRO_CHART_COLOR.fat}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </EditorialChartCard>
            </div>
            <table className="sr-only col-span-12" aria-label="Macro nutrient data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Protein (g)</th>
                  <th>Carbs (g)</th>
                  <th>Fat (g)</th>
                </tr>
              </thead>
              <tbody>
                {macroChartData.map((d) => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    <td>{d.protein}</td>
                    <td>{d.carbs}</td>
                    <td>{d.fat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>
        )}

        {/* Section E - Water Intake Trend */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" title="Water Intake Trend" />
          <div
            className="col-span-12"
            role="figure"
            aria-label={`Water intake trend chart for the last ${days} days`}
          >
            <EditorialChartCard
              label="Water Intake"
              height={400}
              raised
              isLoading={waterLoading}
              isEmpty={isWaterEmpty}
              emptyMessage="Log water on the Dashboard to see your trend."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={waterChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="label" tick={axisTickStyle} />
                  <YAxis
                    tick={axisTickStyle}
                    label={{
                      value: "(ml)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--ink-soft)",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<ChartLegend />} />
                  <ReferenceLine
                    y={waterGoalMl}
                    stroke={chartTheme.goal}
                    strokeDasharray="5 5"
                    label={{
                      value: "Goal",
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "var(--ink-soft)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="water"
                    name="Water Intake"
                    stroke={chartTheme.chart2}
                    fill={chartTheme.chart2}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </EditorialChartCard>
          </div>
          <table className="sr-only col-span-12" aria-label="Water intake data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Water (ml)</th>
              </tr>
            </thead>
            <tbody>
              {waterChartData.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td>{d.water}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>

        {/* Section F - Body Composition */}
        {bodyMeasurements.length < 2 ? (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader title="Body Composition" className="col-span-12" accent />
            <div className="col-span-12 border border-rule p-8 flex items-center gap-6">
              <p className="font-sans text-base text-ink-soft">
                Add at least 2 body measurements above to unlock your composition trend.
              </p>
              <span className="text-xs text-ink-soft/50 ml-auto">Log above</span>
            </div>
          </motion.section>
        ) : (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <div className="col-span-12 flex justify-between items-center">
              <SectionHeader title="Body Composition" accent />
              <Tabs
                value={displayUnit}
                onValueChange={(v) => {
                  if (v === "cm" || v === "in") setDisplayUnit(v);
                }}
              >
                <TabsList>
                  <TabsTrigger value="cm">cm</TabsTrigger>
                  <TabsTrigger value="in">in</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="col-span-12" role="figure" aria-label="Body composition trend chart">
              <EditorialChartCard label="Body Composition" height={400} raised>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bodyChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    {bodyChartData.some((d) => d.bodyFat !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        name="Body Fat %"
                        stroke={BODY_CHART_COLOR.bodyFat}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {bodyChartData.some((d) => d.waist !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="waist"
                        name={`Waist (${displayUnit})`}
                        stroke={BODY_CHART_COLOR.waist}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {bodyChartData.some((d) => d.chest !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="chest"
                        name={`Chest (${displayUnit})`}
                        stroke={BODY_CHART_COLOR.chest}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {bodyChartData.some((d) => d.hips !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="hips"
                        name={`Hips (${displayUnit})`}
                        stroke={BODY_CHART_COLOR.hips}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </EditorialChartCard>
            </div>
          </motion.section>
        )}

        {/* Section G - Calorie Distribution (7-day only) */}
        {days === 7 && (
          <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
            <SectionHeader
              className="col-span-12"
              title="Calorie Distribution"
              subtitle="7-day only"
            />
            <div
              className="col-span-12"
              role="figure"
              aria-label="Calorie distribution pie chart by meal type"
            >
              <EditorialChartCard
                label="Meal Distribution"
                height={400}
                raised
                isLoading={isLoading}
                isEmpty={pieData.length === 0}
                emptyMessage="Once you log meals across multiple types, slices appear."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
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
                        <Cell
                          key={entry.name}
                          fill={MEAL_CHART_COLOR[entry.name as keyof typeof MEAL_CHART_COLOR]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </EditorialChartCard>
            </div>
          </motion.section>
        )}

        {/* Section H - Achievements */}
        <motion.section
          data-tour-id="progress-achievements"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader className="col-span-12" title="Achievements" accent />
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
                      ? "border-ink bg-paper-raised text-ink"
                      : "border-rule/40 bg-paper text-ink-soft opacity-60"
                  }`}
                  whileHover={isUnlocked ? { scale: 1.02 } : undefined}
                >
                  <div className={`text-3xl mb-1 ${!isUnlocked ? "grayscale opacity-40" : ""}`}>
                    {achievement.icon}
                  </div>
                  <h3 className="font-sans text-sm font-semibold">{achievement.title}</h3>
                  {!isUnlocked && (
                    <p className="text-xs text-ink-soft">{achievement.description}</p>
                  )}
                  {isUnlocked && unlockedEntry && (
                    <p className="text-xs text-persimmon">
                      {new Date(unlockedEntry.unlockedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="col-span-12 border-t border-rule pt-4 flex items-baseline gap-3 text-xs text-ink-soft">
            Achievements unlocked
            <span className="tabular-nums text-persimmon ml-auto">
              {unlockedAchievements.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Progress;

import { useEffect, useMemo } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useAppState } from "@/state/AppState";
import DateKicker from "@/components/dashboard/DateKicker";
import MacroStat from "@/components/dashboard/MacroStat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motionTokens } from "@/lib/motionVariants";

interface Props {
  days: 7 | 30;
  setDays: (d: 7 | 30) => void;
  avgCalories: number;
  avgProtein: number | null;
  avgCarbs: number | null;
  avgFat: number | null;
  daysLogged: number;
  daysOnTrack: number;
}

function ProgressHero({
  days,
  setDays,
  avgCalories,
  avgProtein,
  avgCarbs,
  avgFat,
  daysLogged,
  daysOnTrack,
}: Props) {
  const { init } = useAppState();
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());
  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(avgCalories);
      return;
    }
    const controls = animate(count, avgCalories, {
      duration: motionTokens.durEntrance,
      ease: motionTokens.easeOutExpo,
    });
    return () => controls.stop();
  }, [avgCalories, shouldReduceMotion, count]);

  return (
    <>
      {/* Vertical date kicker */}
      <div className="col-span-1 hidden md:block">
        <DateKicker date={today} />
      </div>

      {/* Hero numeral */}
      <div className="col-span-12 md:col-span-8 md:col-start-2">
        <div className="flex items-start">
          <motion.span
            className="font-display font-light text-[clamp(72px,11vw,180px)] leading-[0.85] tabular-nums tracking-tight text-ink"
            aria-label={`${Math.round(avgCalories).toLocaleString()} average daily calories`}
          >
            {displayCount}
          </motion.span>
          <span className="font-sans text-xs text-ink-soft self-start mt-3 ml-3">avg kcal</span>
        </div>

        <div className="flex items-baseline gap-6 mt-3">
          <span className="text-xs text-ink-soft">{days}-day average</span>
          <span className="text-xs text-ink-soft">
            {daysLogged} / {days} days logged
          </span>
          <span className="text-xs text-ink-soft">
            {daysOnTrack} days on track{" "}
            <span className="text-ink-soft/50">
              (within 10% of {calorieGoal.toLocaleString()} kcal)
            </span>
          </span>
        </div>
      </div>

      {/* Period selector + meta column */}
      <div className="col-span-12 md:col-span-3 flex flex-col justify-end gap-3 pb-2">
        <Tabs
          value={String(days)}
          onValueChange={(v) => {
            const n = Number(v);
            if (n === 7 || n === 30) setDays(n);
          }}
        >
          <TabsList className="self-start">
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-ink-soft">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Macro averages row */}
      <div className="col-span-12 flex border-y border-rule bg-paper-muted">
        <MacroStat label="Avg Protein" value={avgProtein ?? 0} unit="g" />
        <MacroStat label="Avg Carbs" value={avgCarbs ?? 0} unit="g" />
        <MacroStat label="Avg Fat" value={avgFat ?? 0} unit="g" />
        <MacroStat label="Avg Calories" value={avgCalories} unit="kcal" />
      </div>
    </>
  );
}

ProgressHero.displayName = "ProgressHero";

export default ProgressHero;

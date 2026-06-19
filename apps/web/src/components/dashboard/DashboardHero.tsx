import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/state/AppState";
import { applyPeriodization, computeMacroTargets } from "@/lib/tdee";
import { getMoonPhase } from "@/lib/solar";
import MacroStat from "./MacroStat";
import DateKicker from "./DateKicker";
import { SeasonalOrnament } from "@/components/icons/almanac/SeasonalOrnament";
import { MoonPhase } from "@/components/icons/almanac/MoonPhase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "@/lib/utils";
import { motionTokens } from "@/lib/motionVariants";
import { useFastingTimer } from "@/hooks/useFastingTimer";

interface Props {
  totalCalories: number;
  totals: { protein: number; carbs: number; fat: number };
}

function DashboardHero({ totalCalories, totals }: Props) {
  const {
    init,
    updateCalorieGoal,
    bodyMeasurements,
    dailyActivityLogs,
    activeFastingSession,
    dietProfile,
    customMacroGoals,
    selectedDate,
    toggleTrainingDay,
    isTrainingDay,
  } = useAppState();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(
    init.status === "ready" ? init.user.calorieGoal : 2000,
  );
  const [showNet, setShowNet] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());
  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;
  const { formattedRemaining: fastingRemaining, isComplete: fastingComplete } = useFastingTimer();
  const totalBurned = dailyActivityLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);
  const earnedGoal = calorieGoal + totalBurned;
  const netCalories = Math.max(0, totalCalories - totalBurned);
  const displayCalories = showNet ? netCalories : totalCalories;

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(displayCalories);
      return;
    }
    const controls = animate(count, displayCalories, {
      duration: motionTokens.durEntrance,
      ease: motionTokens.easeOutExpo,
    });
    return () => controls.stop();
  }, [displayCalories, shouldReduceMotion, count]);

  const ratio = Math.min(1, displayCalories / (earnedGoal || 1));
  const isOver = displayCalories > earnedGoal;
  const today = useMemo(() => new Date(), []);

  const trainingDay = isTrainingDay(selectedDate);
  const macroTargets = useMemo(() => {
    if (!dietProfile) return null;
    const base = computeMacroTargets(earnedGoal, dietProfile.preset);
    const periodized = applyPeriodization(base, trainingDay);
    return {
      protein: customMacroGoals?.proteinG ?? periodized.protein,
      carbs: customMacroGoals?.carbsG ?? periodized.carbs,
      fat: customMacroGoals?.fatG ?? periodized.fat,
    };
  }, [earnedGoal, dietProfile, trainingDay, customMacroGoals]);

  const greeting = useMemo(() => {
    const hours = today.getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  }, [today]);

  const latestWeight = useMemo(() => {
    if (bodyMeasurements.length === 0) return null;
    const latest = bodyMeasurements[bodyMeasurements.length - 1];
    return latest?.weight ?? null;
  }, [bodyMeasurements]);

  const username = init.status === "ready" ? init.user.username : "";

  if (init.status === "loading") {
    return (
      <>
        <div className="col-span-1 hidden md:block" aria-hidden="true" />
        <div className="col-span-12 md:col-span-8 md:col-start-2 animate-pulse space-y-5">
          <div className="h-[clamp(72px,11vw,120px)] w-48 bg-rule rounded-sm" />
          <div className="h-[3px] w-full bg-rule" />
          <div className="h-3 w-32 bg-rule rounded-sm" />
        </div>
        <div className="col-span-12 md:col-span-3 animate-pulse space-y-3 pb-2">
          <div className="h-3 w-24 bg-rule rounded-sm" />
          <div className="h-3 w-20 bg-rule rounded-sm" />
          <div className="h-3 w-28 bg-rule rounded-sm" />
        </div>
        <div className="col-span-12 flex border-y border-rule bg-paper-muted animate-pulse">
          {(["Protein", "Carbs", "Fat", "Calories"] as const).map((label) => (
            <div key={label} className="flex-1 px-6 py-4 border-r border-rule last:border-r-0">
              <div className="h-2.5 w-10 bg-rule rounded-sm mb-2" />
              <div className="h-5 w-8 bg-rule rounded-sm" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Vertical date kicker */}
      <div className="col-span-1 hidden md:block">
        <DateKicker date={today} interactive />
      </div>

      {/* Hero numeral */}
      <div className="col-span-12 md:col-span-8 md:col-start-2">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex items-start">
            <motion.span
              className="font-display font-light text-[clamp(72px,11vw,180px)] leading-[0.85] tabular-nums tracking-tight text-ink"
              data-testid="hero-kcal"
            >
              {displayCount}
            </motion.span>
            <span className="font-sans text-xs text-ink-soft self-start mt-3 ml-3">kcal</span>
          </div>
          <div className="flex flex-col gap-2 self-center mt-2">
            {totalBurned > 0 && (
              <button
                type="button"
                onClick={() => setShowNet((v) => !v)}
                className={cn(
                  LABEL_MONO_CLS,
                  "hover:text-ink transition-colors border border-rule px-2 py-1 active:scale-[0.97]",
                )}
              >
                {showNet ? "Consumed" : "Net"}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleTrainingDay(selectedDate)}
              aria-pressed={trainingDay}
              aria-label={trainingDay ? "Mark as rest day" : "Mark as training day"}
              className={cn(
                LABEL_MONO_CLS,
                "border px-2 py-1 active:scale-[0.97] transition-colors",
                trainingDay ? "border-persimmon text-persimmon" : "border-rule hover:text-ink",
              )}
            >
              {trainingDay ? "Training" : "Rest day"}
            </button>
            {activeFastingSession && (
              <span
                className={cn(
                  "font-mono text-[10px] px-2 py-1 border",
                  fastingComplete ? "border-persimmon text-persimmon" : "border-rule text-ink-soft",
                )}
              >
                {activeFastingSession.targetHours}h fast:{" "}
                {fastingComplete ? "complete!" : fastingRemaining}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-[3px] bg-rule mt-5 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-persimmon origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: motionTokens.durLayout, delay: 0.3, ease: "easeOut" }
            }
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-ink-soft">{Math.round(ratio * 100)}% of goal</span>
          {isOver ? (
            <span className="text-xs text-persimmon">
              Over by {(displayCalories - earnedGoal).toLocaleString()} kcal
            </span>
          ) : (
            <span className="text-xs text-ink-soft">
              {Math.max(0, earnedGoal - displayCalories).toLocaleString()} remaining
            </span>
          )}
        </div>
      </div>

      {/* Meta column: seasonal ornament + moon phase + greeting + latest weight + date label + goal editor */}
      <div className="col-span-12 md:col-span-3 flex flex-col justify-end gap-3 pb-2">
        <div className="flex items-center justify-between">
          <SeasonalOrnament date={today} className="h-10 w-auto text-ink-soft opacity-50" />
          <MoonPhase progress={getMoonPhase(today).phase} className="size-5 text-ink-soft/40" />
        </div>
        {username && (
          <p className="text-sm text-ink-soft">
            {greeting}, <span className="text-ink font-semibold">{username}</span>
          </p>
        )}
        {latestWeight !== null && (
          <p className="text-sm text-ink-soft">
            Last weighed{" "}
            <span className="text-ink font-semibold">{latestWeight.toFixed(1)} kg</span>
          </p>
        )}
        <p className="text-sm text-ink-soft">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {editingGoal ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className={cn(EDITORIAL_INPUT_CLS, "w-20")}
              min="1"
              max="99999"
              data-testid="goal-edit"
              autoFocus
            />
            <span className="text-xs text-ink-soft">kcal</span>
            <Button
              variant="ghost"
              onClick={async () => {
                await updateCalorieGoal(goalInput);
                setEditingGoal(false);
                if (goalInput < 1200)
                  toast.warning("Goal seems very low - consider consulting a nutritionist");
                else if (goalInput > 6000)
                  toast.warning("Goal seems high - double-check your entry");
              }}
              className="text-xs text-persimmon hover:text-persimmon/80 rounded-none h-auto p-0"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditingGoal(false)}
              className="text-xs text-ink-soft hover:text-ink rounded-none h-auto p-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors group w-fit rounded-none h-auto p-0"
            onClick={() => {
              setGoalInput(calorieGoal);
              setEditingGoal(true);
            }}
          >
            {totalBurned > 0 ? (
              <>
                Goal: <span className="text-ink tabular-nums">{earnedGoal.toLocaleString()}</span>
                <span className="text-persimmon tabular-nums">
                  (+{totalBurned.toLocaleString()})
                </span>{" "}
                kcal
              </>
            ) : (
              <>Goal: {calorieGoal.toLocaleString()} kcal</>
            )}
            <Pencil className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </Button>
        )}
      </div>

      {/* Macro stats row */}
      <div className="col-span-12 flex border-y border-rule bg-paper-muted">
        <MacroStat label="Protein" value={totals.protein} unit="g" target={macroTargets?.protein} />
        <MacroStat label="Carbs" value={totals.carbs} unit="g" target={macroTargets?.carbs} />
        <MacroStat label="Fat" value={totals.fat} unit="g" target={macroTargets?.fat} />
        <MacroStat label="Calories" value={totalCalories} unit="kcal" />
      </div>
    </>
  );
}

DashboardHero.displayName = "DashboardHero";

export default DashboardHero;

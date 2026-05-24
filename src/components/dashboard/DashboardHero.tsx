import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/state/AppState.ts";
import { computeMacroTargets } from "@/lib/tdee";
import MacroStat from "./MacroStat";
import DateKicker from "./DateKicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "@/lib/utils.ts";
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

  const ratio = Math.min(1, displayCalories / (calorieGoal || 1));
  const isOver = displayCalories > calorieGoal;
  const today = useMemo(() => new Date(), []);

  const macroTargets = useMemo(() => {
    if (!dietProfile) return null;
    return computeMacroTargets(calorieGoal, dietProfile.preset);
  }, [calorieGoal, dietProfile]);

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

  return (
    <>
      {/* Vertical date kicker */}
      <div className="col-span-1 hidden md:block">
        <DateKicker date={today} />
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
              Over by {(displayCalories - calorieGoal).toLocaleString()} kcal
            </span>
          ) : (
            <span className="text-xs text-ink-soft">
              {Math.max(0, calorieGoal - displayCalories).toLocaleString()} remaining
            </span>
          )}
        </div>
      </div>

      {/* Meta column: greeting + latest weight + date label + goal editor */}
      <div className="col-span-12 md:col-span-3 flex flex-col justify-end gap-3 pb-2">
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
            Goal: {calorieGoal.toLocaleString()} kcal
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

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Pencil } from "lucide-react";
import { useAppState } from "@/state/AppState.ts";
import MacroStat from "./MacroStat";
import DateKicker from "./DateKicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils.ts";

interface Props {
  totalCalories: number;
  totals: { protein: number; carbs: number; fat: number };
}

function DashboardHero({ totalCalories, totals }: Props) {
  const { init, updateCalorieGoal, bodyMeasurements } = useAppState();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(
    init.status === "ready" ? init.user.calorieGoal : 2000,
  );
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());
  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(totalCalories);
      return;
    }
    const controls = animate(count, totalCalories, {
      duration: 0.9,
      ease: [0.2, 0, 0.1, 1] as [number, number, number, number],
    });
    return () => controls.stop();
  }, [totalCalories, shouldReduceMotion, count]);

  const ratio = Math.min(1, totalCalories / (calorieGoal || 1));
  const isOver = totalCalories > calorieGoal;
  const today = useMemo(() => new Date(), []);

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
        <div className="flex items-start">
          <motion.span
            className="font-display font-light text-[clamp(72px,11vw,180px)] leading-[0.85] tabular-nums tracking-tight text-ink"
            data-testid="hero-kcal"
          >
            {displayCount}
          </motion.span>
          <span className="font-mono uppercase text-xs tracking-widest text-ink-soft self-start mt-3 ml-3">
            kcal
          </span>
        </div>

        {/* Progress hairline */}
        <div className="relative w-full h-px bg-rule mt-5 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-persimmon origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.7, delay: 0.4, ease: "easeOut" }
            }
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {Math.round(ratio * 100)}% of goal
          </span>
          {isOver ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon">
              Over by {(totalCalories - calorieGoal).toLocaleString()} kcal
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {Math.max(0, calorieGoal - totalCalories).toLocaleString()} remaining
            </span>
          )}
        </div>
      </div>

      {/* Meta column: greeting + latest weight + date label + goal editor */}
      <div className="col-span-12 md:col-span-3 flex flex-col justify-end gap-3 pb-2">
        {username && (
          <p className="font-mono text-[10px] text-ink-soft">
            {greeting}, <span className="text-ink font-semibold">{username}</span>
          </p>
        )}
        {latestWeight !== null && (
          <p className="font-mono text-[10px] text-ink-soft">
            Last weighed{" "}
            <span className="text-ink font-semibold">{latestWeight.toFixed(1)} kg</span>
          </p>
        )}
        <p className="font-mono uppercase text-[10px] tracking-[0.3em] text-ink-soft">
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
              onChange={(e) => setGoalInput(Math.max(1, parseInt(e.target.value) || 0))}
              className={cn(EDITORIAL_INPUT_CLS, "w-20")}
              min="1"
              max="99999"
              data-testid="goal-edit"
              autoFocus
            />
            <span className="font-mono text-[10px] text-ink-soft">kcal</span>
            <Button
              variant="ghost"
              onClick={async () => {
                await updateCalorieGoal(goalInput);
                setEditingGoal(false);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon hover:text-persimmon/80 rounded-none h-auto p-0"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditingGoal(false)}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink rounded-none h-auto p-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors group w-fit rounded-none h-auto p-0"
            onClick={() => {
              setGoalInput(calorieGoal);
              setEditingGoal(true);
            }}
          >
            <Pencil className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            Goal: {calorieGoal.toLocaleString()} kcal
          </Button>
        )}
      </div>

      {/* Macro stats row */}
      <div className="col-span-12 flex border-y border-rule">
        <MacroStat label="Protein" value={totals.protein} unit="g" />
        <MacroStat label="Carbs" value={totals.carbs} unit="g" />
        <MacroStat label="Fat" value={totals.fat} unit="g" />
        <MacroStat label="Calories" value={totalCalories} unit="kcal" />
      </div>
    </>
  );
}

DashboardHero.displayName = "DashboardHero";

export default DashboardHero;

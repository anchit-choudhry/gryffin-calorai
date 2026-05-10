import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Pencil } from "lucide-react";
import { useAppState } from "../../state/AppState";
import MacroStat from "./MacroStat";
import DateKicker from "./DateKicker";

interface Props {
  totalCalories: number;
  totals: { protein: number; carbs: number; fat: number };
}

const DashboardHero: FC<Props> = ({ totalCalories, totals }) => {
  const { init, updateCalorieGoal } = useAppState();
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

      {/* Meta column: date label + goal editor */}
      <div className="col-span-12 md:col-span-3 flex flex-col justify-end gap-3 pb-2">
        <p className="font-mono uppercase text-[10px] tracking-[0.3em] text-ink-soft">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {editingGoal ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-20 border-b border-rule bg-transparent font-mono text-sm text-ink focus:outline-none focus:border-persimmon pb-0.5"
              min="1"
              max="99999"
              data-testid="goal-edit"
              autoFocus
            />
            <span className="font-mono text-[10px] text-ink-soft">kcal</span>
            <button
              onClick={async () => {
                await updateCalorieGoal(goalInput);
                setEditingGoal(false);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon hover:underline"
            >
              Save
            </button>
            <button
              onClick={() => setEditingGoal(false)}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors group w-fit"
            onClick={() => {
              setGoalInput(calorieGoal);
              setEditingGoal(true);
            }}
          >
            <Pencil className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            Goal: {calorieGoal.toLocaleString()} kcal
          </button>
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
};

export default DashboardHero;

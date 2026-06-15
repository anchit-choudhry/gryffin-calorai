import { useMemo } from "react";
import { CalendarCheck, TrendingDown, TrendingUp } from "lucide-react";
import { computeWeeklyForecast } from "@/lib/adaptiveTdee";
import type { FoodItem } from "@/db/dbService";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";
import { todayISO } from "@/types";

interface EnergyForecastCardProps {
  foodLogs: readonly FoodItem[];
  calorieGoal: number;
}

export function EnergyForecastCard({ foodLogs, calorieGoal }: EnergyForecastCardProps) {
  const today = useMemo(() => todayISO(), []);

  const forecast = useMemo(
    () => computeWeeklyForecast(foodLogs, calorieGoal, today),
    [foodLogs, calorieGoal, today],
  );

  if (forecast.daysLogged === 0 || calorieGoal === 0) {
    return (
      <div className="border border-rule p-4 flex items-start gap-3 text-ink-soft">
        <CalendarCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p className="font-sans text-sm">
          Week-end forecast unlocks once you log at least one day this week.
        </p>
      </div>
    );
  }

  const isSurplus = forecast.projectedBalance > 0;
  const balanceAbs = Math.abs(forecast.projectedBalance);

  return (
    <div className="border border-rule">
      <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <CalendarCheck className="size-3.5 text-persimmon" aria-hidden="true" />
        <span className={cn(LABEL_MONO_CLS, "text-ink")}>Week-end forecast</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-rule">
        <div className="p-4">
          <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>Projected total</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display text-2xl tabular-nums text-ink">
              {forecast.projectedTotal.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-ink-soft">kcal</span>
          </div>
          <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
            {forecast.daysLogged} days logged
          </p>
        </div>
        <div className="p-4">
          <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>Weekly budget</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display text-2xl tabular-nums text-ink">
              {forecast.weeklyBudget.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-ink-soft">kcal</span>
          </div>
          <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
            {calorieGoal.toLocaleString()} / day
          </p>
        </div>
        <div className="p-4">
          <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>
            Projected {isSurplus ? "surplus" : "deficit"}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            {isSurplus ? (
              <TrendingUp className="size-4 text-amber-500 self-center" aria-hidden="true" />
            ) : (
              <TrendingDown
                className="size-4 text-emerald-600 dark:text-emerald-400 self-center"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "font-display text-2xl tabular-nums",
                isSurplus
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {balanceAbs.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-ink-soft">kcal</span>
          </div>
          <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
            {isSurplus ? "above" : "below"} budget at week end
          </p>
        </div>
      </div>
    </div>
  );
}

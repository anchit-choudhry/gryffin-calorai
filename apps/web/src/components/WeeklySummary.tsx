import { useProgressData } from "../hooks/useProgressData";
import { useWeeklySummary } from "../hooks/useWeeklySummary";

const WeeklySummary = () => {
  const { averageCalories, daysOnTarget, consistency, calorieGoal } = useWeeklySummary();
  const { isLoading } = useProgressData(7);

  if (isLoading) {
    return <div className="animate-pulse bg-paper-muted h-24" />;
  }

  const consistencyColor =
    consistency >= 70 ? "text-ink" : consistency >= 40 ? "text-ink-soft" : "text-persimmon";

  return (
    <div className="grid grid-cols-3 divide-x divide-rule">
      <div className="px-4 py-3 text-center">
        <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-ink-soft">7-Day Avg</p>
        <p className="font-display text-2xl tabular-nums mt-2 text-ink">
          {averageCalories.toLocaleString()}
        </p>
        <p className="font-mono text-[10px] text-ink-soft mt-1">
          vs {calorieGoal.toLocaleString()} goal
        </p>
      </div>

      <div className="px-4 py-3 text-center">
        <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-ink-soft">On Target</p>
        <p className="font-display text-2xl tabular-nums mt-2 text-ink">{daysOnTarget}/7</p>
        <p className="font-mono text-[10px] text-ink-soft mt-1">days within goal</p>
      </div>

      <div className="px-4 py-3 text-center">
        <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-ink-soft">
          Consistency
        </p>
        <p className={`font-display text-2xl tabular-nums mt-2 ${consistencyColor}`}>
          {consistency}%
        </p>
        <p className="font-mono text-[10px] text-ink-soft mt-1">adherence rate</p>
      </div>
    </div>
  );
};

export default WeeklySummary;

import { useMemo } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { computeAllCorrelations } from "@/lib/correlations";
import type { FoodItem } from "@/db/dbService";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";

const DIRECTION_ICON = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

const STRENGTH_COLOR: Record<string, string> = {
  strong: "text-persimmon",
  moderate: "text-amber-600 dark:text-amber-400",
  weak: "text-ink-soft",
};

interface CorrelationInsightsPanelProps {
  foodLogs: readonly FoodItem[];
}

export function CorrelationInsightsPanel({ foodLogs }: CorrelationInsightsPanelProps) {
  const bodyMeasurements = useAppState((s) => s.bodyMeasurements);
  const fastingHistory = useAppState((s) => s.fastingHistory);
  const trainingDays = useAppState((s) => s.trainingDays);
  const calorieGoal = useAppState((s) => (s.init.status === "ready" ? s.init.user.calorieGoal : 0));

  const correlations = useMemo(
    () =>
      computeAllCorrelations(foodLogs, bodyMeasurements, fastingHistory, trainingDays, calorieGoal),
    [foodLogs, bodyMeasurements, fastingHistory, trainingDays, calorieGoal],
  );

  if (correlations.length === 0) {
    return (
      <div className="border border-rule p-6 text-ink-soft">
        <p className="font-sans text-sm">
          Correlation insights unlock with more data: log sodium in food items, add body
          measurements, and complete fasting sessions.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/60 mt-2">
          Needs 5+ paired data points per correlation
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {correlations.map((c) => {
        const Icon = DIRECTION_ICON[c.direction];
        return (
          <div key={c.id} className="border border-rule p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>{c.label}</span>
              <Icon className={cn("size-3.5", STRENGTH_COLOR[c.strength])} aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn("font-display text-2xl tabular-nums", STRENGTH_COLOR[c.strength])}
              >
                {c.r > 0 ? "+" : ""}
                {c.r.toFixed(2)}
              </span>
              <span className="font-mono text-[10px] text-ink-soft">r</span>
            </div>
            <p className="font-sans text-xs text-ink-soft leading-relaxed">{c.description}</p>
            <p className="font-mono text-[10px] text-ink-soft/50 mt-auto">
              n={c.sampleSize} paired observations
            </p>
          </div>
        );
      })}
    </div>
  );
}

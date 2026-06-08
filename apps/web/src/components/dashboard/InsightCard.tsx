import { Flame, TrendingDown, TrendingUp, Trophy, X } from "lucide-react";
import type { DashboardInsight } from "@/hooks/useDashboardInsights";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";

const INSIGHT_ICONS: Record<string, typeof Flame> = {
  streak: Flame,
  "goal-close": TrendingUp,
  "over-goal": TrendingDown,
  "protein-low": TrendingDown,
  consistency: Trophy,
};

interface InsightCardProps {
  insight: DashboardInsight;
  onDismiss: (id: string) => void;
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const Icon = INSIGHT_ICONS[insight.id] ?? Flame;
  const isWarning = insight.id === "over-goal" || insight.id === "protein-low";

  return (
    <div
      className={cn(
        "flex items-start gap-3 border px-4 py-3",
        isWarning ? "border-amber-700/40 bg-amber-950/20" : "border-persimmon/30 bg-persimmon/5",
      )}
    >
      <Icon
        className={cn("mt-0.5 size-3.5 shrink-0", isWarning ? "text-amber-500" : "text-persimmon")}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            LABEL_MONO_CLS,
            "leading-none",
            isWarning ? "text-amber-500" : "text-persimmon",
          )}
        >
          {insight.text}
        </p>
        {insight.subtext && (
          <p className="mt-0.5 font-mono text-[10px] text-ink-soft">{insight.subtext}</p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Dismiss insight: ${insight.text}`}
        onClick={() => onDismiss(insight.id)}
        className="shrink-0 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </div>
  );
}

import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { todayISO } from "@/types";

interface WaterTideWeekProps {
  data: number[];
  labels: string[];
  goalMl: number;
  todayLabel: string;
  isLoading: boolean;
}

const toWeekday = (mmdd: string): string =>
  new Date(`${todayISO().substring(0, 4)}-${mmdd}`).toLocaleDateString("en-US", {
    weekday: "short",
  });

export function WaterTideWeek({
  data,
  labels,
  goalMl,
  todayLabel,
  isLoading,
}: WaterTideWeekProps): ReactElement {
  const weekTotal = data.reduce((s, v) => s + v, 0);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-end gap-px h-7 border-b border-rule/40" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-full animate-pulse bg-ink/8" />
          ))}
        </div>
        <p className="sr-only">This week: loading</p>
      </div>
    );
  }

  return (
    <div>
      <div aria-hidden="true">
        <div className="flex items-end gap-px h-7 border-b border-rule/40">
          {labels.map((label, i) => {
            const isToday = label === todayLabel;
            const heightPct = goalMl > 0 ? Math.min(100, (data[i]! / goalMl) * 100) : 0;
            return (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <div
                  data-testid="week-bar"
                  className={cn(
                    "w-full transition-[height] duration-500",
                    isToday ? "bg-persimmon/30 dark:bg-persimmon/40" : "bg-ink/12 dark:bg-ink/20",
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex">
          {labels.map((label, i) => {
            const isToday = label === todayLabel;
            return (
              <div key={i} className="flex-1 text-center">
                <span
                  className={cn(
                    "font-mono text-[7px]",
                    isToday ? "text-persimmon/60" : "text-ink-soft/35",
                  )}
                >
                  {toWeekday(label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="sr-only">This week: {weekTotal.toLocaleString()} ml across 7 days</p>
    </div>
  );
}

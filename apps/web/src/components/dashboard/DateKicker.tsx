import { useCallback, useState } from "react";
import type { FC } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { shiftISODate, todayISO } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  date: Date;
  interactive?: boolean;
}

const DateKicker: FC<Props> = ({ date, interactive = false }) => {
  const selectedDate = useAppState((s) => s.selectedDate);
  const setSelectedDate = useAppState((s) => s.setSelectedDate);
  const shouldReduceMotion = useReducedMotion();
  const [dir, setDir] = useState(0);

  const activeDate = interactive ? new Date(`${selectedDate}T00:00:00`) : date;
  const isToday = interactive && selectedDate === todayISO();

  const dow = activeDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mon = activeDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = String(activeDate.getDate()).padStart(2, "0");
  const year = activeDate.getFullYear();
  const display = `${dow} · ${mon} ${day} · ${year}`;
  const fullLabel = activeDate.toLocaleDateString("en-US", { dateStyle: "full" });

  const prevDay = useCallback(() => {
    setDir(-1);
    void setSelectedDate(shiftISODate(selectedDate, -1));
  }, [selectedDate, setSelectedDate]);

  const nextDay = useCallback(() => {
    const next = shiftISODate(selectedDate, 1);
    if (next > todayISO()) return;
    setDir(1);
    void setSelectedDate(next);
  }, [selectedDate, setSelectedDate]);

  const goToday = useCallback(() => {
    setDir(1);
    void setSelectedDate(todayISO());
  }, [setSelectedDate]);

  const textCls =
    "[writing-mode:vertical-rl] rotate-180 uppercase tracking-[0.3em] text-[10px] font-mono text-ink-soft select-none whitespace-nowrap";

  if (!interactive) {
    return (
      <div className="flex items-center justify-center h-full py-4" aria-label={fullLabel}>
        <span className="sr-only">{fullLabel}</span>
        <span className={textCls} aria-hidden="true">
          {display}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full py-4 gap-2"
      aria-label={fullLabel}
    >
      <button
        type="button"
        onClick={nextDay}
        disabled={isToday}
        aria-label="Next day"
        className={cn(
          "flex items-center justify-center size-6 text-ink-soft transition-colors",
          "hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isToday && "opacity-30 cursor-not-allowed",
        )}
      >
        <ChevronLeft className="size-3.5 rotate-90" aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center gap-1 overflow-hidden">
        <span className="sr-only">{fullLabel}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={display}
            className={textCls}
            aria-hidden="true"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: dir * 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: dir * -14 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
        {!isToday && (
          <button
            type="button"
            onClick={goToday}
            aria-label="Return to today"
            className="font-mono text-[8px] uppercase tracking-widest text-persimmon hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Today
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={prevDay}
        aria-label="Previous day"
        className="flex items-center justify-center size-6 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ChevronRight className="size-3.5 rotate-90" aria-hidden="true" />
      </button>
    </div>
  );
};

export default DateKicker;

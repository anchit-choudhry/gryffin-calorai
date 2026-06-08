import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useStreaks } from "@/hooks/useStreaks";
import { LABEL_MONO_CLS } from "@/lib/utils";
import { motionTokens } from "@/lib/motionVariants";
import { RuleTicks } from "@/components/icons/almanac";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface StatBlockProps {
  value: string | number;
  label: string;
  sub?: string;
}

function StatBlock({ value, label, sub }: StatBlockProps) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-light tabular-nums text-persimmon leading-none">
        {value}
      </p>
      <p className={`${LABEL_MONO_CLS} mt-2`}>{label}</p>
      {sub && <p className="mt-0.5 font-mono text-[10px] text-ink-soft">{sub}</p>}
    </div>
  );
}

export function WeeklyHarvestModal({ open, onClose }: Props) {
  const reduced = useReducedMotion();
  const { averageCalories, daysOnTarget, consistency, calorieGoal } = useWeeklySummary();
  const { currentStreak, longestStreak } = useStreaks();

  const backdropVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  const panelVariants = reduced
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: motionTokens.durEntrance, ease: motionTokens.easeOutExpo },
        },
        exit: {
          opacity: 0,
          y: 16,
          transition: { duration: motionTokens.durState, ease: motionTokens.easeInOut },
        },
      };

  const consistencyLabel =
    consistency >= 80 ? "Excellent week" : consistency >= 50 ? "Solid week" : "Room to grow";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="harvest-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="harvest-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="harvest-modal-title"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-x-4 top-[10%] z-[101] mx-auto max-w-lg border border-rule bg-paper shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rule px-6 py-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    Weekly
                  </span>
                  <RuleTicks
                    ticks={5}
                    spacing={6}
                    className="h-3 text-rule shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <h2
                  id="harvest-modal-title"
                  className="editorial-serif text-xl font-semibold text-ink"
                >
                  The Harvest
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close weekly harvest review"
                onClick={onClose}
                className="flex size-8 items-center justify-center text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px border-b border-rule bg-rule sm:grid-cols-4">
              <div className="bg-paper px-6 py-6">
                <StatBlock
                  value={averageCalories.toLocaleString()}
                  label="Avg daily kcal"
                  sub={`Goal: ${calorieGoal.toLocaleString()}`}
                />
              </div>
              <div className="bg-paper px-6 py-6">
                <StatBlock
                  value={`${daysOnTarget}/7`}
                  label="Days on target"
                  sub={`${consistency}% consistency`}
                />
              </div>
              <div className="bg-paper px-6 py-6">
                <StatBlock
                  value={currentStreak}
                  label="Current streak"
                  sub={
                    currentStreak === longestStreak && currentStreak > 0
                      ? "Personal best"
                      : `Best: ${longestStreak}`
                  }
                />
              </div>
              <div className="bg-paper px-6 py-6">
                <StatBlock value={consistency} label="Consistency %" sub={consistencyLabel} />
              </div>
            </div>

            {/* Editorial note */}
            <div className="px-6 py-5">
              <p className="font-mono text-xs leading-relaxed text-ink-soft">
                {daysOnTarget >= 5
                  ? "Strong week. Your consistency is building a lasting habit."
                  : daysOnTarget >= 3
                    ? "A decent start. A few more days on target would lift your average."
                    : "Every logged meal counts. Tomorrow is a fresh page."}
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-rule px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/a11y";
import { useStreaks } from "../hooks/useStreaks";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";
import { counterPopVariants } from "@/lib/motionVariants";

const STREAK_MILESTONES = new Set([3, 7, 14, 30]);

function buildCalendarDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function streakCaption(n: number): string {
  if (n === 0) return "Start logging today";
  if (n === 1) return "Great start!";
  if (n === 3) return "3 days - building a habit!";
  if (n === 7) return "One full week!";
  if (n === 14) return "Two weeks strong!";
  if (n === 30) return "30 days - incredible!";
  return `${n} days in a row`;
}

const StreakCard = () => {
  const { currentStreak, longestStreak, loggedDates, isLoading } = useStreaks();
  const reduced = useReducedMotion();

  if (isLoading) {
    return <div className="animate-pulse bg-paper-muted h-32" />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const calendarDays = buildCalendarDays();
  const isMilestone = STREAK_MILESTONES.has(currentStreak);

  return (
    <div className="@container">
      <h3 className={`${LABEL_MONO_CLS} mb-4`}>Logging Streak</h3>

      {/* 28-day dot calendar — 4 weeks x 7 days */}
      <div
        className="grid gap-1 @[280px]:gap-1.5 mb-4"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        role="img"
        aria-label={`28-day streak calendar. ${currentStreak} day current streak.`}
      >
        {calendarDays.map((day) => {
          const isToday = day === today;
          const isLogged = loggedDates.has(day);
          return (
            <div
              key={day}
              title={day}
              className={cn(
                "aspect-square rounded-full transition-colors",
                isToday ? "bg-persimmon" : isLogged ? "bg-persimmon/30" : "bg-rule/60",
              )}
            />
          );
        })}
      </div>

      {/* Caption row: current / best */}
      <div className="flex items-end gap-4 border-t border-rule pt-3">
        <div className="text-center">
          {/* key={currentStreak} re-mounts on change, triggering the spring pop */}
          <motion.p
            key={currentStreak}
            variants={reduced ? undefined : counterPopVariants}
            initial={reduced ? undefined : "initial"}
            animate={reduced ? undefined : "animate"}
            className={cn(
              "font-display text-3xl tabular-nums leading-none",
              isMilestone
                ? "text-persimmon drop-shadow-[0_0_12px_theme(colors.persimmon/0.6)]"
                : "text-persimmon",
            )}
          >
            {currentStreak}
          </motion.p>
          <p className={`${LABEL_MONO_CLS} mt-1`}>{isMilestone ? "Milestone!" : "Current"}</p>
        </div>
        <div className="w-px self-stretch bg-rule" />
        <div className="text-center">
          <p className="font-display text-3xl tabular-nums text-ink-soft leading-none">
            {longestStreak}
          </p>
          <p className={`${LABEL_MONO_CLS} mt-1`}>Best</p>
        </div>
        <p className={`${LABEL_MONO_CLS} ml-auto text-right leading-relaxed`}>
          {streakCaption(currentStreak)}
        </p>
      </div>
    </div>
  );
};

export default StreakCard;

import { Flame, Target, Zap } from "lucide-react";
import { useStreaks } from "../hooks/useStreaks";

const StreakCard = () => {
  const { currentStreak, longestStreak, isLoading } = useStreaks();

  if (isLoading) {
    return <div className="animate-pulse bg-paper-muted h-32" />;
  }

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mb-4">
        Logging Streak
      </h3>
      <div className="flex flex-col items-center gap-3">
        <div
          aria-label={
            currentStreak === 0
              ? "Start your streak"
              : currentStreak >= 7
                ? "On fire!"
                : "Building momentum"
          }
        >
          {currentStreak >= 7 ? (
            <Flame className="size-6 text-persimmon" />
          ) : currentStreak >= 3 ? (
            <Zap className="size-6 text-persimmon" />
          ) : (
            <Target className="size-6 text-ink-soft" />
          )}
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="font-display text-3xl tabular-nums text-persimmon">{currentStreak}</p>
            <p className="font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wide">
              Current
            </p>
          </div>
          <div className="w-px bg-rule" />
          <div className="text-center">
            <p className="font-display text-3xl tabular-nums text-persimmon">{longestStreak}</p>
            <p className="font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wide">Best</p>
          </div>
        </div>
      </div>
      {currentStreak > 0 ? (
        <p className="font-mono text-[10px] text-ink-soft mt-3 line-clamp-2">
          {currentStreak === 1
            ? "Great start - log tomorrow to build your streak!"
            : `${currentStreak} days in a row. Keep it going!`}
        </p>
      ) : (
        <p className="font-mono text-[10px] text-ink-soft mt-3 line-clamp-2 flex items-center gap-1">
          <Target className="size-3 shrink-0 text-ink-soft" />
          <span>Start logging today to build your streak!</span>
        </p>
      )}
    </div>
  );
};

export default StreakCard;

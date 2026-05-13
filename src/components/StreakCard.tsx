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
      <div className="flex gap-6">
        <div className="text-center">
          <p className="font-display text-4xl tabular-nums text-persimmon">{currentStreak}</p>
          <p className="font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wide">
            Current
          </p>
        </div>
        <div className="w-px bg-rule self-stretch" />
        <div className="text-center">
          <p className="font-display text-4xl tabular-nums text-persimmon">{longestStreak}</p>
          <p className="font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wide">Best</p>
        </div>
        <div className="self-center ml-auto text-3xl" aria-hidden="true">
          {currentStreak >= 7 ? "🔥" : currentStreak >= 3 ? "⚡" : "📅"}
        </div>
      </div>
      {currentStreak > 0 ? (
        <p className="font-mono text-[10px] text-ink-soft mt-3">
          {currentStreak === 1
            ? "Great start - log tomorrow to build your streak!"
            : `${currentStreak} days in a row. Keep it going!`}
        </p>
      ) : (
        <p className="font-mono text-[10px] text-ink-soft mt-3">
          <span className="mr-1" aria-hidden="true">
            📅
          </span>
          Start logging today to build your streak!
        </p>
      )}
    </div>
  );
};

export default StreakCard;

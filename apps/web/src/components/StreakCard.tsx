import { useStreaks } from "../hooks/useStreaks";
import { LABEL_MONO_CLS } from "@/lib/utils";

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

const StreakCard = () => {
  const { currentStreak, longestStreak, loggedDates, isLoading } = useStreaks();

  if (isLoading) {
    return <div className="animate-pulse bg-paper-muted h-32" />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const calendarDays = buildCalendarDays();

  return (
    <div className="@container">
      <h3 className={`${LABEL_MONO_CLS} mb-4`}>Logging Streak</h3>

      {/* 28-day dot calendar — 4 weeks x 7 days; shrinks dot size in narrow containers */}
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
              className={[
                "aspect-square rounded-full transition-colors",
                isToday ? "bg-persimmon" : isLogged ? "bg-persimmon/30" : "bg-rule/60",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Caption row: current / best */}
      <div className="flex items-end gap-4 border-t border-rule pt-3">
        <div className="text-center">
          <p className="font-display text-3xl tabular-nums text-persimmon leading-none">
            {currentStreak}
          </p>
          <p className={`${LABEL_MONO_CLS} mt-1`}>Current</p>
        </div>
        <div className="w-px self-stretch bg-rule" />
        <div className="text-center">
          <p className="font-display text-3xl tabular-nums text-ink-soft leading-none">
            {longestStreak}
          </p>
          <p className={`${LABEL_MONO_CLS} mt-1`}>Best</p>
        </div>
        <p className={`${LABEL_MONO_CLS} ml-auto text-right leading-relaxed`}>
          {currentStreak === 0
            ? "Start logging today"
            : currentStreak === 1
              ? "Great start!"
              : `${currentStreak} days in a row`}
        </p>
      </div>
    </div>
  );
};

export default StreakCard;

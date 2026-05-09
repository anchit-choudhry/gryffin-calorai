import { useStreaks } from "../hooks/useStreaks";

const StreakCard = () => {
  const { currentStreak, longestStreak, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <div className="p-5 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 rounded-xl shadow-md animate-pulse h-32" />
    );
  }

  return (
    <div className="p-5 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Logging Streak
      </h3>
      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-orange-500 dark:text-orange-400">{currentStreak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
            Current
          </p>
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-500 dark:text-amber-400">{longestStreak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
            Best
          </p>
        </div>
        <div className="self-center ml-auto text-3xl" aria-hidden="true">
          {currentStreak >= 7 ? "🔥" : currentStreak >= 3 ? "⚡" : "📅"}
        </div>
      </div>
      {currentStreak > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          {currentStreak === 1
            ? "Great start - log tomorrow to build your streak!"
            : `${currentStreak} days in a row. Keep it going!`}
        </p>
      )}
    </div>
  );
};

export default StreakCard;

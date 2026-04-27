import { useWeeklySummary } from "../hooks/useWeeklySummary";

const WeeklySummary = () => {
  const { averageCalories, daysOnTarget, consistency, calorieGoal, isLoading } = useWeeklySummary();

  if (isLoading) {
    return <div className="dark:text-gray-400">Loading weekly summary...</div>;
  }

  const getConsistencyColor = () => {
    if (consistency >= 70)
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
    if (consistency >= 40)
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
          7-Day Average
        </p>
        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-2">
          {averageCalories.toLocaleString()}
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
          vs {calorieGoal.toLocaleString()} goal
        </p>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Days on Target
        </p>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">{daysOnTarget}/7</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">days within goal</p>
      </div>

      <div className={`p-4 rounded-lg border text-center ${getConsistencyColor()}`}>
        <p className="text-xs font-medium uppercase tracking-wide">Consistency</p>
        <p className="text-2xl font-bold mt-2">{consistency}%</p>
        <p className="text-xs mt-1">adherence rate</p>
      </div>
    </div>
  );
};

export default WeeklySummary;

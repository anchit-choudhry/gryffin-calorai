// src/components/FoodLogger.tsx
import { useFoodForm } from "../hooks/useFoodForm";

const FoodLogger: React.FC = () => {
  const {
    name,
    setName,
    calories,
    setCalories,
    servingSize,
    setServingSize,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    isLoading,
    message,
    submitFoodLog,
  } = useFoodForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitFoodLog();
  };

  return (
    <div className="p-4 border dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Log Meal Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Food Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Apple"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Calories
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => {
              let val = parseInt(e.target.value) || 0;
              val = Math.min(val, 10000);
              setCalories(Math.max(0, val));
            }}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 95"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Serving Size
          </label>
          <input
            type="number"
            value={servingSize}
            onChange={(e) => {
              let val = parseInt(e.target.value) || 0;
              val = Math.min(val, 100);
              setServingSize(Math.max(1, val));
            }}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 1"
            min="1"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Protein (g)
            </label>
            <input
              type="number"
              value={protein}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 0;
                val = Math.min(val, 500);
                setProtein(Math.max(0, val));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 25"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Carbs (g)
            </label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 0;
                val = Math.min(val, 500);
                setCarbs(Math.max(0, val));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fat (g)
            </label>
            <input
              type="number"
              value={fat}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 0;
                val = Math.min(val, 500);
                setFat(Math.max(0, val));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 10"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white ${isLoading ? "bg-gray-400 dark:bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {isLoading ? "Saving..." : "Log Food"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 p-2 rounded ${message.includes("successfully") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default FoodLogger;

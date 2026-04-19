// src/components/FoodLogger.tsx
import { useCallback, useEffect, useState } from "react";
import { addFoodItemLog, getDailyFoodLogs } from "../db/dbService";

interface FoodLoggerProps {
  userId: string;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ userId }) => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [servingSize, setServingSize] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch initial logs when component mounts
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const logs = await getDailyFoodLogs(userId, today);
        // TODO: Dispatch initial logs to the global state store
        console.log("Loaded daily logs:", logs);
      } catch (error) {
        console.error("Error loading daily logs:", error);
        setMessage("Could not load today's logs. Please try again.");
      }
    };
    loadLogs();
  }, [userId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        name.trim().length < 1 ||
        name.trim().length > 100 ||
        calories < 0 ||
        calories > 10000 ||
        servingSize < 1 ||
        servingSize > 100
      ) {
        setMessage("Please enter a valid name, calories (0-10000), and serving size (1-100).");
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        await addFoodItemLog({
          userId: userId,
          name: name,
          calories: Number(calories),
          servingSize: Number(servingSize),
          dateLogged: new Date().toISOString().split("T")[0],
        });

        setMessage(`Successfully logged ${name}! Calories updated.`);
        // Reset form and trigger state update (which would ideally be handled by a global hook)
        setName("");
        setCalories(0);
        setServingSize(1);
      } catch (error) {
        console.error("Error logging food:", error);
        setMessage("Failed to save food log. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, calories, servingSize, userId],
  );

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

// src/components/FoodLogger.tsx
import { useEffect } from "react";
import type { FoodItem } from "../db/dbService";
import { useFoodForm } from "../hooks/useFoodForm";
import { MEAL_TYPES } from "../types";

interface FoodLoggerProps {
  initialFood?: FoodItem;
  onCancel?: () => void;
  onSuccess?: () => void;
  prefillName?: string;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({
  initialFood,
  onCancel,
  onSuccess,
  prefillName,
}) => {
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
    mealType,
    setMealType,
    isLoading,
    message,
    submitFoodLog,
    resetForm,
  } = useFoodForm(initialFood);

  const isEditMode = !!initialFood?.id;

  useEffect(() => {
    if (prefillName && !initialFood) {
      setName(prefillName);
    }
  }, [prefillName, initialFood, setName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitFoodLog();
    if (success) {
      onSuccess?.();
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  return (
    <div className="p-4 border dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">
        {isEditMode ? "Edit Meal Entry" : "Log Meal Entry"}
      </h2>
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
            Meal Type
          </label>
          <div className="mt-1 flex gap-2 flex-wrap">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mealType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Calories per Serving
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md text-white ${isLoading ? "bg-gray-400 dark:bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {isLoading ? "Saving..." : isEditMode ? "Update Food" : "Log Food"}
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
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

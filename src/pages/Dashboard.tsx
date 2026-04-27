// src/pages/Dashboard.tsx
import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import FoodLogger from "../components/FoodLogger";
import BarcodeScanner from "../components/BarcodeScanner";
import WeeklySummary from "../components/WeeklySummary";
import { useAppState } from "../state/AppState";
import { DEFAULT_MEAL_TYPE, todayISO } from "../types";
import type { FoodItem } from "../db/dbService";

const Dashboard = () => {
  const {
    dailyLogs,
    isLoading,
    error,
    deleteFoodLog,
    user,
    updateCalorieGoal,
    favoriteFoods,
    toggleFavorite,
    addFoodLog,
    userId,
  } = useAppState();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(user?.calorieGoal ?? 2000);
  const [editingLog, setEditingLog] = useState<FoodItem | null>(null);
  const [barcodeFood, setBarcodeFood] = useState<{ name: string } | null>(null);

  const totalCalories = dailyLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = dailyLogs.reduce((sum, log) => sum + (log.protein ?? 0), 0);
  const totalCarbs = dailyLogs.reduce((sum, log) => sum + (log.carbs ?? 0), 0);
  const totalFat = dailyLogs.reduce((sum, log) => sum + (log.fat ?? 0), 0);
  const calorieGoal = user?.calorieGoal ?? 2000;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Summary Card */}
      <div className="p-6 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/50 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Today's Total Intake
            </h2>
            {editingGoal ? (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 border dark:border-gray-600 p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="99999"
                />
                <button
                  onClick={async () => {
                    await updateCalorieGoal(goalInput);
                    setEditingGoal(false);
                  }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingGoal(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                onClick={() => {
                  setGoalInput(calorieGoal);
                  setEditingGoal(true);
                }}
              >
                <FiEdit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                Goal: {calorieGoal.toLocaleString()} kcal
              </button>
            )}
          </div>
          <h2 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalCalories.toLocaleString()} kcal
          </h2>
        </div>

        {/* Progress Bar */}
        {!editingGoal && (
          <>
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>
                  {Math.min(100, Math.round((totalCalories / calorieGoal) * 100))}% of daily goal
                </span>
                <span>
                  {Math.max(0, calorieGoal - totalCalories).toLocaleString()} kcal remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    totalCalories >= calorieGoal
                      ? "bg-red-500"
                      : totalCalories >= calorieGoal * 0.8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, (totalCalories / calorieGoal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Macro Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t dark:border-gray-700">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Protein
                </p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {totalProtein}g
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Carbs
                </p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {totalCarbs}g
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Fat
                </p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">{totalFat}g</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Calories
                </p>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                  {totalCalories.toLocaleString()}
                </p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400">kcal</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weekly Summary */}
      <WeeklySummary />

      {/* Favorites Bar */}
      {favoriteFoods.length > 0 && !editingLog && (
        <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Quick Add Favorites</h3>
          <div className="flex flex-wrap gap-2">
            {favoriteFoods.map((fav) => (
              <button
                key={fav.id}
                onClick={async () => {
                  if (userId) {
                    await addFoodLog({
                      userId,
                      name: fav.name,
                      calories: fav.calories,
                      servingSize: fav.servingSize,
                      protein: fav.protein,
                      carbs: fav.carbs,
                      fat: fav.fat,
                      dateLogged: todayISO(),
                      isFavorite: false,
                      mealType: fav.mealType,
                    });
                  }
                }}
                className="px-3 py-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-sm font-medium transition-colors"
              >
                {fav.name} · {fav.calories} kcal
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Core Functionalities Grid */}
      {editingLog ? (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
            Editing: {editingLog.name}
          </h3>
          <FoodLogger
            initialFood={editingLog}
            onCancel={() => setEditingLog(null)}
            onSuccess={() => setEditingLog(null)}
          />
        </div>
      ) : barcodeFood ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Barcode Scan: {barcodeFood.name}
            </h3>
            <button
              onClick={() => setBarcodeFood(null)}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Cancel
            </button>
          </div>
          <FoodLogger prefillName={barcodeFood.name} onSuccess={() => setBarcodeFood(null)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-3 dark:text-gray-200">Log Food</h3>
            <FoodLogger />
          </div>
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-3 dark:text-gray-200">Scan Barcode</h3>
            <BarcodeScanner onBarcodeDetected={(barcode) => setBarcodeFood({ name: barcode })} />
          </div>
        </div>
      )}

      {/* Log History */}
      <div className="pt-4">
        <h3 className="text-2xl font-semibold mb-4 dark:text-gray-200">
          Today's Log ({dailyLogs.length} Items)
        </h3>
        {isLoading ? (
          <p className="dark:text-gray-400">Loading today's logs...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="space-y-3">
            {dailyLogs.length > 0 ? (
              dailyLogs.map((log, index) => (
                <div
                  key={log.id ?? index}
                  className="flex justify-between items-start p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-sm"
                >
                  <div>
                    <p className="font-medium dark:text-gray-200">{log.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {log.servingSize} serving{log.servingSize !== 1 ? "s" : ""} · {log.dateLogged}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {log.mealType ?? DEFAULT_MEAL_TYPE}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        P {log.protein ?? 0}g
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        C {log.carbs ?? 0}g
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        F {log.fat ?? 0}g
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      {log.calories.toLocaleString()} kcal
                    </p>
                    <button
                      onClick={() => log.id && toggleFavorite(log.id, !log.isFavorite)}
                      className="text-yellow-400 hover:text-yellow-600 dark:text-yellow-300 dark:hover:text-yellow-500 text-lg p-1 rounded transition"
                      aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
                    >
                      {log.isFavorite ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-500 text-sm p-1 rounded transition"
                      aria-label={`Edit ${log.name}`}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => log.id && deleteFoodLog(log.id)}
                      className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-500 text-sm p-1 rounded transition"
                      aria-label={`Delete ${log.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No food items logged for today yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

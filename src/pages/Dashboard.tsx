// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import FoodLogger from "../components/FoodLogger";
import BarcodeScanner from "../components/BarcodeScanner";
import { getDailyFoodLogs } from "../db/dbService";

// Mock User ID - In a real app, this comes from the state context
const MOCK_USER_ID = "1";

const Dashboard: React.FC = () => {
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and display today's logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const logs = await getDailyFoodLogs(MOCK_USER_ID, new Date().toISOString().split("T")[0]);
        setDailyLogs(logs);
      } catch (e) {
        console.error("Failed to fetch logs:", e);
        setError("Failed to load daily logs. Please check your database connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const totalCalories = dailyLogs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="border-b dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Gryffin Calorai Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Today's Intake Summary</p>
      </header>

      {/* Summary Card */}
      <div className="p-6 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/50 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Today's Total Intake
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Goal: 2000 kcal</p>
          </div>
          <h2 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalCalories.toLocaleString()} kcal
          </h2>
        </div>
      </div>

      {/* Core Functionalities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-3 dark:text-gray-200">Log Food</h3>
          <FoodLogger userId={MOCK_USER_ID} />
        </div>
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-3 dark:text-gray-200">Scan Barcode</h3>
          <BarcodeScanner />
        </div>
      </div>

      {/* Log History */}
      <div className="pt-4">
        <h3 className="text-2xl font-semibold mb-4 dark:text-gray-200">
          Today's Log ({dailyLogs.length} Items)
        </h3>
        {loading ? (
          <p className="dark:text-gray-400">Loading today's logs...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="space-y-3">
            {dailyLogs.length > 0 ? (
              dailyLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-sm"
                >
                  <div>
                    <p className="font-medium dark:text-gray-200">{log.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {log.servingSize} servings logged on {log.dateLogged}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      {log.calories.toLocaleString()} kcal
                    </p>
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

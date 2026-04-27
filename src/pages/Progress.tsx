// src/pages/Progress.tsx
import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { MEAL_TYPES } from "../types";
import { useProgressData } from "../hooks/useProgressData";
import { useAppState } from "../state/AppState";

// Register necessary Chart.js components
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Progress = () => {
  const [days, setDays] = useState<7 | 30>(7);
  const { labels, data, mealTypeData, isLoading } = useProgressData(days);
  const { user } = useAppState();
  const calorieGoal = user?.calorieGoal ?? 2000;

  // Meal type color palette
  const MEAL_COLORS = {
    Breakfast: { border: "rgb(245,158,11)", bg: "rgba(245,158,11,0.75)" },
    Lunch: { border: "rgb(34,197,94)", bg: "rgba(34,197,94,0.75)" },
    Snacks: { border: "rgb(168,85,247)", bg: "rgba(168,85,247,0.75)" },
    Dinner: { border: "rgb(59,130,246)", bg: "rgba(59,130,246,0.75)" },
  } as const;

  // Line chart data (for 30-day view)
  const lineChartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Calories Consumed",
        data,
        borderColor: "rgb(79, 70, 229)", // Indigo-600
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Daily Goal",
        data: labels.map(() => calorieGoal),
        borderColor: "rgba(239, 68, 68, 0.6)", // Red-500 with transparency
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  // Line chart options
  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "30-Day Calorie Trend",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Calories",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date (MM-DD)",
        },
      },
    },
  };

  // Grouped bar chart data (for 7-day view)
  const barChartData = {
    labels,
    datasets: [
      ...MEAL_TYPES.map((mt) => ({
        type: "bar" as const,
        label: mt,
        data: mealTypeData?.[mt] ?? Array(7).fill(0),
        backgroundColor: MEAL_COLORS[mt].bg,
        borderColor: MEAL_COLORS[mt].border,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      })),
      {
        type: "line" as const,
        label: "Daily Goal",
        data: labels.map(() => calorieGoal),
        borderColor: "rgba(239,68,68,0.7)",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  } as ChartData<"bar">;

  // Bar chart options
  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "7-Day Calories by Meal Type" },
    },
    scales: {
      x: { title: { display: true, text: "Date (MM-DD)" } },
      y: { beginAtZero: true, stacked: false, title: { display: true, text: "Calories" } },
    },
  };

  return (
    <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold border-b dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-100">
          Progress Tracking
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDays(7)}
            className={`px-4 py-2 rounded-md transition ${
              days === 7
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-4 py-2 rounded-md transition ${
              days === 30
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            30 days
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading progress data...</p>
      ) : (
        <>
          {days === 7 && mealTypeData !== null ? (
            <div className="h-[400px]">
              <Bar options={barOptions} data={barChartData} />
            </div>
          ) : (
            <div className="h-[400px]">
              <Line options={lineOptions} data={lineChartData} />
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Chart visualization powered by Chart.js. The dashed red line shows your daily calorie
            goal.
          </p>
        </>
      )}
    </div>
  );
};

export default Progress;

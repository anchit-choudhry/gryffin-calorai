// src/pages/Progress.tsx
import { useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
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
import { useProgressData } from "../hooks/useProgressData";
import { useAppState } from "../state/AppState";

// Register necessary Chart.js components
Chart.register(
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
  const { labels, data, isLoading } = useProgressData(days);
  const { user } = useAppState();
  const calorieGoal = user?.calorieGoal ?? 2000;

  // Format data for Chart.js
  const chartData: ChartData<"line"> = {
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

  // Chart.js options for styling
  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Calorie Trend",
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
          <div className="h-[400px]">
            <Line options={options} data={chartData} />
          </div>
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

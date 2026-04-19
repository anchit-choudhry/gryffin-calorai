// src/pages/Progress.tsx
import React from "react";
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

// Mock data structure: { date: 'YYYY-MM-DD', calories: X }
interface DailyCalorieData {
  date: string;
  calories: number;
}

const Progress: React.FC = () => {
  // Mock data for the first few weeks
  const mockData: DailyCalorieData[] = [
    { date: "2026-03-20", calories: 1800 },
    { date: "2026-03-21", calories: 2100 },
    { date: "2026-03-22", calories: 1650 },
    { date: "2026-03-23", calories: 1950 },
    { date: "2026-03-24", calories: 2200 },
  ];

  // Format data for Chart.js
  const chartData: ChartData<"line"> = {
    labels: mockData.map((item) => item.date.substring(5)), // Show MM-DD
    datasets: [
      {
        label: "Calories Consumed",
        data: mockData.map((item) => item.calories),
        borderColor: "rgb(79, 70, 229)", // Indigo-600
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.3,
        fill: true,
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
      <h2 className="text-3xl font-bold mb-8 border-b dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-100">
        Progress Tracking
      </h2>
      <div className="h-[400px]">
        <Line options={options} data={chartData} />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
        Chart visualization powered by Chart.js.
      </p>
    </div>
  );
};

export default Progress;

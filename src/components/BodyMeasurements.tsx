import { useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useAppState } from "../state/AppState";
import { useBodyForm } from "../hooks/useBodyForm";
import { cmToIn, kgToLb } from "../types";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BodyMeasurements = () => {
  const { bodyMeasurements, deleteBodyMeasurement } = useAppState();
  const form = useBodyForm();
  const [showForm, setShowForm] = useState(false);

  const displayWeight = (kg: number) =>
    form.weightUnit === "lb" ? `${kgToLb(kg)} lb` : `${kg} kg`;

  const displayLength = (cm: number) => (form.lengthUnit === "in" ? `${cmToIn(cm)}"` : `${cm} cm`);

  // Build weight chart from all measurements that have weight
  const weightEntries = bodyMeasurements.filter((m) => m.weight !== undefined);
  const chartLabels = weightEntries.map((m) => m.measuredAt.slice(5)); // MM-DD
  const chartData = weightEntries.map((m) =>
    form.weightUnit === "lb" ? kgToLb(m.weight!) : m.weight!,
  );

  const lineData: ChartData<"line"> = {
    labels: chartLabels,
    datasets: [
      {
        label: `Weight (${form.weightUnit})`,
        data: chartData,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Weight Trend" },
    },
    scales: {
      y: { title: { display: true, text: form.weightUnit } },
      x: { title: { display: true, text: "Date (MM-DD)" } },
    },
  };

  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputCls =
    "w-full border dark:border-gray-600 rounded p-2 text-sm dark:bg-gray-700 dark:text-white";
  const toggleBtn = (active: boolean) =>
    `px-3 py-1 rounded text-sm font-medium transition-colors ${
      active
        ? "bg-violet-600 text-white"
        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`;

  return (
    <div className="space-y-6">
      {/* Unit toggles */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Weight:</span>
          <button
            onClick={() => form.setWeightUnit("kg")}
            className={toggleBtn(form.weightUnit === "kg")}
          >
            kg
          </button>
          <button
            onClick={() => form.setWeightUnit("lb")}
            className={toggleBtn(form.weightUnit === "lb")}
          >
            lb
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Length:</span>
          <button
            onClick={() => form.setLengthUnit("cm")}
            className={toggleBtn(form.lengthUnit === "cm")}
          >
            cm
          </button>
          <button
            onClick={() => form.setLengthUnit("in")}
            className={toggleBtn(form.lengthUnit === "in")}
          >
            in
          </button>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto px-4 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Log Measurement"}
        </button>
      </div>

      {/* Entry form */}
      {showForm && (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Weight ({form.weightUnit}) *</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => form.setWeight(e.target.value)}
                placeholder="e.g. 70"
                min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Body Fat (%)</label>
              <input
                type="number"
                value={form.bodyFat}
                onChange={(e) => form.setBodyFat(e.target.value)}
                placeholder="e.g. 18"
                min="1"
                max="99"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Waist ({form.lengthUnit})</label>
              <input
                type="number"
                value={form.waist}
                onChange={(e) => form.setWaist(e.target.value)}
                placeholder="e.g. 80"
                min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Chest ({form.lengthUnit})</label>
              <input
                type="number"
                value={form.chest}
                onChange={(e) => form.setChest(e.target.value)}
                placeholder="e.g. 95"
                min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Hips ({form.lengthUnit})</label>
              <input
                type="number"
                value={form.hips}
                onChange={(e) => form.setHips(e.target.value)}
                placeholder="e.g. 90"
                min="1"
                className={inputCls}
              />
            </div>
          </div>
          {form.message && (
            <p
              className={`text-sm ${form.message.includes("saved") ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
            >
              {form.message}
            </p>
          )}
          <button
            onClick={async () => {
              const ok = await form.submitMeasurement();
              if (ok) setShowForm(false);
            }}
            disabled={form.isLoading}
            className="px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {form.isLoading ? "Saving…" : "Save Measurement"}
          </button>
        </div>
      )}

      {/* Weight chart */}
      {weightEntries.length >= 2 && (
        <div className="h-[300px]">
          <Line options={lineOptions} data={lineData} />
        </div>
      )}

      {/* Measurement history */}
      {bodyMeasurements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">Body Fat</th>
                <th className="py-2 pr-4">Waist</th>
                <th className="py-2 pr-4">Chest</th>
                <th className="py-2 pr-4">Hips</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {[...bodyMeasurements].reverse().map((m) => (
                <tr key={m.id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-4 font-medium dark:text-gray-200">{m.measuredAt}</td>
                  <td className="py-2 pr-4">
                    {m.weight !== undefined ? displayWeight(m.weight) : "-"}
                  </td>
                  <td className="py-2 pr-4">{m.bodyFat !== undefined ? `${m.bodyFat}%` : "-"}</td>
                  <td className="py-2 pr-4">
                    {m.waist !== undefined ? displayLength(m.waist) : "-"}
                  </td>
                  <td className="py-2 pr-4">
                    {m.chest !== undefined ? displayLength(m.chest) : "-"}
                  </td>
                  <td className="py-2 pr-4">
                    {m.hips !== undefined ? displayLength(m.hips) : "-"}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => m.id && deleteBodyMeasurement(m.id)}
                      className="text-red-400 hover:text-red-600 text-xs p-0.5 rounded transition"
                      aria-label={`Delete measurement from ${m.measuredAt}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic text-sm">
          No measurements logged yet. Click "Log Measurement" to start tracking.
        </p>
      )}
    </div>
  );
};

export default BodyMeasurements;

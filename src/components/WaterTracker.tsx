import { useState } from "react";
import { useAppState } from "../state/AppState";
import { useWaterForm } from "../hooks/useWaterForm";
import { DAILY_WATER_GOAL_ML } from "../types";

const QUICK_AMOUNTS = [250, 500, 750] as const;

const WaterTracker = () => {
  const { dailyWaterLogs, deleteWaterLog } = useAppState();
  const { amount, setAmount, isLoading, message, submitWaterLog } = useWaterForm();
  const [showCustom, setShowCustom] = useState(false);

  const totalMl = dailyWaterLogs.reduce((sum, l) => sum + l.amount, 0);
  const pct = Math.min(100, Math.round((totalMl / DAILY_WATER_GOAL_ML) * 100));

  return (
    <div className="p-5 bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-900/50 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Water Intake</h3>
        <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
          {totalMl} / {DAILY_WATER_GOAL_ML} ml
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
        <div
          className={`h-2.5 rounded-full transition-all ${pct >= 100 ? "bg-cyan-500" : "bg-cyan-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_AMOUNTS.map((ml) => (
          <button
            key={ml}
            onClick={() => submitWaterLog(ml)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 text-sm font-medium transition-colors disabled:opacity-50"
          >
            +{ml} ml
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          Custom
        </button>
      </div>

      {/* Custom amount input */}
      {showCustom && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
            min="1"
            max="5000"
            className="w-28 border dark:border-gray-600 p-1.5 rounded text-sm dark:bg-gray-700 dark:text-white"
            aria-label="Custom water amount in ml"
          />
          <span className="self-center text-sm text-gray-500 dark:text-gray-400">ml</span>
          <button
            onClick={async () => {
              const ok = await submitWaterLog(amount);
              if (ok) setShowCustom(false);
            }}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md bg-cyan-500 text-white hover:bg-cyan-600 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {message && <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-2">{message}</p>}

      {/* Today's log */}
      {dailyWaterLogs.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto">
          {[...dailyWaterLogs].reverse().map((log) => (
            <li
              key={log.id}
              className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"
            >
              <span>
                {log.amount} ml
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(log.loggedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              <button
                onClick={() => log.id && deleteWaterLog(log.id)}
                className="text-red-400 hover:text-red-600 text-xs p-0.5 rounded transition"
                aria-label={`Remove ${log.amount} ml entry`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WaterTracker;

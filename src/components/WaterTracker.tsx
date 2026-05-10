import { useState } from "react";
import { useAppState } from "../state/AppState";
import { useWaterForm } from "../hooks/useWaterForm";
import { DAILY_WATER_GOAL_ML } from "../types";

const QUICK_AMOUNTS = [250, 500, 750] as const;

const WaterTracker = () => {
  const { dailyWaterLogs, deleteWaterLog } = useAppState();
  const { form, isLoading, submitWaterLog } = useWaterForm();
  const [showCustom, setShowCustom] = useState(false);

  const totalMl = dailyWaterLogs.reduce((sum, l) => sum + l.amount, 0);
  const pct = Math.min(100, Math.round((totalMl / DAILY_WATER_GOAL_ML) * 100));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Water Intake
        </h3>
        <span className="font-mono text-[10px] tabular-nums text-persimmon">
          {totalMl} / {DAILY_WATER_GOAL_ML} ml
        </span>
      </div>

      {/* Progress hairline */}
      <div className="relative w-full h-px bg-rule mb-4">
        <div
          className="absolute left-0 top-0 h-full bg-persimmon transition-all"
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
            className="px-3 py-1.5 border border-rule font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:bg-paper-muted transition-colors disabled:opacity-50"
          >
            +{ml}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className="px-3 py-1.5 border border-rule font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:bg-paper-muted transition-colors"
        >
          Custom
        </button>
      </div>

      {/* Custom amount input */}
      {showCustom && (
        <div className="flex gap-2 mb-3 items-center">
          <input
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
            min="1"
            max="5000"
            className="w-24 border-b border-rule bg-transparent font-mono text-sm text-ink focus:outline-none focus:border-persimmon pb-0.5"
            aria-label="Custom water amount in ml"
          />
          <span className="font-mono text-[10px] text-ink-soft">ml</span>
          <button
            onClick={async () => {
              const ok = await submitWaterLog(form.getValues("amount"));
              if (ok) setShowCustom(false);
            }}
            disabled={isLoading}
            className="px-3 py-1.5 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {/* Today's log */}
      {dailyWaterLogs.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto divide-y divide-rule">
          {[...dailyWaterLogs].reverse().map((log) => (
            <li
              key={log.id}
              className="flex justify-between items-center py-1 font-mono text-[11px] text-ink-soft"
            >
              <span>
                {log.amount} ml
                <span className="ml-2 text-[10px] text-ink-soft/60">
                  {new Date(log.loggedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              <button
                onClick={() => log.id && deleteWaterLog(log.id)}
                className="text-ink-soft hover:text-persimmon transition-colors text-xs p-0.5"
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

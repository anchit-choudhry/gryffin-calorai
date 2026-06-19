import { useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import { useWaterForm } from "../hooks/useWaterForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS } from "../lib/utils";

const QUICK_AMOUNTS = [250, 500, 750] as const;
const TIDE_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"] as const;

const WaterTracker = () => {
  const { dailyWaterLogs, addWaterLog, deleteWaterLog, waterGoalMl, setWaterGoalMl } =
    useAppState();
  const { form, isLoading, submitWaterLog } = useWaterForm();
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(waterGoalMl);

  const totalMl = dailyWaterLogs.reduce((sum, l) => sum + l.amount, 0);
  const pct = Math.min(100, Math.round((totalMl / waterGoalMl) * 100));

  // Tide register: 8 three-hour columns, cumulative intake as rising tide
  const tideColumns = useMemo(() => {
    type Col = { label: string; hasEvent: boolean; cumulativePct: number };
    type Acc = { cols: Col[]; cumulativeMl: number };
    return TIDE_LABELS.reduce<Acc>(
      (acc, label, i) => {
        const startH = i * 3;
        const colMl = dailyWaterLogs
          .filter((l) => {
            const h = new Date(l.loggedAt).getHours();
            return h >= startH && h < startH + 3;
          })
          .reduce((s, l) => s + l.amount, 0);
        const newCumulativeMl = acc.cumulativeMl + colMl;
        return {
          cols: [
            ...acc.cols,
            {
              label,
              hasEvent: colMl > 0,
              cumulativePct: Math.min(100, (newCumulativeMl / waterGoalMl) * 100),
            },
          ],
          cumulativeMl: newCumulativeMl,
        };
      },
      { cols: [], cumulativeMl: 0 },
    ).cols;
  }, [dailyWaterLogs, waterGoalMl]);

  return (
    <div className="overflow-hidden">
      <div className="flex justify-between items-center mb-3 min-w-0">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Water Intake
        </h3>
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(Math.max(250, parseInt(e.target.value, 10) || 0))}
              min="250"
              max="10000"
              className={cn(EDITORIAL_INPUT_CLS, "w-20")}
              aria-label="Daily water goal in ml"
              autoFocus
            />
            <span className="font-mono text-[10px] text-ink-soft">ml</span>
            <Button
              variant="ghost"
              onClick={() => {
                setWaterGoalMl(goalInput);
                setEditingGoal(false);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon hover:text-persimmon/80 rounded-none h-auto p-0"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditingGoal(false)}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink rounded-none h-auto p-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setGoalInput(waterGoalMl);
              setEditingGoal(true);
            }}
            className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-persimmon hover:text-ink transition-colors group rounded-none h-auto p-0 min-w-0"
          >
            <Pencil className="size-3 opacity-60 group-hover:opacity-100 shrink-0" />
            <span className="truncate">
              {totalMl} / {waterGoalMl} ml
            </span>
          </Button>
        )}
      </div>

      {/* Tide register - intra-day water visualization */}
      <div className="mb-4" aria-hidden="true">
        <div className="flex items-end gap-px h-7 border-b border-rule/40">
          {tideColumns.map((col, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {col.hasEvent && (
                <div className="absolute top-0.5 size-[3px] rounded-full bg-persimmon/70" />
              )}
              <div
                className="w-full bg-ink/12 dark:bg-ink/20 transition-[height] duration-500"
                style={{ height: `${col.cumulativePct}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex">
          {tideColumns.map((col, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 2 === 0 && (
                <span className="font-mono text-[7px] text-ink-soft/35">{col.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* sr-only progress for screen readers */}
      <div
        className="sr-only"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {totalMl} of {waterGoalMl} ml ({pct}%)
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-1 flex-wrap mb-3 overflow-hidden">
        {QUICK_AMOUNTS.map((ml) => (
          <Button
            key={ml}
            variant="outline"
            onClick={async () => {
              setQuickAddLoading(true);
              try {
                const logId = await addWaterLog(ml);
                if (logId !== undefined) {
                  toast.success(`+${ml} ml logged`, {
                    action: { label: "Undo", onClick: () => deleteWaterLog(logId) },
                  });
                }
              } finally {
                setQuickAddLoading(false);
              }
            }}
            disabled={isLoading || quickAddLoading}
            className="font-mono text-[9px] uppercase tracking-wider text-ink-soft border-rule rounded-none h-auto px-2 py-1 flex-shrink-0"
          >
            +{ml}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => setShowCustom((v) => !v)}
          className="font-mono text-[9px] uppercase tracking-wider text-ink-soft border-rule rounded-none h-auto px-2 py-1 flex-shrink-0"
        >
          Custom
        </Button>
      </div>

      {/* Custom amount input */}
      {showCustom && (
        <div className="flex gap-2 mb-3 items-center">
          <Input
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
            min="1"
            max="5000"
            className={cn(EDITORIAL_INPUT_CLS, "w-24")}
            aria-label="Custom water amount in ml"
          />
          <span className="font-mono text-[10px] text-ink-soft">ml</span>
          <Button
            onClick={async () => {
              const amount = form.getValues("amount");
              const ok = await submitWaterLog(amount);
              if (ok) {
                setShowCustom(false);
                toast.success(`+${amount} ml logged`);
              }
            }}
            disabled={isLoading}
            className="bg-persimmon text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-3 py-1.5 hover:bg-persimmon/90"
          >
            Add
          </Button>
        </div>
      )}

      {/* Today's log */}
      {dailyWaterLogs.length === 0 && (
        <p className="font-mono text-[10px] text-ink-soft/60 mt-2 truncate">
          No entries yet today.
        </p>
      )}
      {dailyWaterLogs.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto divide-y divide-rule">
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
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-ink-soft hover:text-persimmon transition-colors p-0"
                onClick={() => {
                  if (log.id) {
                    const { amount } = log;
                    deleteWaterLog(log.id);
                    toast("Entry removed", {
                      action: { label: "Undo", onClick: () => addWaterLog(amount) },
                    });
                  }
                }}
                aria-label={`Remove ${log.amount} ml entry`}
              >
                <X className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WaterTracker;

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAppState } from "../state/AppState";
import { useStepForm } from "../hooks/useStepForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS } from "../lib/utils";

const QUICK_STEPS = [2000, 5000, 8000, 10000] as const;

const StepTracker = () => {
  const { dailyStepLogs, deleteStepLog, stepGoal, setStepGoal } = useAppState();
  const { form, isLoading, submitStepLog } = useStepForm();
  const [showCustom, setShowCustom] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(stepGoal);

  const totalSteps = dailyStepLogs.reduce((sum, l) => sum + l.steps, 0);
  const pct = Math.min(100, Math.round((totalSteps / stepGoal) * 100));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Step Count
        </h3>
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(Math.max(1000, parseInt(e.target.value) || 0))}
              min="1000"
              max="100000"
              className={cn(EDITORIAL_INPUT_CLS, "w-20")}
              aria-label="Daily step goal"
              autoFocus
            />
            <span className="font-mono text-[10px] text-ink-soft">steps</span>
            <Button
              variant="ghost"
              onClick={() => {
                setStepGoal(goalInput);
                setEditingGoal(false);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-500 hover:text-sky-500/80 rounded-none h-auto p-0"
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
              setGoalInput(stepGoal);
              setEditingGoal(true);
            }}
            className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-sky-500 hover:text-ink transition-colors group rounded-none h-auto p-0"
          >
            <Pencil className="size-3 opacity-60 group-hover:opacity-100" />
            {totalSteps.toLocaleString()} / {stepGoal.toLocaleString()} steps
          </Button>
        )}
      </div>

      {/* Progress hairline */}
      <div className="relative w-full h-px bg-rule mb-4">
        <div
          className="absolute left-0 top-0 h-full bg-sky-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_STEPS.map((steps) => (
          <Button
            key={steps}
            variant="outline"
            onClick={() => submitStepLog(steps)}
            disabled={isLoading}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-soft border-rule rounded-none h-auto px-3 py-1.5"
          >
            +{steps.toLocaleString()}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => setShowCustom((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-wider text-ink-soft border-rule rounded-none h-auto px-3 py-1.5"
        >
          Custom
        </Button>
      </div>

      {/* Custom amount input */}
      {showCustom && (
        <div className="flex gap-2 mb-3 items-center">
          <Input
            type="number"
            {...form.register("steps", { valueAsNumber: true })}
            min="1"
            max="100000"
            className={cn(EDITORIAL_INPUT_CLS, "w-24")}
            aria-label="Custom step count"
          />
          <span className="font-mono text-[10px] text-ink-soft">steps</span>
          <Button
            onClick={async () => {
              const ok = await submitStepLog(form.getValues("steps"));
              if (ok) setShowCustom(false);
            }}
            disabled={isLoading}
            className="bg-sky-500 text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-3 py-1.5 hover:bg-sky-500/90"
          >
            Add
          </Button>
        </div>
      )}

      {/* Today's log */}
      {dailyStepLogs.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto divide-y divide-rule">
          {[...dailyStepLogs].reverse().map((log) => (
            <li
              key={log.id}
              className="flex justify-between items-center py-1 font-mono text-[11px] text-ink-soft"
            >
              <span>
                {log.steps.toLocaleString()} steps
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
                className="text-ink-soft hover:text-sky-500 transition-colors p-0"
                onClick={() => log.id && deleteStepLog(log.id)}
                aria-label={`Remove ${log.steps.toLocaleString()} steps entry`}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StepTracker;

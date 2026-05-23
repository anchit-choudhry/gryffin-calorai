import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";
import { useAppState } from "../../state/AppState";

const GoalSettings = () => {
  const { waterGoalMl, setWaterGoalMl, stepGoal, setStepGoal } = useAppState();

  const [waterInput, setWaterInput] = useState(waterGoalMl);
  const [stepInput, setStepInput] = useState(stepGoal);
  const [editingWater, setEditingWater] = useState(false);
  const [editingStep, setEditingStep] = useState(false);

  return (
    <div className="space-y-6">
      {/* Water goal */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1">
          Daily Water Goal
        </p>
        {editingWater ? (
          <div className="flex items-center gap-3 mt-2">
            <Input
              type="number"
              value={waterInput}
              onChange={(e) => setWaterInput(Math.max(100, parseInt(e.target.value, 10) || 0))}
              min="100"
              max="10000"
              className={cn(EDITORIAL_INPUT_CLS, "w-24")}
              autoFocus
              aria-label="Daily water goal (ml)"
            />
            <span className="font-mono text-[10px] text-ink-soft">ml</span>
            <Button
              variant="ghost"
              onClick={() => {
                setWaterGoalMl(waterInput);
                setEditingWater(false);
              }}
              className="font-mono text-[10px] uppercase tracking-wider text-persimmon hover:text-persimmon/80 rounded-none h-auto p-0"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setWaterInput(waterGoalMl);
                setEditingWater(false);
              }}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-none h-auto p-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setWaterInput(waterGoalMl);
              setEditingWater(true);
            }}
            className="font-mono text-sm tabular-nums text-ink hover:text-persimmon transition-colors rounded-none h-auto p-0"
          >
            {waterGoalMl.toLocaleString()} ml
          </Button>
        )}
      </div>

      {/* Step goal */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1">
          Daily Step Goal
        </p>
        {editingStep ? (
          <div className="flex items-center gap-3 mt-2">
            <Input
              type="number"
              value={stepInput}
              onChange={(e) => setStepInput(Math.max(1000, parseInt(e.target.value, 10) || 0))}
              min="1000"
              max="100000"
              className={cn(EDITORIAL_INPUT_CLS, "w-28")}
              autoFocus
              aria-label="Daily step goal"
            />
            <span className="font-mono text-[10px] text-ink-soft">steps</span>
            <Button
              variant="ghost"
              onClick={() => {
                setStepGoal(stepInput);
                setEditingStep(false);
              }}
              className="font-mono text-[10px] uppercase tracking-wider text-persimmon hover:text-persimmon/80 rounded-none h-auto p-0"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStepInput(stepGoal);
                setEditingStep(false);
              }}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-none h-auto p-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setStepInput(stepGoal);
              setEditingStep(true);
            }}
            className="font-mono text-sm tabular-nums text-ink hover:text-persimmon transition-colors rounded-none h-auto p-0"
          >
            {stepGoal.toLocaleString()} steps
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoalSettings;

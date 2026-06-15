import { useState } from "react";
import { useAppState } from "@/state/AppState";
import type { CustomMacroGoals } from "@/state/slices/settingsSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "@/lib/utils";

interface MacroFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function MacroField({ label, value, onChange }: MacroFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <label className={cn(LABEL_MONO_CLS, "w-16 shrink-0")}>{label}</label>
      <Input
        type="number"
        min="0"
        max="999"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Auto"
        className={cn(EDITORIAL_INPUT_CLS, "w-24")}
      />
      <span className={LABEL_MONO_CLS}>g</span>
    </div>
  );
}

export function CustomMacroGoalsPanel() {
  const customMacroGoals = useAppState((s) => s.customMacroGoals);
  const setCustomMacroGoals = useAppState((s) => s.setCustomMacroGoals);

  const [prevGoals, setPrevGoals] = useState(customMacroGoals);
  const [protein, setProtein] = useState(
    customMacroGoals?.proteinG !== undefined ? String(customMacroGoals.proteinG) : "",
  );
  const [carbs, setCarbs] = useState(
    customMacroGoals?.carbsG !== undefined ? String(customMacroGoals.carbsG) : "",
  );
  const [fat, setFat] = useState(
    customMacroGoals?.fatG !== undefined ? String(customMacroGoals.fatG) : "",
  );

  // Sync form fields when customMacroGoals changes externally (e.g. backup restore).
  if (prevGoals !== customMacroGoals) {
    setPrevGoals(customMacroGoals);
    setProtein(customMacroGoals?.proteinG !== undefined ? String(customMacroGoals.proteinG) : "");
    setCarbs(customMacroGoals?.carbsG !== undefined ? String(customMacroGoals.carbsG) : "");
    setFat(customMacroGoals?.fatG !== undefined ? String(customMacroGoals.fatG) : "");
  }

  const hasOverrides = protein !== "" || carbs !== "" || fat !== "";

  const handleSave = () => {
    const goals: CustomMacroGoals = {};
    if (protein !== "") goals.proteinG = Math.max(0, parseInt(protein, 10) || 0);
    if (carbs !== "") goals.carbsG = Math.max(0, parseInt(carbs, 10) || 0);
    if (fat !== "") goals.fatG = Math.max(0, parseInt(fat, 10) || 0);
    setCustomMacroGoals(Object.keys(goals).length > 0 ? goals : null);
  };

  const handleClear = () => {
    setProtein("");
    setCarbs("");
    setFat("");
    setCustomMacroGoals(null);
  };

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-ink-soft">
        Override individual macro targets. Leave blank to use diet-preset calculations.
      </p>
      <div className="space-y-3">
        <MacroField label="Protein" value={protein} onChange={setProtein} />
        <MacroField label="Carbs" value={carbs} onChange={setCarbs} />
        <MacroField label="Fat" value={fat} onChange={setFat} />
      </div>
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          onClick={handleSave}
          className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]"
        >
          Apply
        </Button>
        {(hasOverrides || customMacroGoals !== null) && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft hover:text-ink"
          >
            Clear overrides
          </Button>
        )}
      </div>
    </div>
  );
}

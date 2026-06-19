import { useMemo } from "react";
import type { FC } from "react";
import { X } from "lucide-react";
import type { FoodItem } from "@/db/dbService";
import type { ISODate } from "@/types";
import { LABEL_MONO_CLS } from "@/lib/utils";

interface Props {
  food: FoodItem;
  allLogs: readonly FoodItem[];
  onClose: () => void;
}

function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function MacroRow({ label, value, unit }: { label: string; value?: number; unit: string }) {
  if (value === undefined) return null;
  return (
    <tr className="border-b border-rule/30">
      <td className={`${LABEL_MONO_CLS} py-1.5 pr-6 align-top`}>{label}</td>
      <td className="py-1.5 font-mono text-xs tabular-nums text-right text-ink">
        {Math.round(value * 10) / 10}
        <span className="text-ink-soft ml-0.5">{unit}</span>
      </td>
    </tr>
  );
}

export const FoodSpecimenSheet: FC<Props> = ({ food, allLogs, onClose }) => {
  const matchedLogs = useMemo(
    () => allLogs.filter((l) => l.name.toLowerCase() === food.name.toLowerCase()),
    [allLogs, food.name],
  );

  const dates30 = useMemo(() => getLastNDates(30), []);

  const logDateSet = useMemo(
    () => new Set<ISODate>(matchedLogs.map((l) => l.dateLogged)),
    [matchedLogs],
  );

  const firstLogged = useMemo(() => {
    const sorted = [...matchedLogs].sort((a, b) => a.dateLogged.localeCompare(b.dateLogged));
    return sorted[0]?.dateLogged;
  }, [matchedLogs]);

  const totalCalories = useMemo(
    () => matchedLogs.reduce((s, l) => s + l.calories, 0),
    [matchedLogs],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Specimen sheet: ${food.name}`}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md border border-rule bg-paper sm:mx-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rule px-6 py-5">
          <div className="flex-1 min-w-0">
            <span className="block font-mono text-[8px] uppercase tracking-[0.3em] text-ink-soft/50 mb-1">
              Specimen No. {food.id}
            </span>
            <h2 className="font-display text-xl font-semibold text-ink leading-tight">
              {food.name}
            </h2>
            <p className="font-mono text-[9px] text-ink-soft/60 mt-1 italic">
              {food.mealType && `${food.mealType} · `}
              {food.calories} kcal per serving
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specimen sheet"
            className="ml-4 flex size-8 shrink-0 items-center justify-center text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-6">
          {/* Nutrition plate */}
          <div>
            <p className={`${LABEL_MONO_CLS} mb-3`}>Nutritional Composition</p>
            <table className="w-full">
              <tbody>
                <MacroRow label="Energy" value={food.calories} unit="kcal" />
                <MacroRow label="Protein" value={food.protein} unit="g" />
                <MacroRow label="Carbs" value={food.carbs} unit="g" />
                <MacroRow label="Fat" value={food.fat} unit="g" />
                <MacroRow label="Fiber" value={food.nutritionData?.fiber} unit="g" />
                <MacroRow label="Sodium" value={food.nutritionData?.sodium} unit="mg" />
                <MacroRow label="Sugar" value={food.nutritionData?.sugar} unit="g" />
              </tbody>
            </table>
          </div>

          {/* Collection record */}
          <div>
            <p className={`${LABEL_MONO_CLS} mb-3`}>Collection Record</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
                  First collected
                </p>
                <p className="font-display text-sm text-ink mt-0.5">
                  {firstLogged
                    ? new Date(firstLogged + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not yet logged"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
                  Times logged
                </p>
                <p className="font-display text-2xl text-persimmon leading-none mt-0.5">
                  {matchedLogs.length}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
                  Total calories
                </p>
                <p className="font-mono text-xs text-ink mt-0.5 tabular-nums">
                  {totalCalories.toLocaleString()} kcal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Frequency sparkline - 30-day occurrence dots */}
        <div className="border-t border-rule px-6 py-4">
          <p className={`${LABEL_MONO_CLS} mb-3`}>Occurrence - Last 30 Days</p>
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={`Logged ${logDateSet.size} of last 30 days`}
          >
            {dates30.map((date) => (
              <div
                key={date}
                title={date}
                className={`h-4 flex-1 transition-colors ${
                  logDateSet.has(date as ISODate) ? "bg-persimmon" : "bg-rule/50"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[8px] text-ink-soft/50">30 days ago</span>
            <span className="font-mono text-[8px] text-ink-soft/50">Today</span>
          </div>
        </div>

        {/* Colophon */}
        <div className="border-t border-rule/40 px-6 py-3">
          <p className="font-mono text-[8px] text-ink-soft/40 text-center tracking-[0.15em] uppercase">
            Gryffin Calorai · Field Journal · Specimen Record
          </p>
        </div>
      </div>
    </div>
  );
};

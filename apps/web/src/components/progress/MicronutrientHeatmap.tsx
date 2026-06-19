import { useMemo } from "react";
import type { FC } from "react";
import type { FoodItem, TdeeProfile } from "@/db/dbService";
import {
  MICRONUTRIENT_LABELS,
  MICRONUTRIENT_RDA,
  MICRONUTRIENT_UNITS,
  type NutritionKey,
} from "@/types";
import { getPersonalizedRDA } from "../../lib/micronutrientRDA";
import { cn } from "@/lib/utils";
import EditorialChartCard from "../charts/EditorialChartCard";

const NUTRIENTS: readonly NutritionKey[] = [
  "vitaminC",
  "calcium",
  "iron",
  "fiber",
  "sodium",
] as const;

const NUTRIENT_SHORT: Record<NutritionKey, string> = {
  vitaminA: "Vit A",
  vitaminB12: "B12",
  vitaminB6: "B6",
  vitaminC: "Vit C",
  vitaminD: "Vit D",
  vitaminE: "Vit E",
  vitaminK: "Vit K",
  folate: "Folate",
  niacin: "Niacin",
  thiamine: "B1",
  calcium: "Ca",
  iron: "Fe",
  magnesium: "Mg",
  potassium: "K",
  sodium: "Na",
  zinc: "Zn",
  copper: "Cu",
  iodine: "Iodine",
  phosphorus: "P",
  selenium: "Se",
  fiber: "Fiber",
  sugar: "Sugar",
  saturatedFat: "Sat Fat",
  transFat: "Trans",
  cholesterol: "Chol",
};

function heatClass(pct: number): string {
  if (pct <= 0) return "bg-rule/40";
  if (pct < 25) return "bg-persimmon/15";
  if (pct < 50) return "bg-persimmon/30";
  if (pct < 75) return "bg-persimmon/50";
  if (pct < 100) return "bg-persimmon/70";
  return "bg-persimmon/90";
}

function heatLabel(pct: number): string {
  if (pct <= 0) return "none";
  if (pct < 25) return "low";
  if (pct < 50) return "partial";
  if (pct < 75) return "moderate";
  if (pct < 100) return "good";
  return "met";
}

interface Props {
  allLogs: readonly FoodItem[];
  tdeeProfile: TdeeProfile | null;
}

export const MicronutrientHeatmap: FC<Props> = ({ allLogs, tdeeProfile }) => {
  const { days, rows, hasData } = useMemo(() => {
    const today = new Date();
    const dateLabels: string[] = [];
    const isoKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      isoKeys.push(iso);
      dateLabels.push(iso.substring(5));
    }

    const byDate = new Map<string, Partial<Record<NutritionKey, number>>>();
    for (const log of allLogs) {
      if (!log.nutritionData || !isoKeys.includes(log.dateLogged)) continue;
      if (!byDate.has(log.dateLogged)) byDate.set(log.dateLogged, {});
      const totals = byDate.get(log.dateLogged)!;
      for (const key of NUTRIENTS) {
        const val = log.nutritionData[key];
        if (val != null) totals[key] = (totals[key] ?? 0) + val;
      }
    }

    let dataFound = false;
    const grid = NUTRIENTS.map((key) => {
      const rda = tdeeProfile ? getPersonalizedRDA(key, tdeeProfile) : MICRONUTRIENT_RDA[key];
      const cells = isoKeys.map((iso) => {
        const val = byDate.get(iso)?.[key] ?? 0;
        if (val > 0) dataFound = true;
        return {
          pct: Math.min(150, Math.round((val / rda) * 100)),
          val: Math.round(val * 10) / 10,
          unit: MICRONUTRIENT_UNITS[key],
        };
      });
      return { key, short: NUTRIENT_SHORT[key], label: MICRONUTRIENT_LABELS[key], cells };
    });

    return { days: dateLabels, rows: grid, hasData: dataFound };
  }, [allLogs, tdeeProfile]);

  return (
    <EditorialChartCard
      label="7-Day Micronutrient Coverage"
      eyebrow="vs. Daily Value"
      height={180}
      raised
      isEmpty={!hasData}
      emptyMessage="Log foods with micronutrient data to see 7-day coverage."
    >
      <div className="flex h-full w-full flex-col gap-1 overflow-x-auto py-2">
        {/* Column headers */}
        <div className="flex items-center gap-px pl-12">
          {days.map((d) => (
            <div
              key={d}
              className="flex-1 text-center font-mono text-[9px] leading-none text-ink-soft"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-px">
            <div
              className="w-12 shrink-0 truncate font-mono text-[9px] leading-none text-ink-soft"
              title={row.label}
            >
              {row.short}
            </div>
            {row.cells.map((cell, dayIdx) => (
              <div
                key={dayIdx}
                className={cn("h-5 flex-1", heatClass(cell.pct))}
                title={`${row.label}: ${cell.val}${cell.unit} (${cell.pct}% DV) - ${heatLabel(cell.pct)}`}
                role="cell"
                aria-label={`${row.label} on ${days[dayIdx]}: ${cell.pct}%`}
              />
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-1 flex items-center gap-2 pl-12">
          {[0, 25, 50, 75, 100].map((pct, i) => (
            <div key={pct} className="flex items-center gap-0.5">
              <div className={cn("h-2 w-3 shrink-0", heatClass(pct + 1))} aria-hidden="true" />
              <span className="font-mono text-[8px] text-ink-soft">
                {i === 0 ? "0%" : `${pct}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </EditorialChartCard>
  );
};

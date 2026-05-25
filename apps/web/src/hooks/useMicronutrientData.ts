import { useMemo } from "react";
import { useAppState } from "../state/AppState";
import {
  MICRONUTRIENT_LABELS,
  MICRONUTRIENT_RDA,
  MICRONUTRIENT_UNITS,
  type NutritionKey,
} from "@/types";
import { getPersonalizedRDA } from "../lib/micronutrientRDA";

export const FEATURED_NUTRIENTS: readonly NutritionKey[] = [
  "vitaminC",
  "calcium",
  "iron",
  "fiber",
  "sodium",
];

export interface MicronutrientChartEntry {
  name: string;
  pct: number;
  value: number;
  unit: string;
  rda: number;
}

export function useMicronutrientData(): {
  chartData: MicronutrientChartEntry[];
  hasData: boolean;
  isPersonalized: boolean;
} {
  const { dailyLogs, tdeeProfile } = useAppState();

  const chartData = useMemo<MicronutrientChartEntry[]>(() => {
    const totals: Partial<Record<NutritionKey, number>> = {};

    for (const log of dailyLogs) {
      if (!log.nutritionData) continue;
      for (const key of FEATURED_NUTRIENTS) {
        const val = log.nutritionData[key];
        if (val != null) {
          totals[key] = (totals[key] ?? 0) + val;
        }
      }
    }

    return FEATURED_NUTRIENTS.map((key) => {
      const value = totals[key] ?? 0;
      const rda = tdeeProfile ? getPersonalizedRDA(key, tdeeProfile) : MICRONUTRIENT_RDA[key];
      return {
        name: MICRONUTRIENT_LABELS[key],
        pct: Math.min(150, Math.round((value / rda) * 100)),
        value,
        unit: MICRONUTRIENT_UNITS[key],
        rda,
      };
    });
  }, [dailyLogs, tdeeProfile]);

  const hasData = chartData.some((d) => d.value > 0);
  const isPersonalized = tdeeProfile !== null;

  return { chartData, hasData, isPersonalized };
}

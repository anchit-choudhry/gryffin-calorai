import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import type { FoodItem } from "../db/dbService";
import { getAllFoodLogs } from "../db/dbService";
import { DEFAULT_MEAL_TYPE, ISODate, MEAL_TYPES, type MealType } from "@/types";

interface MealTypeData {
  Breakfast: number[];
  Lunch: number[];
  Snacks: number[];
  Dinner: number[];
}

interface MacroData {
  protein: number[];
  carbs: number[];
  fat: number[];
}

export function useProgressData(days: 7 | 30 = 7): {
  labels: string[];
  data: number[];
  rollingAvg: number[];
  mealTypeData: MealTypeData | null;
  macroData: MacroData | null;
  isLoading: boolean;
  allLogs: readonly FoodItem[];
} {
  const { userId } = useAppState();
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [rollingAvg, setRollingAvg] = useState<number[]>([]);
  const [mealTypeData, setMealTypeData] = useState<MealTypeData | null>(null);
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [isLoading, setIsLoading] = useState(!userId);
  const [allLogs, setAllLogs] = useState<readonly FoodItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllFoodLogs(userId)
      .then((logs) => {
        if (cancelled) return;
        setAllLogs(logs);

        // Build nested map: dateLogged -> mealType -> total calories
        const mealMap = new Map<string, Map<MealType, number>>();
        // Track macros per day: dateLogged -> { protein, carbs, fat }
        const macroMap = new Map<string, { protein: number; carbs: number; fat: number }>();

        for (const log of logs) {
          const mt = log.mealType ?? DEFAULT_MEAL_TYPE;
          if (!mealMap.has(log.dateLogged)) {
            mealMap.set(log.dateLogged, new Map());
            macroMap.set(log.dateLogged, { protein: 0, carbs: 0, fat: 0 });
          }
          const dayMap = mealMap.get(log.dateLogged)!;
          dayMap.set(mt, (dayMap.get(mt) ?? 0) + log.calories);

          const dayMacro = macroMap.get(log.dateLogged)!;
          dayMacro.protein += log.protein ?? 0;
          dayMacro.carbs += log.carbs ?? 0;
          dayMacro.fat += log.fat ?? 0;
        }

        // Build totalsMap from mealMap (sum all meal types per day)
        const totalsMap = new Map<string, number>();
        for (const [date, dayMap] of mealMap.entries()) {
          let total = 0;
          for (const cal of dayMap.values()) total += cal;
          totalsMap.set(date, total);
        }

        // Generate last `days` dates ending today
        const today = new Date();
        const dateLabels: string[] = [];
        const calorieTotals: number[] = [];
        const isoKeys: string[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = ISODate(d.toISOString().split("T")[0]!);
          isoKeys.push(iso);
          dateLabels.push(iso.substring(5)); // MM-DD display
          calorieTotals.push(totalsMap.get(iso) ?? 0);
        }

        // 7-day trailing average for each date point (smooths calorie trend)
        const rollingAvgValues = calorieTotals.map((_, idx) => {
          const windowStart = Math.max(0, idx - 6);
          const slice = calorieTotals.slice(windowStart, idx + 1);
          return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });

        setLabels(dateLabels);
        setData(calorieTotals);
        setRollingAvg(rollingAvgValues);

        // Only build mealTypeData and macroData for 7-day view
        if (days === 7) {
          const grouped: MealTypeData = {
            Breakfast: [],
            Lunch: [],
            Snacks: [],
            Dinner: [],
          };
          const macros: MacroData = {
            protein: [],
            carbs: [],
            fat: [],
          };
          for (const iso of isoKeys) {
            const dayMap = mealMap.get(iso);
            const dayMacro = macroMap.get(iso);
            for (const mt of MEAL_TYPES) {
              grouped[mt].push(dayMap?.get(mt) ?? 0);
            }
            macros.protein.push(dayMacro?.protein ?? 0);
            macros.carbs.push(dayMacro?.carbs ?? 0);
            macros.fat.push(dayMacro?.fat ?? 0);
          }
          setMealTypeData(grouped);
          setMacroData(macros);
        } else {
          setMealTypeData(null);
          setMacroData(null);
        }

        setIsLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          if (import.meta.env.DEV) console.error("Error fetching progress data:", error);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return { labels, data, rollingAvg, mealTypeData, macroData, isLoading, allLogs };
}

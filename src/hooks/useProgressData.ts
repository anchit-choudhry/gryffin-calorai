import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { getAllFoodLogs } from "../db/dbService";
import { DEFAULT_MEAL_TYPE, ISODate, MEAL_TYPES, type MealType } from "../types";

interface MealTypeData {
  Breakfast: number[];
  Lunch: number[];
  Snacks: number[];
  Dinner: number[];
}

export function useProgressData(days: 7 | 30 = 7) {
  const { userId } = useAppState();
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [mealTypeData, setMealTypeData] = useState<MealTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(!userId);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllFoodLogs(userId)
      .then((logs) => {
        if (cancelled) return;

        // Build nested map: dateLogged -> mealType -> total calories
        const mealMap = new Map<string, Map<MealType, number>>();
        for (const log of logs) {
          const mt = log.mealType ?? DEFAULT_MEAL_TYPE;
          if (!mealMap.has(log.dateLogged)) {
            mealMap.set(log.dateLogged, new Map());
          }
          const dayMap = mealMap.get(log.dateLogged)!;
          dayMap.set(mt, (dayMap.get(mt) ?? 0) + log.calories);
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
          const iso = ISODate(d.toISOString().split("T")[0]);
          isoKeys.push(iso);
          dateLabels.push(iso.substring(5)); // MM-DD display
          calorieTotals.push(totalsMap.get(iso) ?? 0);
        }

        setLabels(dateLabels);
        setData(calorieTotals);

        // Only build mealTypeData for 7-day view
        if (days === 7) {
          const grouped: MealTypeData = {
            Breakfast: [],
            Lunch: [],
            Snacks: [],
            Dinner: [],
          };
          for (const iso of isoKeys) {
            const dayMap = mealMap.get(iso);
            for (const mt of MEAL_TYPES) {
              grouped[mt].push(dayMap?.get(mt) ?? 0);
            }
          }
          setMealTypeData(grouped);
        } else {
          setMealTypeData(null);
        }

        setIsLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error fetching progress data:", error);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return { labels, data, mealTypeData, isLoading };
}

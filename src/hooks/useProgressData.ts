import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { getAllFoodLogs } from "../db/dbService";
import { ISODate } from "../types";

export function useProgressData(days: 7 | 30 = 7) {
  const { userId } = useAppState();
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(!userId);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllFoodLogs(userId)
      .then((logs) => {
        if (cancelled) return;

        // Build a map of dateLogged -> total calories
        const totalsMap = new Map<string, number>();
        for (const log of logs) {
          totalsMap.set(log.dateLogged, (totalsMap.get(log.dateLogged) ?? 0) + log.calories);
        }

        // Generate last `days` dates ending today
        const today = new Date();
        const dateLabels: string[] = [];
        const calorieTotals: number[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = ISODate(d.toISOString().split("T")[0]);
          dateLabels.push(iso.substring(5)); // MM-DD display
          calorieTotals.push(totalsMap.get(iso) ?? 0);
        }

        setLabels(dateLabels);
        setData(calorieTotals);
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

  return { labels, data, isLoading };
}

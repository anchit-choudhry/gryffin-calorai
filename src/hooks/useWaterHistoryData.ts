import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import { getAllWaterLogs } from "../db/dbService";
import { todayISO } from "@/types";

export function useWaterHistoryData(days: 7 | 30 = 7) {
  const { userId } = useAppState();
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(!userId);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllWaterLogs(userId)
      .then((logs) => {
        if (cancelled) return;

        // Build date range and buckets for the last N days
        const today = todayISO();
        const dateSet = new Set<string>();
        const buckets: Record<string, number> = {};

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const iso = d.toISOString().split("T")[0]!;
          dateSet.add(iso);
          buckets[iso] = 0;
        }

        // Aggregate water amounts by date
        for (const log of logs) {
          if (dateSet.has(log.dateLogged)) {
            buckets[log.dateLogged] = (buckets[log.dateLogged] ?? 0) + log.amount;
          }
        }

        // Sort dates and extract labels and data
        const sorted = Object.keys(buckets).sort();
        setLabels(sorted.map((d) => d.substring(5))); // MM-DD format
        setData(sorted.map((d) => buckets[d]!));
        setIsLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error fetching water history data:", error);
          toast.error("Failed to load water history.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return { labels, data, isLoading };
}

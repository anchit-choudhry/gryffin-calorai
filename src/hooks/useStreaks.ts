import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { getAllFoodLogs } from "../db/dbService";
import { computeStreaks } from "../types";

export function useStreaks() {
  const { userId } = useAppState();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllFoodLogs(userId)
      .then((logs) => {
        if (cancelled) return;
        const uniqueDates = [...new Set(logs.map((l) => l.dateLogged as string))];
        const { currentStreak: cur, longestStreak: longest } = computeStreaks(uniqueDates);
        setCurrentStreak(cur);
        setLongestStreak(longest);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { currentStreak, longestStreak, isLoading };
}

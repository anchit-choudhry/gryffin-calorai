import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { getAllFoodLogs } from "../db/dbService";
import { computeStreaks } from "../types";

export function useStreaks(): {
  currentStreak: number;
  longestStreak: number;
  loggedDates: Set<string>;
  isLoading: boolean;
} {
  const { userId } = useAppState();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAllFoodLogs(userId)
      .then((logs) => {
        if (cancelled) return;
        const uniqueDates = [...new Set(logs.map((l) => l.dateLogged))];
        const { currentStreak: cur, longestStreak: longest } = computeStreaks(uniqueDates);
        setCurrentStreak(cur);
        setLongestStreak(longest);
        setLoggedDates(new Set(uniqueDates));
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { currentStreak, longestStreak, loggedDates, isLoading };
}

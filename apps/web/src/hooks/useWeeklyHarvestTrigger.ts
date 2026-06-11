import { useCallback } from "react";

const HARVEST_WEEK_KEY = "gc_harvest_week";

/** Returns ISO year-week key for the given date, e.g. "2026-W24". */
export function isoWeekKey(date: Date = new Date()): string {
  // Move to Thursday of the current week (ISO 8601 anchor day).
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);
  const year = thursday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const week = 1 + Math.round((thursday.getTime() - jan4.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export interface UseWeeklyHarvestTriggerResult {
  shouldOpenThisSession: boolean;
  markSeen: () => void;
}

/**
 * Returns whether the weekly harvest modal should auto-open this session
 * (first load of a new ISO week) and a callback to mark it seen.
 */
export function useWeeklyHarvestTrigger(): UseWeeklyHarvestTriggerResult {
  const currentWeek = isoWeekKey();
  const seenWeek = localStorage.getItem(HARVEST_WEEK_KEY);
  const shouldOpenThisSession = seenWeek !== currentWeek;

  const markSeen = useCallback(() => {
    localStorage.setItem(HARVEST_WEEK_KEY, currentWeek);
  }, [currentWeek]);

  return { shouldOpenThisSession, markSeen };
}

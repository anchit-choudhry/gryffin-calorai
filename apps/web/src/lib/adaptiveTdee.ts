import type { BodyMeasurement } from "@/db/dbService";

type FoodLogEntry = { calories: number; dateLogged: string };

export type AdaptiveTdeeConfidence = "high" | "medium" | "low";

export interface AdaptiveTdeeResult {
  observedTdee: number;
  confidence: AdaptiveTdeeConfidence;
  avgIntake: number;
  weightChangeKg: number;
  daySpan: number;
  dataPoints: number;
}

export interface PlateauResult {
  isPlateauing: boolean;
  daySpan: number;
  weightChangeKg: number;
}

const KCAL_PER_KG = 7700;

/**
 * Computes the observed TDEE from food intake + observed weight change.
 * Formula: observedTDEE = avgIntake + (weightLostKg * 7700 / days)
 * Requires at least 2 weight measurements and food logs in the same window.
 */
export function computeAdaptiveTdee(
  bodyMeasurements: readonly BodyMeasurement[],
  foodLogs: readonly FoodLogEntry[],
  windowDays = 21,
): AdaptiveTdeeResult | undefined {
  const weightEntries = bodyMeasurements
    .filter((m) => m.weight !== undefined)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

  if (weightEntries.length < 2) return undefined;

  const latest = weightEntries[weightEntries.length - 1]!;
  const cutoffDate = new Date(latest.measuredAt);
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  const cutoffISO = cutoffDate.toISOString().slice(0, 10);

  const windowEntries = weightEntries.filter((m) => m.measuredAt >= cutoffISO);
  if (windowEntries.length < 2) return undefined;

  const first = windowEntries[0]!;
  const last = windowEntries[windowEntries.length - 1]!;
  const daySpan = Math.max(
    1,
    Math.round(
      (new Date(last.measuredAt).getTime() - new Date(first.measuredAt).getTime()) / 86400000,
    ),
  );

  if (daySpan < 7) return undefined;

  const windowLogs = foodLogs.filter(
    (f) => f.dateLogged >= first.measuredAt && f.dateLogged <= last.measuredAt,
  );
  if (windowLogs.length === 0) return undefined;

  // Group logs by date and sum calories per day.
  const byDate = new Map<string, number>();
  for (const log of windowLogs) {
    byDate.set(log.dateLogged, (byDate.get(log.dateLogged) ?? 0) + log.calories);
  }

  // Apply EMA smoothing over daily totals.
  const dailyTotals = [...byDate.values()];
  const alpha = 2 / (dailyTotals.length + 1);
  let ema = dailyTotals[0]!;
  for (let i = 1; i < dailyTotals.length; i++) {
    ema = alpha * dailyTotals[i]! + (1 - alpha) * ema;
  }
  const avgIntake = Math.round(ema);

  const weightChangeKg = Math.round((first.weight! - last.weight!) * 100) / 100;
  const caloriesFromWeightChange = (weightChangeKg * KCAL_PER_KG) / daySpan;
  const observedTdee = Math.round(avgIntake + caloriesFromWeightChange);

  let confidence: AdaptiveTdeeConfidence;
  if (daySpan >= 21 && windowEntries.length >= 4) {
    confidence = "high";
  } else if (daySpan >= 14 && windowEntries.length >= 3) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    observedTdee,
    confidence,
    avgIntake,
    weightChangeKg,
    daySpan,
    dataPoints: windowEntries.length,
  };
}

/**
 * Detects weight plateau: less than 0.5 kg change over 21+ days.
 * Used to surface a recalibration nudge when the user is stuck.
 */
export function detectPlateau(bodyMeasurements: readonly BodyMeasurement[]): PlateauResult {
  const weightEntries = bodyMeasurements
    .filter((m) => m.weight !== undefined)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

  if (weightEntries.length < 2) {
    return { isPlateauing: false, daySpan: 0, weightChangeKg: 0 };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 21);
  const cutoffISO = cutoffDate.toISOString().slice(0, 10);

  const recentEntries = weightEntries.filter((m) => m.measuredAt >= cutoffISO);
  if (recentEntries.length < 2) {
    return { isPlateauing: false, daySpan: 0, weightChangeKg: 0 };
  }

  const first = recentEntries[0]!;
  const last = recentEntries[recentEntries.length - 1]!;
  const daySpan = Math.round(
    (new Date(last.measuredAt).getTime() - new Date(first.measuredAt).getTime()) / 86400000,
  );
  const weightChangeKg = Math.abs(first.weight! - last.weight!);

  return {
    isPlateauing: daySpan >= 21 && weightChangeKg < 0.5,
    daySpan,
    weightChangeKg: Math.round(weightChangeKg * 100) / 100,
  };
}

/**
 * Computes end-of-week calorie balance forecast.
 * Uses logged days so far this week and projects the remainder using avgIntake.
 */
export function computeWeeklyForecast(
  foodLogs: readonly FoodLogEntry[],
  calorieGoal: number,
  todayISO: string,
): { projectedTotal: number; weeklyBudget: number; projectedBalance: number; daysLogged: number } {
  const todayDate = new Date(todayISO + "T00:00:00");
  const dayOfWeek = (todayDate.getDay() + 6) % 7; // Mon=0, Sun=6

  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - dayOfWeek);
  const weekStartISO = weekStart.toISOString().slice(0, 10);

  const thisWeekLogs = foodLogs.filter(
    (f) => f.dateLogged >= weekStartISO && f.dateLogged <= todayISO,
  );

  const byDate = new Map<string, number>();
  for (const log of thisWeekLogs) {
    byDate.set(log.dateLogged, (byDate.get(log.dateLogged) ?? 0) + log.calories);
  }

  const dailyTotals = [...byDate.values()];
  const daysLogged = dailyTotals.length;
  const loggedTotal = dailyTotals.reduce((a, b) => a + b, 0);
  const avgSoFar = daysLogged > 0 ? loggedTotal / daysLogged : calorieGoal;
  const remainingDays = 7 - (dayOfWeek + 1);
  const projectedTotal = Math.round(loggedTotal + avgSoFar * remainingDays);
  const weeklyBudget = calorieGoal * 7;

  return {
    projectedTotal,
    weeklyBudget,
    projectedBalance: projectedTotal - weeklyBudget,
    daysLogged,
  };
}

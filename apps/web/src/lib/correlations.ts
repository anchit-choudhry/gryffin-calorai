import type { BodyMeasurement, FastingSession, FoodItem } from "@/db/dbService";
import type { ISODate } from "@/types";

export interface CorrelationResult {
  id: string;
  label: string;
  description: string;
  r: number;
  direction: "positive" | "negative" | "neutral";
  strength: "strong" | "moderate" | "weak";
  sampleSize: number;
}

function pearsonR(xs: number[], ys: number[]): number | undefined {
  if (xs.length !== ys.length || xs.length < 5) return undefined;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dX = 0;
  let dY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    num += dx * dy;
    dX += dx * dx;
    dY += dy * dy;
  }
  const denom = Math.sqrt(dX * dY);
  if (denom === 0) return undefined;
  return Math.round((num / denom) * 100) / 100;
}

function strengthLabel(r: number): "strong" | "moderate" | "weak" {
  const abs = Math.abs(r);
  if (abs >= 0.5) return "strong";
  if (abs >= 0.3) return "moderate";
  return "weak";
}

/**
 * Computes sodium intake vs next-day weight change correlation.
 * Uses a 1-day lag: sodium on day N, weight on day N+1.
 */
export function sodiumVsWeightCorrelation(
  foodLogs: readonly FoodItem[],
  bodyMeasurements: readonly BodyMeasurement[],
): CorrelationResult | undefined {
  const sodiumByDate = new Map<string, number>();
  for (const log of foodLogs) {
    const sodium = log.nutritionData?.sodium ?? 0;
    sodiumByDate.set(log.dateLogged, (sodiumByDate.get(log.dateLogged) ?? 0) + sodium);
  }

  const weightByDate = new Map<string, number>();
  for (const m of bodyMeasurements) {
    if (m.weight !== undefined) {
      weightByDate.set(m.measuredAt as string, m.weight);
    }
  }

  const sodiumVals: number[] = [];
  const weightDeltaVals: number[] = [];

  const sortedDates = [...sodiumByDate.keys()].sort();
  for (const date of sortedDates) {
    const sodium = sodiumByDate.get(date)!;
    if (sodium === 0) continue;
    const nextDate = new Date(date + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    const nextISO = nextDate.toISOString().slice(0, 10) as ISODate;
    const w0 = weightByDate.get(date);
    const w1 = weightByDate.get(nextISO);
    if (w0 !== undefined && w1 !== undefined) {
      sodiumVals.push(sodium);
      weightDeltaVals.push(w1 - w0);
    }
  }

  const r = pearsonR(sodiumVals, weightDeltaVals);
  if (r === undefined) return undefined;

  return {
    id: "sodium-weight",
    label: "Sodium vs next-day weight",
    description:
      r > 0.3
        ? "High-sodium days precede weight bumps - likely water retention"
        : r < -0.3
          ? "Sodium and weight change are inversely related in your data"
          : "No strong link between your sodium and next-day weight",
    r,
    direction: r > 0.1 ? "positive" : r < -0.1 ? "negative" : "neutral",
    strength: strengthLabel(r),
    sampleSize: sodiumVals.length,
  };
}

/**
 * Computes training day vs calorie adherence correlation.
 * Training days = ISODate strings from uiSlice.trainingDays.
 */
export function trainingVsAdherenceCorrelation(
  foodLogs: readonly FoodItem[],
  trainingDays: readonly ISODate[],
  calorieGoal: number,
): CorrelationResult | undefined {
  if (trainingDays.length < 5 || calorieGoal === 0) return undefined;

  const trainingSet = new Set<string>(trainingDays);
  const byDate = new Map<string, number>();
  for (const log of foodLogs) {
    byDate.set(log.dateLogged, (byDate.get(log.dateLogged) ?? 0) + log.calories);
  }

  const isTraining: number[] = [];
  const adherence: number[] = [];
  for (const [date, cals] of byDate.entries()) {
    isTraining.push(trainingSet.has(date) ? 1 : 0);
    adherence.push(cals / calorieGoal);
  }

  const r = pearsonR(isTraining, adherence);
  if (r === undefined) return undefined;

  return {
    id: "training-adherence",
    label: "Training days vs calorie intake",
    description:
      r > 0.3
        ? "You tend to eat more on training days - earned calories at work"
        : r < -0.3
          ? "You eat less on training days - may be under-fuelling workouts"
          : "Training days and intake are not strongly linked in your data",
    r,
    direction: r > 0.1 ? "positive" : r < -0.1 ? "negative" : "neutral",
    strength: strengthLabel(r),
    sampleSize: isTraining.length,
  };
}

/**
 * Computes fasting completion vs total daily intake correlation.
 */
export function fastingVsIntakeCorrelation(
  foodLogs: readonly FoodItem[],
  fastingHistory: readonly FastingSession[],
): CorrelationResult | undefined {
  const completedFastingDates = new Set<string>(
    fastingHistory.filter((s) => s.completed).map((s) => s.dateLogged as string),
  );

  const byDate = new Map<string, number>();
  for (const log of foodLogs) {
    byDate.set(log.dateLogged, (byDate.get(log.dateLogged) ?? 0) + log.calories);
  }

  const hasFast: number[] = [];
  const intakes: number[] = [];
  for (const [date, cals] of byDate.entries()) {
    hasFast.push(completedFastingDates.has(date) ? 1 : 0);
    intakes.push(cals);
  }

  const r = pearsonR(hasFast, intakes);
  if (r === undefined) return undefined;

  return {
    id: "fasting-intake",
    label: "Fasting days vs total intake",
    description:
      r < -0.3
        ? "Fasting days effectively reduce your calorie intake"
        : r > 0.3
          ? "Fasting days are followed by higher-than-usual intake - consider compensatory eating"
          : "No strong link between fasting and same-day intake in your data",
    r,
    direction: r > 0.1 ? "positive" : r < -0.1 ? "negative" : "neutral",
    strength: strengthLabel(r),
    sampleSize: hasFast.length,
  };
}

/**
 * Runs all available correlations and returns non-undefined results.
 */
export function computeAllCorrelations(
  foodLogs: readonly FoodItem[],
  bodyMeasurements: readonly BodyMeasurement[],
  fastingHistory: readonly FastingSession[],
  trainingDays: readonly ISODate[],
  calorieGoal: number,
): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  const sodium = sodiumVsWeightCorrelation(foodLogs, bodyMeasurements);
  if (sodium) results.push(sodium);
  const training = trainingVsAdherenceCorrelation(foodLogs, trainingDays, calorieGoal);
  if (training) results.push(training);
  const fasting = fastingVsIntakeCorrelation(foodLogs, fastingHistory);
  if (fasting) results.push(fasting);
  return results;
}

import type { ReactElement } from "react";
import type { ProgressTab } from "@/pages/Progress";

interface TabHeadlineProps {
  tab: ProgressTab;
  avgCalories: number;
  calorieGoal: number;
  proteinDaysLogged: number;
  windowDays: 7 | 30;
  latestWeightKg: number | null;
  weightDeltaKg: number | null;
  measurementCount: number;
  totalBurnedKcal: number;
  activityCount: number;
  platesEarned: number;
  platesTotal: number;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function buildSentence(props: TabHeadlineProps): string {
  const {
    tab,
    avgCalories,
    calorieGoal,
    proteinDaysLogged,
    windowDays,
    latestWeightKg,
    weightDeltaKg,
    measurementCount,
    totalBurnedKcal,
    activityCount,
    platesEarned,
    platesTotal,
  } = props;

  if (tab === "nutrition") {
    if (avgCalories === 0) {
      return "No food logged in this window yet - start on the Dashboard.";
    }
    const delta = Math.round(Math.abs(avgCalories - calorieGoal));
    const direction = avgCalories >= calorieGoal ? "over goal" : "under goal";
    return `Averaged ${fmt(Math.round(avgCalories))} kcal, ${fmt(delta)} ${direction}, ${proteinDaysLogged}/${windowDays} days logging protein.`;
  }

  if (tab === "body") {
    if (latestWeightKg === null || measurementCount === 0) {
      return "Log your first body measurement to begin tracking your trend.";
    }
    if (weightDeltaKg === null) {
      return `Current weight ${latestWeightKg} kg - log a second measurement to see your trend.`;
    }
    if (weightDeltaKg === 0) {
      return `Current weight ${latestWeightKg} kg - unchanged from first measurement.`;
    }
    const direction = weightDeltaKg > 0 ? "up" : "down";
    const absDelta = Math.abs(weightDeltaKg);
    return `Current weight ${latestWeightKg} kg, ${direction} ${absDelta} kg from first measurement.`;
  }

  if (tab === "activity") {
    if (totalBurnedKcal === 0) {
      return "Log activities on the Dashboard to see your energy expenditure.";
    }
    const unit = activityCount === 1 ? "activity" : "activities";
    return `Burned ${fmt(Math.round(totalBurnedKcal))} kcal across ${activityCount} ${unit} in this window.`;
  }

  // plates
  if (platesEarned === platesTotal) {
    return `All ${platesTotal} specimens collected - your field record is complete.`;
  }
  const remaining = platesTotal - platesEarned;
  return `Collected ${platesEarned} of ${platesTotal} specimens; ${remaining} still in the field.`;
}

export function TabHeadline(props: TabHeadlineProps): ReactElement {
  const sentence = buildSentence(props);

  return (
    <p className="col-span-12 font-serif text-base text-ink leading-relaxed border-b border-rule pb-4 mb-2">
      {sentence}
    </p>
  );
}

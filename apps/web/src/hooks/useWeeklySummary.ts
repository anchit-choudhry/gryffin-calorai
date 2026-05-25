import { useAppState } from "../state/AppState";
import { useProgressData } from "./useProgressData";

export function computeWeeklySummary(data: number[], calorieGoal: number) {
  const daysWithData = data.filter((d) => d > 0);
  const totalCalories = data.reduce((sum, d) => sum + d, 0);
  const averageCalories = daysWithData.length ? Math.round(totalCalories / 7) : 0;
  const daysOnTarget = data.filter((d) => d > 0 && d <= calorieGoal).length;
  const consistency = Math.round((daysOnTarget / 7) * 100);

  return { averageCalories, daysOnTarget, consistency };
}

export function useWeeklySummary(): {
  averageCalories: number;
  daysOnTarget: number;
  consistency: number;
  calorieGoal: number;
} {
  const { data } = useProgressData(7);
  const init = useAppState((s) => s.init);
  const goal = init.status === "ready" ? init.user.calorieGoal : 2000;

  return { ...computeWeeklySummary(data, goal), calorieGoal: goal };
}

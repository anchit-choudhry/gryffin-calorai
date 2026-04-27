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

export function useWeeklySummary() {
  const { data, isLoading } = useProgressData(7);
  const user = useAppState((s) => s.user);
  const goal = user?.calorieGoal ?? 2000;

  return { ...computeWeeklySummary(data, goal), calorieGoal: goal, isLoading };
}

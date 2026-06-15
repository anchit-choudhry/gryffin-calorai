export interface DashboardInsight {
  id: string;
  text: string;
  subtext?: string;
}

export interface InsightParams {
  currentStreak: number;
  totalCaloriesToday: number;
  calorieGoal: number;
  totalProteinToday: number;
  dailyLogCount: number;
  daysOnTargetThisWeek: number;
  isPlateauing?: boolean;
  plateauDaySpan?: number;
}

/** Returns up to 3 contextual nudge cards for the dashboard diary section. */
export function computeInsights(params: InsightParams): DashboardInsight[] {
  const {
    currentStreak,
    totalCaloriesToday,
    calorieGoal,
    totalProteinToday,
    dailyLogCount,
    daysOnTargetThisWeek,
    isPlateauing = false,
    plateauDaySpan = 0,
  } = params;
  const insights: DashboardInsight[] = [];

  if (currentStreak >= 3) {
    insights.push({
      id: "streak",
      text: `${currentStreak}-day streak`,
      subtext: "Keep logging to extend your run",
    });
  }

  if (dailyLogCount > 0 && calorieGoal > 0) {
    const pct = totalCaloriesToday / calorieGoal;
    if (pct >= 0.85 && pct <= 1.05) {
      insights.push({
        id: "goal-close",
        text: "Almost at your goal",
        subtext: `${Math.round(calorieGoal - totalCaloriesToday).toLocaleString()} kcal remaining`,
      });
    } else if (pct > 1.05) {
      insights.push({
        id: "over-goal",
        text: "Over your goal today",
        subtext: `${Math.round(totalCaloriesToday - calorieGoal).toLocaleString()} kcal above target`,
      });
    }
  }

  if (dailyLogCount > 0 && calorieGoal > 0 && totalProteinToday < calorieGoal * 0.04) {
    insights.push({
      id: "protein-low",
      text: "Protein tracking low",
      subtext: "Consider adding a protein source",
    });
  }

  if (daysOnTargetThisWeek >= 5) {
    insights.push({
      id: "consistency",
      text: `${daysOnTargetThisWeek} days on target this week`,
      subtext: "Excellent consistency",
    });
  }

  if (isPlateauing) {
    insights.push({
      id: "plateau",
      text: "Weight plateau detected",
      subtext: `Less than 0.5 kg change over ${plateauDaySpan} days - consider adjusting intake`,
    });
  }

  return insights.slice(0, 3);
}

export function useDashboardInsights(params: InsightParams): DashboardInsight[] {
  return computeInsights(params);
}

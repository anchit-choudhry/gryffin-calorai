import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import {
  completeOnboarding as completeOnboardingInDB,
  getActiveFastingSession,
  getAllActivityLogs,
  getAllBodyMeasurements,
  getAllFastingSessions,
  getAllRecipes,
  getDailyActivityLogs,
  getDailyFoodLogs,
  getDailyFoodLogs as getDailyFoodLogsForRefresh,
  getDailyStepLogs,
  getDailyWaterLogs,
  getDietProfile as getDietProfileFromDB,
  getFavoriteFoodItems,
  getMealPlans as getMealPlansFromDB,
  getMealTemplates as getMealTemplatesFromDB,
  getOrCreateUser,
  getRecentFoodItems,
  getRecurringMeals as getRecurringMealsFromDB,
  getReminders as getRemindersFromDB,
  getTdeeProfile,
  getUnlockedAchievements,
  updateUserProfile,
} from "../../db/dbService";
import type { AppInitState, UserId } from "@/types";
import { DAILY_STEP_GOAL, DAILY_WATER_GOAL_ML, todayISO } from "@/types";
import { TOUR_TOTAL_STEPS } from "../../components/tour/tourSteps";

export interface CoreSlice {
  init: AppInitState;
  userId: UserId | null;
  error: string | null;
  waterGoalMl: number;
  stepGoal: number;
  tourActive: boolean;
  tourStep: number;
  tourTotalSteps: number;
  fetchInitialData: (userId: UserId) => Promise<void>;
  refreshDailyLogs: (userId: UserId) => Promise<void>;
  updateCalorieGoal: (goal: number) => Promise<void>;
  setWaterGoalMl: (ml: number) => void;
  setStepGoal: (steps: number) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const createCoreSlice: StateCreator<AppState, [], [], CoreSlice> = (set, get) => ({
  init: { status: "idle" },
  userId: null,
  error: null,
  waterGoalMl: (() => {
    const stored = localStorage.getItem("waterGoalMl");
    if (stored) {
      const n = parseInt(stored, 10);
      if (Number.isFinite(n) && n >= 250 && n <= 10000) return n;
    }
    return DAILY_WATER_GOAL_ML;
  })(),
  stepGoal: (() => {
    const stored = localStorage.getItem("stepGoal");
    if (stored) {
      const n = parseInt(stored, 10);
      if (Number.isFinite(n) && n >= 1000 && n <= 100000) return n;
    }
    return DAILY_STEP_GOAL;
  })(),
  tourActive: false,
  tourStep: 0,
  tourTotalSteps: TOUR_TOTAL_STEPS,

  fetchInitialData: async (userId: UserId) => {
    set({ init: { status: "loading" }, userId });
    try {
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com");
      const today = todayISO();
      const [
        logs,
        recipeList,
        recentItems,
        favorites,
        waterLogsToday,
        stepLogsToday,
        measurements,
        achievements,
        tdeeProfileData,
        activityLogsToday,
        allActivityLogsData,
        activeSession,
        allSessions,
        dietProfileData,
        recurringMealsData,
        remindersData,
        mealTemplatesData,
        mealPlansData,
      ] = await Promise.all([
        getDailyFoodLogs(userId, today),
        getAllRecipes(userId),
        getRecentFoodItems(userId, 90),
        getFavoriteFoodItems(userId),
        getDailyWaterLogs(userId, today),
        getDailyStepLogs(userId, today),
        getAllBodyMeasurements(userId),
        getUnlockedAchievements(userId),
        getTdeeProfile(userId),
        getDailyActivityLogs(userId, today),
        getAllActivityLogs(userId),
        getActiveFastingSession(userId),
        getAllFastingSessions(userId),
        getDietProfileFromDB(userId),
        getRecurringMealsFromDB(userId),
        getRemindersFromDB(userId),
        getMealTemplatesFromDB(userId),
        getMealPlansFromDB(userId),
      ]);
      set({
        init: { status: "ready", user: profile },
        dailyLogs: logs,
        recipes: recipeList,
        allFoodItems: recentItems,
        favoriteFoods: favorites,
        dailyWaterLogs: waterLogsToday,
        dailyStepLogs: stepLogsToday,
        bodyMeasurements: measurements,
        unlockedAchievements: achievements,
        tdeeProfile: tdeeProfileData ?? null,
        dailyActivityLogs: activityLogsToday,
        allActivityLogs: allActivityLogsData,
        activeFastingSession: activeSession ?? null,
        fastingHistory: allSessions,
        dietProfile: dietProfileData,
        recurringMeals: recurringMealsData,
        reminders: remindersData,
        mealTemplates: mealTemplatesData,
        mealPlans: mealPlansData,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching initial app data:", error);
      const message = mapDbError(error, "Failed to load app data");
      set({ init: { status: "error", message } });
    }
  },

  refreshDailyLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyFoodLogsForRefresh(userId, todayISO());
      set({ dailyLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to refresh logs");
      if (import.meta.env.DEV) console.error("Error refreshing daily logs:", error);
      set({ error: message });
    }
  },

  updateCalorieGoal: async (goal: number) => {
    if (!Number.isFinite(goal) || goal < 1 || goal > 99999) return;
    const state = get();
    if (state.init.status !== "ready" || !state.userId) return;
    try {
      const updatedUser = { ...state.init.user, calorieGoal: goal };
      await updateUserProfile(updatedUser, state.userId);
      set({ init: { status: "ready", user: updatedUser } });
    } catch (error) {
      const message = mapDbError(error, "Failed to update goal");
      if (import.meta.env.DEV) console.error("Error updating calorie goal:", error);
      set({ error: message });
    }
  },

  setWaterGoalMl: (ml: number) => {
    if (!Number.isFinite(ml) || ml < 250 || ml > 10000) return;
    localStorage.setItem("waterGoalMl", String(ml));
    set({ waterGoalMl: ml });
  },

  setStepGoal: (steps: number) => {
    if (!Number.isFinite(steps) || steps < 1000 || steps > 100000) return;
    localStorage.setItem("stepGoal", String(steps));
    set({ stepGoal: steps });
  },

  startTour: () => {
    set({ tourActive: true, tourStep: 0 });
  },

  nextTourStep: () => {
    const { tourStep, tourTotalSteps } = get();
    if (tourStep < tourTotalSteps - 1) {
      set({ tourStep: tourStep + 1 });
    }
  },

  prevTourStep: () => {
    const { tourStep } = get();
    if (tourStep > 0) {
      set({ tourStep: tourStep - 1 });
    }
  },

  endTour: async () => {
    set({ tourActive: false, tourStep: 0 });
    await get().completeOnboarding();
  },

  skipTour: async () => {
    set({ tourActive: false, tourStep: 0 });
    await get().completeOnboarding();
  },

  completeOnboarding: async () => {
    const state = get();
    if (!state.userId) return;
    if (state.init.status !== "ready") return;
    try {
      await completeOnboardingInDB(state.userId);
      set({
        init: { status: "ready", user: { ...state.init.user, hasCompletedOnboarding: true } },
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error completing onboarding:", error);
    }
  },
});

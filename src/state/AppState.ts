import { create } from "zustand";
import { toast } from "sonner";
import { mapDbError } from "../lib/utils";
import {
  addBodyMeasurement as addBodyMeasurementToDB,
  addFoodItemLog,
  addStepLog as addStepLogToDB,
  addUserAchievement as addUserAchievementToDB,
  addWaterLog as addWaterLogToDB,
  type BodyMeasurement,
  completeOnboarding as completeOnboardingInDB,
  deleteBodyMeasurement as deleteBodyMeasurementFromDB,
  deleteFoodItem,
  deleteRecipe as deleteRecipeFromDB,
  deleteStepLog as deleteStepLogFromDB,
  deleteWaterLog as deleteWaterLogFromDB,
  type FoodItem,
  getAllBodyMeasurements,
  getAllFoodLogs,
  getAllRecipes,
  getAllWaterLogs,
  getDailyFoodLogs,
  getDailyStepLogs,
  getDailyWaterLogs,
  getFavoriteFoodItems,
  getOrCreateUser,
  getRecentFoodItems,
  getUnlockedAchievementIds,
  getUnlockedAchievements,
  type Recipe,
  type StepLog,
  toggleFavoriteFoodItem,
  updateFoodItem,
  updateRecipe as updateRecipeInDB,
  updateUserProfile,
  type UserAchievement,
  type WaterLog,
} from "../db/dbService";
import type {
  AppInitState,
  BodyMeasurementId,
  FoodItemId,
  RecipeId,
  StepLogId,
  UserId,
  WaterLogId,
} from "@/types";
import { DAILY_STEP_GOAL, DAILY_WATER_GOAL_ML, todayISO } from "@/types";
import { TOUR_TOTAL_STEPS } from "../components/tour/tourSteps";
import { ACHIEVEMENTS, evaluateAchievements } from "../lib/achievements";

export interface AppState {
  init: AppInitState;
  dailyLogs: FoodItem[];
  allFoodItems: FoodItem[];
  recipes: Recipe[];
  favoriteFoods: FoodItem[];
  dailyWaterLogs: WaterLog[];
  dailyStepLogs: StepLog[];
  bodyMeasurements: BodyMeasurement[];
  unlockedAchievements: UserAchievement[];
  waterGoalMl: number;
  stepGoal: number;
  error: string | null;
  userId: UserId | null;
  fetchInitialData: (userId: UserId) => Promise<void>;
  refreshDailyLogs: (userId: UserId) => Promise<void>;
  fetchAchievements: (userId: UserId) => Promise<void>;
  addFoodLog: (food: Omit<FoodItem, "id">) => Promise<void>;
  deleteFoodLog: (id: FoodItemId) => Promise<void>;
  updateCalorieGoal: (goal: number) => Promise<void>;
  fetchRecipes: (userId: UserId) => Promise<void>;
  deleteRecipe: (id: RecipeId) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  fetchAllFoodItems: (userId: UserId) => Promise<void>;
  fetchFavorites: (userId: UserId) => Promise<void>;
  toggleFavorite: (id: FoodItemId, isFavorite: boolean) => Promise<void>;
  updateFoodLog: (
    id: FoodItemId,
    updates: Partial<Omit<FoodItem, "id" | "userId">>,
  ) => Promise<void>;
  fetchDailyWaterLogs: (userId: UserId) => Promise<void>;
  addWaterLog: (amount: number) => Promise<void>;
  deleteWaterLog: (id: WaterLogId) => Promise<void>;
  fetchDailyStepLogs: (userId: UserId) => Promise<void>;
  addStepLog: (steps: number) => Promise<void>;
  deleteStepLog: (id: StepLogId) => Promise<void>;
  fetchBodyMeasurements: (userId: UserId) => Promise<void>;
  addBodyMeasurement: (m: Omit<BodyMeasurement, "id">) => Promise<void>;
  deleteBodyMeasurement: (id: BodyMeasurementId) => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
  setWaterGoalMl: (ml: number) => void;
  setStepGoal: (steps: number) => void;
  tourActive: boolean;
  tourStep: number;
  tourTotalSteps: number;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAppState = create<AppState>((set, get) => ({
  init: { status: "idle" },
  dailyLogs: [],
  allFoodItems: [],
  recipes: [],
  favoriteFoods: [],
  dailyWaterLogs: [],
  dailyStepLogs: [],
  bodyMeasurements: [],
  unlockedAchievements: [],
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
  error: null,
  userId: null,
  tourActive: false,
  tourStep: 0,
  tourTotalSteps: TOUR_TOTAL_STEPS,

  fetchInitialData: async (userId: UserId) => {
    set({ init: { status: "loading" }, userId });
    try {
      const profile = await getOrCreateUser(userId, "Guest", "guest@example.com");

      const logs = await getDailyFoodLogs(userId, todayISO());
      const recipeList = await getAllRecipes(userId);
      const recentItems = await getRecentFoodItems(userId);
      const favorites = await getFavoriteFoodItems(userId);
      const waterLogsToday = await getDailyWaterLogs(userId, todayISO());
      const stepLogsToday = await getDailyStepLogs(userId, todayISO());
      const measurements = await getAllBodyMeasurements(userId);
      const achievements = await getUnlockedAchievements(userId);
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
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching initial app data:", error);
      const message = mapDbError(error, "Failed to load app data");
      set({ init: { status: "error", message } });
    }
  },

  fetchAchievements: async (userId: UserId) => {
    try {
      const achievements = await getUnlockedAchievements(userId);
      set({ unlockedAchievements: achievements });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch achievements");
      if (import.meta.env.DEV) console.error("Error fetching achievements:", error);
      set({ error: message });
    }
  },

  refreshDailyLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyFoodLogs(userId, todayISO());
      set({ dailyLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to refresh logs");
      if (import.meta.env.DEV) console.error("Error refreshing daily logs:", error);
      set({ error: message });
    }
  },

  addFoodLog: async (food: Omit<FoodItem, "id">) => {
    const state = get();
    if (!state.userId) {
      const error = new Error("User not initialized");
      set({ error: error.message });
      throw error;
    }

    try {
      set({ error: null });
      await addFoodItemLog({ ...food, userId: state.userId });
      await state.refreshDailyLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      const message = mapDbError(error, "Failed to add food log");
      if (import.meta.env.DEV) console.error("Error adding food log:", error);
      set({ error: message });
      throw error;
    }
  },

  deleteFoodLog: async (id: FoodItemId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteFoodItem(id, state.userId);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete log");
      if (import.meta.env.DEV) console.error("Error deleting food log:", error);
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

  fetchRecipes: async (userId: UserId) => {
    try {
      const recipeList = await getAllRecipes(userId);
      set({ recipes: recipeList });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch recipes");
      if (import.meta.env.DEV) console.error("Error fetching recipes:", error);
      set({ error: message });
    }
  },

  deleteRecipe: async (id: RecipeId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteRecipeFromDB(id, state.userId);
      await state.fetchRecipes(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete recipe");
      if (import.meta.env.DEV) console.error("Error deleting recipe:", error);
      set({ error: message });
    }
  },

  updateRecipe: async (recipe: Recipe) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateRecipeInDB(recipe, state.userId);
      await state.fetchRecipes(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update recipe");
      if (import.meta.env.DEV) console.error("Error updating recipe:", error);
      set({ error: message });
    }
  },

  fetchAllFoodItems: async (userId: UserId) => {
    try {
      const items = await getRecentFoodItems(userId);
      set({ allFoodItems: items });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch food items");
      if (import.meta.env.DEV) console.error("Error fetching food items:", error);
      set({ error: message });
    }
  },

  fetchFavorites: async (userId: UserId) => {
    try {
      const favorites = await getFavoriteFoodItems(userId);
      set({ favoriteFoods: favorites });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch favorites");
      if (import.meta.env.DEV) console.error("Error fetching favorites:", error);
      set({ error: message });
    }
  },

  toggleFavorite: async (id: FoodItemId, isFavorite: boolean) => {
    const state = get();
    if (!state.userId) return;
    const prevAllFoodItems = state.allFoodItems;
    const prevFavoriteFoods = state.favoriteFoods;
    const prevDailyLogs = state.dailyLogs;
    set({
      allFoodItems: state.allFoodItems.map((f) => (f.id === id ? { ...f, isFavorite } : f)),
      favoriteFoods: isFavorite
        ? [
            ...state.favoriteFoods.filter((f) => f.id !== id),
            ...(state.allFoodItems.find((f) => f.id === id)
              ? [{ ...state.allFoodItems.find((f) => f.id === id)!, isFavorite: true }]
              : []),
          ]
        : state.favoriteFoods.filter((f) => f.id !== id),
      dailyLogs: state.dailyLogs.map((f) => (f.id === id ? { ...f, isFavorite } : f)),
    });
    try {
      await toggleFavoriteFoodItem(id, isFavorite, state.userId);
    } catch (error) {
      set({
        allFoodItems: prevAllFoodItems,
        favoriteFoods: prevFavoriteFoods,
        dailyLogs: prevDailyLogs,
      });
      const message = mapDbError(error, "Failed to toggle favorite");
      if (import.meta.env.DEV) console.error("Error toggling favorite:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  updateFoodLog: async (id: FoodItemId, updates: Partial<Omit<FoodItem, "id" | "userId">>) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateFoodItem(id, updates, state.userId);
      await state.refreshDailyLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update food log");
      if (import.meta.env.DEV) console.error("Error updating food log:", error);
      set({ error: message });
    }
  },

  fetchDailyWaterLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyWaterLogs(userId, todayISO());
      set({ dailyWaterLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch water logs");
      if (import.meta.env.DEV) console.error("Error fetching water logs:", error);
      set({ error: message });
    }
  },

  addWaterLog: async (amount: number) => {
    const state = get();
    if (!state.userId) return;
    const optimisticLog: WaterLog = {
      userId: state.userId,
      amount,
      dateLogged: todayISO(),
      loggedAt: new Date().toISOString(),
    };
    const prevWaterLogs = state.dailyWaterLogs;
    set({ dailyWaterLogs: [...state.dailyWaterLogs, optimisticLog] });
    try {
      await addWaterLogToDB(optimisticLog);
      await get().fetchDailyWaterLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      set({ dailyWaterLogs: prevWaterLogs });
      const message = mapDbError(error, "Failed to add water log");
      if (import.meta.env.DEV) console.error("Error adding water log:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteWaterLog: async (id: WaterLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteWaterLogFromDB(id, state.userId);
      await state.fetchDailyWaterLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete water log");
      if (import.meta.env.DEV) console.error("Error deleting water log:", error);
      set({ error: message });
    }
  },

  fetchDailyStepLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyStepLogs(userId, todayISO());
      set({ dailyStepLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch step logs");
      if (import.meta.env.DEV) console.error("Error fetching step logs:", error);
      set({ error: message });
    }
  },

  addStepLog: async (steps: number) => {
    const state = get();
    if (!state.userId) return;
    const optimisticLog: StepLog = {
      userId: state.userId,
      steps,
      dateLogged: todayISO(),
      loggedAt: new Date().toISOString(),
    };
    const prevStepLogs = state.dailyStepLogs;
    set({ dailyStepLogs: [...state.dailyStepLogs, optimisticLog] });
    try {
      await addStepLogToDB(optimisticLog);
      await get().fetchDailyStepLogs(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      set({ dailyStepLogs: prevStepLogs });
      const message = mapDbError(error, "Failed to add step log");
      if (import.meta.env.DEV) console.error("Error adding step log:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteStepLog: async (id: StepLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteStepLogFromDB(id, state.userId);
      await state.fetchDailyStepLogs(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete step log");
      if (import.meta.env.DEV) console.error("Error deleting step log:", error);
      set({ error: message });
    }
  },

  fetchBodyMeasurements: async (userId: UserId) => {
    try {
      const measurements = await getAllBodyMeasurements(userId);
      set({ bodyMeasurements: measurements, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch body measurements");
      if (import.meta.env.DEV) console.error("Error fetching body measurements:", error);
      set({ error: message });
    }
  },

  addBodyMeasurement: async (m: Omit<BodyMeasurement, "id">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addBodyMeasurementToDB({ ...m, userId: state.userId });
      await state.fetchBodyMeasurements(state.userId);
      void get().checkAndUnlockAchievements();
    } catch (error) {
      const message = mapDbError(error, "Failed to add measurement");
      if (import.meta.env.DEV) console.error("Error adding body measurement:", error);
      set({ error: message });
    }
  },

  deleteBodyMeasurement: async (id: BodyMeasurementId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteBodyMeasurementFromDB(id, state.userId);
      await state.fetchBodyMeasurements(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to delete measurement");
      if (import.meta.env.DEV) console.error("Error deleting body measurement:", error);
      set({ error: message });
    }
  },

  checkAndUnlockAchievements: async () => {
    const state = get();
    if (!state.userId || state.init.status !== "ready") return;
    try {
      const [allFoodLogs, allWaterLogs, alreadyUnlockedIds] = await Promise.all([
        getAllFoodLogs(state.userId),
        getAllWaterLogs(state.userId),
        getUnlockedAchievementIds(state.userId),
      ]);
      const newIds = evaluateAchievements(
        {
          allFoodLogs,
          allWaterLogs,
          bodyMeasurements: get().bodyMeasurements,
          recipes: get().recipes,
          calorieGoal: state.init.user.calorieGoal,
          waterGoalMl: get().waterGoalMl,
        },
        alreadyUnlockedIds,
      );
      if (newIds.length === 0) return;
      await Promise.all(
        newIds.map((achievementId) =>
          addUserAchievementToDB({
            userId: state.userId!,
            achievementId,
            unlockedAt: new Date().toISOString(),
          }),
        ),
      );
      const fresh = await getUnlockedAchievements(state.userId!);
      set({ unlockedAchievements: fresh });
      for (const id of newIds) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) toast.success(`${def.icon} Achievement Unlocked: ${def.title}`);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Achievement check failed:", err);
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
}));

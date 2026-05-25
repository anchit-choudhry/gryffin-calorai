import { create } from "zustand";
import { toast } from "sonner";
import { mapDbError } from "../lib/utils";
import {
  type ActivityLog,
  addActivityLog as addActivityLogToDB,
  addBodyMeasurement as addBodyMeasurementToDB,
  addFoodItemLog,
  addMealPlan as addMealPlanToDB,
  addMealTemplate as addMealTemplateToDB,
  addRecurringMeal as addRecurringMealToDB,
  addStepLog as addStepLogToDB,
  addUserAchievement as addUserAchievementToDB,
  addWaterLog as addWaterLogToDB,
  type BackupPayload,
  type BodyMeasurement,
  completeOnboarding as completeOnboardingInDB,
  deleteActivityLog as deleteActivityLogFromDB,
  deleteBodyMeasurement as deleteBodyMeasurementFromDB,
  deleteFoodItem,
  deleteMealPlan as deleteMealPlanFromDB,
  deleteMealTemplate as deleteMealTemplateFromDB,
  deleteRecipe as deleteRecipeFromDB,
  deleteRecurringMeal as deleteRecurringMealFromDB,
  deleteReminder as deleteReminderFromDB,
  deleteStepLog as deleteStepLogFromDB,
  deleteWaterLog as deleteWaterLogFromDB,
  type DietProfile,
  endFastingSession as endFastingSessionInDB,
  exportAllData,
  type FastingSession,
  type FoodItem,
  getActiveFastingSession,
  getAllActivityLogs,
  getAllBodyMeasurements,
  getAllFastingSessions,
  getAllFoodLogs,
  getAllRecipes,
  getAllWaterLogs,
  getDailyActivityLogs,
  getDailyFoodLogs,
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
  getUnlockedAchievementIds,
  getUnlockedAchievements,
  importBackup,
  type ImportResult,
  type MealPlan,
  type MealTemplate,
  type MealTemplateFood,
  type Recipe,
  type RecurringMeal,
  type Reminder,
  saveDietProfile as saveDietProfileToDB,
  saveTdeeProfile as saveTdeeProfileToDB,
  startFastingSession as startFastingSessionInDB,
  type StepLog,
  type TdeeProfile,
  toggleFavoriteFoodItem,
  updateBodyMeasurement as updateBodyMeasurementInDB,
  updateFoodItem,
  updateMealTemplate as updateMealTemplateInDB,
  updateRecipe as updateRecipeInDB,
  updateRecurringMeal as updateRecurringMealInDB,
  updateUserProfile,
  upsertReminder as upsertReminderInDB,
  type UserAchievement,
  type WaterLog,
} from "../db/dbService";
import type {
  ActivityLogId,
  AppInitState,
  BodyMeasurementId,
  DietPreset,
  FoodItemId,
  ISODate,
  MealPlanId,
  MealTemplateId,
  RecipeId,
  RecurringMealId,
  ReminderId,
  RestrictionFlag,
  StepLogId,
  UserId,
  WaterLogId,
} from "@/types";
import {
  checkFoodNameRestrictions,
  DAILY_STEP_GOAL,
  DAILY_WATER_GOAL_ML,
  DIET_PRESETS,
  getTodayDayIndex,
  RESTRICTION_FLAGS,
  todayISO,
} from "@/types";
import { TOUR_TOTAL_STEPS } from "../components/tour/tourSteps";
import { ACHIEVEMENTS, evaluateAchievements } from "../lib/achievements";
import { computeCalorieGoal, computeTDEE, mifflinStJeorBMR } from "../lib/tdee";

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
  // Feature 13 - TDEE
  tdeeProfile: TdeeProfile | null;
  fetchTdeeProfile: (userId: UserId) => Promise<void>;
  saveTdeeProfile: (profile: Omit<TdeeProfile, "id" | "userId" | "updatedAt">) => Promise<void>;
  // Feature 10 - Activity
  dailyActivityLogs: ActivityLog[];
  allActivityLogs: ActivityLog[];
  fetchDailyActivityLogs: (userId: UserId) => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, "id">) => Promise<void>;
  deleteActivityLog: (id: ActivityLogId) => Promise<void>;
  // Feature 6 - Fasting
  activeFastingSession: FastingSession | null;
  fastingHistory: FastingSession[];
  fetchFastingSessions: (userId: UserId) => Promise<void>;
  startFasting: (targetHours: number) => Promise<void>;
  endFasting: (completed: boolean) => Promise<void>;
  // Feature 15 - Diet Profiles
  dietProfile: DietProfile | null;
  fetchDietProfile: (userId: UserId) => Promise<void>;
  saveDietProfile: (preset: DietPreset, restrictions: RestrictionFlag[]) => Promise<void>;
  // Feature 7 - Recurring Meals
  recurringMeals: RecurringMeal[];
  fetchRecurringMeals: (userId: UserId) => Promise<void>;
  addRecurringMeal: (meal: Omit<RecurringMeal, "id" | "userId">) => Promise<void>;
  updateRecurringMeal: (meal: RecurringMeal) => Promise<void>;
  deleteRecurringMeal: (id: RecurringMealId) => Promise<void>;
  checkAndPromptRecurringMeals: () => void;
  // Feature 17 - Reminders
  reminders: Reminder[];
  fetchReminders: (userId: UserId) => Promise<void>;
  saveReminder: (reminder: Omit<Reminder, "userId"> & { id?: ReminderId }) => Promise<void>;
  deleteReminder: (id: ReminderId) => Promise<void>;
  // Feature 16 - Meal Templates & Plans
  mealTemplates: MealTemplate[];
  mealPlans: MealPlan[];
  fetchMealTemplates: (userId: UserId) => Promise<void>;
  addMealTemplate: (template: Pick<MealTemplate, "name" | "foods">) => Promise<void>;
  updateMealTemplate: (template: MealTemplate) => Promise<void>;
  deleteMealTemplate: (id: MealTemplateId) => Promise<void>;
  saveTemplateFromTodayLogs: (name: string) => Promise<void>;
  logAllFoodsFromTemplate: (id: MealTemplateId) => Promise<void>;
  copyFoodsFromDate: (date: ISODate) => Promise<void>;
  fetchMealPlans: (userId: UserId) => Promise<void>;
  saveMealPlan: (plan: Pick<MealPlan, "name" | "days">) => Promise<void>;
  deleteMealPlan: (id: MealPlanId) => Promise<void>;
  applyWeekPlan: (planId: MealPlanId) => Promise<void>;
  // Feature 19 - Export/Import
  exportData: () => Promise<BackupPayload | null>;
  importData: (payload: BackupPayload) => Promise<ImportResult | null>;
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
  updateBodyMeasurement: (
    id: BodyMeasurementId,
    updates: Partial<Omit<BodyMeasurement, "id" | "userId">>,
  ) => Promise<void>;
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
  tdeeProfile: null,
  dailyActivityLogs: [],
  allActivityLogs: [],
  activeFastingSession: null,
  fastingHistory: [],
  dietProfile: null,
  recurringMeals: [],
  reminders: [],
  mealTemplates: [],
  mealPlans: [],
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
        getRecentFoodItems(userId),
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
      const { dietProfile } = get();
      if (dietProfile && dietProfile.restrictions.length > 0) {
        const violated = checkFoodNameRestrictions(food.name, dietProfile.restrictions);
        if (violated.length > 0) {
          const flagLabels = violated.map((f) => RESTRICTION_FLAGS[f].label).join(", ");
          toast.warning(`"${food.name}" may contain: ${flagLabels}`);
        }
      }
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

  updateBodyMeasurement: async (
    id: BodyMeasurementId,
    updates: Partial<Omit<BodyMeasurement, "id" | "userId">>,
  ) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateBodyMeasurementInDB(id, state.userId, updates);
      await state.fetchBodyMeasurements(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to update measurement");
      if (import.meta.env.DEV) console.error("Error updating body measurement:", error);
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
        if (def)
          toast.success(`${def.icon} ${def.title}`, {
            description: def.description,
            duration: 5000,
          });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Achievement check failed:", err);
    }
  },

  // Feature 13 - TDEE
  fetchTdeeProfile: async (userId: UserId) => {
    try {
      const profile = await getTdeeProfile(userId);
      set({ tdeeProfile: profile ?? null });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching TDEE profile:", error);
    }
  },

  saveTdeeProfile: async (profileData: Omit<TdeeProfile, "id" | "userId" | "updatedAt">) => {
    const state = get();
    if (!state.userId) return;
    try {
      const profile: TdeeProfile = {
        ...profileData,
        userId: state.userId,
        updatedAt: new Date().toISOString(),
      };
      await saveTdeeProfileToDB(profile);
      set({ tdeeProfile: profile });
      const bmr = mifflinStJeorBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
      const tdee = computeTDEE(bmr, profile.activityLevel);
      const goal = computeCalorieGoal(tdee, profile.goal);
      await get().updateCalorieGoal(goal);
    } catch (error) {
      const message = mapDbError(error, "Failed to save TDEE profile");
      if (import.meta.env.DEV) console.error("Error saving TDEE profile:", error);
      set({ error: message });
    }
  },

  // Feature 10 - Activity
  fetchDailyActivityLogs: async (userId: UserId) => {
    try {
      const logs = await getDailyActivityLogs(userId, todayISO());
      set({ dailyActivityLogs: logs, error: null });
    } catch (error) {
      const message = mapDbError(error, "Failed to fetch activity logs");
      if (import.meta.env.DEV) console.error("Error fetching activity logs:", error);
      set({ error: message });
    }
  },

  addActivityLog: async (log: Omit<ActivityLog, "id">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addActivityLogToDB({ ...log, userId: state.userId });
      const [daily, all] = await Promise.all([
        getDailyActivityLogs(state.userId, todayISO()),
        getAllActivityLogs(state.userId),
      ]);
      set({ dailyActivityLogs: daily, allActivityLogs: all });
    } catch (error) {
      const message = mapDbError(error, "Failed to add activity log");
      if (import.meta.env.DEV) console.error("Error adding activity log:", error);
      set({ error: message });
      throw error;
    }
  },

  deleteActivityLog: async (id: ActivityLogId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteActivityLogFromDB(id, state.userId);
      const [daily, all] = await Promise.all([
        getDailyActivityLogs(state.userId, todayISO()),
        getAllActivityLogs(state.userId),
      ]);
      set({ dailyActivityLogs: daily, allActivityLogs: all });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete activity log");
      if (import.meta.env.DEV) console.error("Error deleting activity log:", error);
      set({ error: message });
    }
  },

  // Feature 6 - Fasting
  fetchFastingSessions: async (userId: UserId) => {
    try {
      const [active, all] = await Promise.all([
        getActiveFastingSession(userId),
        getAllFastingSessions(userId),
      ]);
      set({ activeFastingSession: active ?? null, fastingHistory: all });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching fasting sessions:", error);
    }
  },

  startFasting: async (targetHours: number) => {
    const state = get();
    if (!state.userId) return;
    if (state.activeFastingSession) {
      toast.error("A fasting session is already active. End it first.");
      return;
    }
    try {
      const session: FastingSession = {
        userId: state.userId,
        startTime: new Date().toISOString(),
        endTime: null,
        targetHours,
        dateLogged: todayISO(),
        completed: false,
      };
      await startFastingSessionInDB(session);
      await get().fetchFastingSessions(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to start fasting session");
      if (import.meta.env.DEV) console.error("Error starting fast:", error);
      set({ error: message });
    }
  },

  endFasting: async (completed: boolean) => {
    const state = get();
    if (!state.userId || !state.activeFastingSession?.id) return;
    try {
      await endFastingSessionInDB(state.activeFastingSession.id, state.userId, completed);
      await get().fetchFastingSessions(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to end fasting session");
      if (import.meta.env.DEV) console.error("Error ending fast:", error);
      set({ error: message });
    }
  },

  // Feature 19 - Export/Import
  exportData: async () => {
    const state = get();
    if (!state.userId) return null;
    try {
      return await exportAllData(state.userId);
    } catch (error) {
      const message = mapDbError(error, "Failed to export data");
      if (import.meta.env.DEV) console.error("Error exporting data:", error);
      set({ error: message });
      return null;
    }
  },

  importData: async (payload: BackupPayload) => {
    const state = get();
    if (!state.userId) return null;
    try {
      const result = await importBackup(payload, state.userId);
      await get().fetchInitialData(state.userId);
      return result;
    } catch (error) {
      const message = mapDbError(error, "Failed to import data");
      if (import.meta.env.DEV) console.error("Error importing data:", error);
      set({ error: message });
      return null;
    }
  },

  // Feature 15 - Diet Profiles
  fetchDietProfile: async (userId: UserId) => {
    try {
      const profile = await getDietProfileFromDB(userId);
      set({ dietProfile: profile });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching diet profile:", error);
    }
  },

  saveDietProfile: async (preset: DietPreset, restrictions: RestrictionFlag[]) => {
    const state = get();
    if (!state.userId) return;
    try {
      const profile: DietProfile = {
        userId: state.userId,
        preset,
        restrictions,
        updatedAt: new Date().toISOString(),
      };
      await saveDietProfileToDB(profile);
      set({ dietProfile: profile });
      toast.success(`Diet profile set to ${DIET_PRESETS[preset].label}`);
    } catch (error) {
      const message = mapDbError(error, "Failed to save diet profile");
      if (import.meta.env.DEV) console.error("Error saving diet profile:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  // Feature 7 - Recurring Meals
  fetchRecurringMeals: async (userId: UserId) => {
    try {
      const meals = await getRecurringMealsFromDB(userId);
      set({ recurringMeals: meals });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching recurring meals:", error);
    }
  },

  addRecurringMeal: async (meal: Omit<RecurringMeal, "id" | "userId">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addRecurringMealToDB({ ...meal, userId: state.userId });
      const meals = await getRecurringMealsFromDB(state.userId);
      set({ recurringMeals: meals });
      toast.success(`"${meal.name}" added to recurring meals`);
    } catch (error) {
      const message = mapDbError(error, "Failed to add recurring meal");
      if (import.meta.env.DEV) console.error("Error adding recurring meal:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  updateRecurringMeal: async (meal: RecurringMeal) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateRecurringMealInDB(meal, state.userId);
      const meals = await getRecurringMealsFromDB(state.userId);
      set({ recurringMeals: meals });
    } catch (error) {
      const message = mapDbError(error, "Failed to update recurring meal");
      if (import.meta.env.DEV) console.error("Error updating recurring meal:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteRecurringMeal: async (id: RecurringMealId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteRecurringMealFromDB(id, state.userId);
      const meals = await getRecurringMealsFromDB(state.userId);
      set({ recurringMeals: meals });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete recurring meal");
      if (import.meta.env.DEV) console.error("Error deleting recurring meal:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  checkAndPromptRecurringMeals: () => {
    const { recurringMeals: meals, dailyLogs, userId, addFoodLog } = get();
    if (!userId || meals.length === 0) return;
    const dayBit = 1 << getTodayDayIndex();
    const todayMeals = meals.filter((m) => m.dayMask & dayBit);
    for (const meal of todayMeals) {
      const alreadyLogged = meal.foods.some((f) =>
        dailyLogs.some((log) => log.name === f.name && log.mealType === meal.mealType),
      );
      if (!alreadyLogged) {
        toast(`Scheduled: ${meal.name}`, {
          description: `${meal.mealType} at ${meal.scheduledTime}`,
          action: {
            label: "Log now",
            onClick: () => {
              void Promise.all(
                meal.foods.map((f) =>
                  addFoodLog({
                    userId: userId!,
                    name: f.name,
                    calories: f.calories,
                    servingSize: f.servingSize,
                    protein: f.protein,
                    carbs: f.carbs,
                    fat: f.fat,
                    dateLogged: todayISO(),
                    isFavorite: false,
                    mealType: f.mealType,
                  }),
                ),
              );
            },
          },
        });
      }
    }
  },

  // Feature 17 - Reminders
  fetchReminders: async (userId: UserId) => {
    try {
      const data = await getRemindersFromDB(userId);
      set({ reminders: data });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching reminders:", error);
    }
  },

  saveReminder: async (reminder: Omit<Reminder, "userId"> & { id?: ReminderId }) => {
    const state = get();
    if (!state.userId) return;
    try {
      await upsertReminderInDB({ ...reminder, userId: state.userId } as Reminder);
      const data = await getRemindersFromDB(state.userId);
      set({ reminders: data });
    } catch (error) {
      const message = mapDbError(error, "Failed to save reminder");
      if (import.meta.env.DEV) console.error("Error saving reminder:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteReminder: async (id: ReminderId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteReminderFromDB(id, state.userId);
      const data = await getRemindersFromDB(state.userId);
      set({ reminders: data });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete reminder");
      if (import.meta.env.DEV) console.error("Error deleting reminder:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  // Feature 16 - Meal Templates & Plans
  fetchMealTemplates: async (userId: UserId) => {
    try {
      const templates = await getMealTemplatesFromDB(userId);
      set({ mealTemplates: templates });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching meal templates:", error);
    }
  },

  addMealTemplate: async (template: Pick<MealTemplate, "name" | "foods">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addMealTemplateToDB({
        ...template,
        userId: state.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const templates = await getMealTemplatesFromDB(state.userId);
      set({ mealTemplates: templates });
      toast.success(`Template "${template.name}" saved`);
    } catch (error) {
      const message = mapDbError(error, "Failed to save template");
      if (import.meta.env.DEV) console.error("Error adding meal template:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  updateMealTemplate: async (template: MealTemplate) => {
    const state = get();
    if (!state.userId) return;
    try {
      await updateMealTemplateInDB(template, state.userId);
      const templates = await getMealTemplatesFromDB(state.userId);
      set({ mealTemplates: templates });
    } catch (error) {
      const message = mapDbError(error, "Failed to update template");
      if (import.meta.env.DEV) console.error("Error updating meal template:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteMealTemplate: async (id: MealTemplateId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteMealTemplateFromDB(id, state.userId);
      const templates = await getMealTemplatesFromDB(state.userId);
      set({ mealTemplates: templates });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete template");
      if (import.meta.env.DEV) console.error("Error deleting meal template:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  saveTemplateFromTodayLogs: async (name: string) => {
    const state = get();
    if (!state.userId || !name.trim()) return;
    try {
      const foods: MealTemplateFood[] = state.dailyLogs.map((log) => ({
        name: log.name,
        calories: log.calories,
        servingSize: log.servingSize,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        mealType: log.mealType ?? "Breakfast",
      }));
      await addMealTemplateToDB({
        userId: state.userId,
        name: name.trim(),
        foods,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const templates = await getMealTemplatesFromDB(state.userId);
      set({ mealTemplates: templates });
      toast.success(`Template "${name}" saved from today's logs`);
    } catch (error) {
      const message = mapDbError(error, "Failed to save template from today");
      if (import.meta.env.DEV) console.error("Error saving template from today:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  logAllFoodsFromTemplate: async (id: MealTemplateId) => {
    const state = get();
    if (!state.userId) return;
    try {
      const template = state.mealTemplates.find((t) => t.id === id);
      if (!template) return;
      await Promise.all(
        template.foods.map((f) =>
          addFoodItemLog({
            userId: state.userId!,
            name: f.name,
            calories: f.calories,
            servingSize: f.servingSize,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            dateLogged: todayISO(),
            isFavorite: false,
            mealType: f.mealType,
          }),
        ),
      );
      await get().refreshDailyLogs(state.userId);
      toast.success(`Logged ${template.foods.length} items from "${template.name}"`);
    } catch (error) {
      const message = mapDbError(error, "Failed to log template foods");
      if (import.meta.env.DEV) console.error("Error logging template:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  copyFoodsFromDate: async (date: ISODate) => {
    const state = get();
    if (!state.userId) return;
    try {
      const logs = await getDailyFoodLogs(state.userId, date);
      await Promise.all(
        logs.map((f) =>
          addFoodItemLog({
            userId: state.userId!,
            name: f.name,
            calories: f.calories,
            servingSize: f.servingSize,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            dateLogged: todayISO(),
            isFavorite: false,
            mealType: f.mealType ?? "Breakfast",
          }),
        ),
      );
      await get().refreshDailyLogs(state.userId);
      toast.success(`Copied ${logs.length} items from ${date}`);
    } catch (error) {
      const message = mapDbError(error, "Failed to copy foods from date");
      if (import.meta.env.DEV) console.error("Error copying foods from date:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  fetchMealPlans: async (userId: UserId) => {
    try {
      const plans = await getMealPlansFromDB(userId);
      set({ mealPlans: plans });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching meal plans:", error);
    }
  },

  saveMealPlan: async (plan: Pick<MealPlan, "name" | "days">) => {
    const state = get();
    if (!state.userId) return;
    try {
      await addMealPlanToDB({
        ...plan,
        userId: state.userId,
        createdAt: new Date().toISOString(),
      });
      const plans = await getMealPlansFromDB(state.userId);
      set({ mealPlans: plans });
      toast.success(`Plan "${plan.name}" saved`);
    } catch (error) {
      const message = mapDbError(error, "Failed to save meal plan");
      if (import.meta.env.DEV) console.error("Error saving meal plan:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  deleteMealPlan: async (id: MealPlanId) => {
    const state = get();
    if (!state.userId) return;
    try {
      await deleteMealPlanFromDB(id, state.userId);
      const plans = await getMealPlansFromDB(state.userId);
      set({ mealPlans: plans });
    } catch (error) {
      const message = mapDbError(error, "Failed to delete meal plan");
      if (import.meta.env.DEV) console.error("Error deleting meal plan:", error);
      set({ error: message });
      toast.error(message);
    }
  },

  applyWeekPlan: async (planId: MealPlanId) => {
    const state = get();
    if (!state.userId) return;
    try {
      const plan = state.mealPlans.find((p) => p.id === planId);
      if (!plan) return;
      const todayIndex = getTodayDayIndex();
      const dayEntry = plan.days.find((d) => d.dayIndex === todayIndex);
      if (!dayEntry?.templateId) {
        toast("No template assigned for today in this plan");
        return;
      }
      await get().logAllFoodsFromTemplate(dayEntry.templateId);
    } catch (error) {
      const message = mapDbError(error, "Failed to apply meal plan");
      if (import.meta.env.DEV) console.error("Error applying meal plan:", error);
      set({ error: message });
      toast.error(message);
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

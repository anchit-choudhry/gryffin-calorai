import type { StateCreator } from "zustand";
import type { AppState } from "../AppState";
import { mapDbError } from "../../lib/utils";
import { toast } from "sonner";
import {
  addFoodItemLog,
  addMealPlan as addMealPlanToDB,
  addMealTemplate as addMealTemplateToDB,
  addRecurringMeal as addRecurringMealToDB,
  addUserAchievement as addUserAchievementToDB,
  type BackupPayload,
  deleteMealPlan as deleteMealPlanFromDB,
  deleteMealTemplate as deleteMealTemplateFromDB,
  deleteRecurringMeal as deleteRecurringMealFromDB,
  deleteReminder as deleteReminderFromDB,
  type DietProfile,
  exportAllData,
  getAllFoodLogs,
  getAllWaterLogs,
  getDailyFoodLogs,
  getDietProfile as getDietProfileFromDB,
  getMealPlans as getMealPlansFromDB,
  getMealTemplates as getMealTemplatesFromDB,
  getRecurringMeals as getRecurringMealsFromDB,
  getReminders as getRemindersFromDB,
  getTdeeProfile,
  getUnlockedAchievementIds,
  getUnlockedAchievements,
  type ImportableBackup,
  importBackup,
  type ImportResult,
  type MealPlan,
  type MealTemplate,
  type MealTemplateFood,
  type RecurringMeal,
  type Reminder,
  saveDietProfile as saveDietProfileToDB,
  saveTdeeProfile as saveTdeeProfileToDB,
  type TdeeProfile,
  updateMealTemplate as updateMealTemplateInDB,
  updateRecurringMeal as updateRecurringMealInDB,
  upsertReminder as upsertReminderInDB,
  type UserAchievement,
} from "../../db/dbService";
import type {
  DietPreset,
  ISODate,
  MealPlanId,
  MealTemplateId,
  RecurringMealId,
  ReminderId,
  RestrictionFlag,
  UserId,
} from "@/types";
import { DIET_PRESETS, getTodayDayIndex, todayISO } from "@/types";
import { evaluateAchievements } from "../../lib/achievements";
import { computeCalorieGoal, computeTDEE, mifflinStJeorBMR } from "../../lib/tdee";
import { enqueueSyncOperation } from "../../hooks/useSyncService";

export interface SettingsSlice {
  tdeeProfile: TdeeProfile | null;
  dietProfile: DietProfile | null;
  recurringMeals: RecurringMeal[];
  reminders: Reminder[];
  mealTemplates: MealTemplate[];
  mealPlans: MealPlan[];
  unlockedAchievements: UserAchievement[];
  pendingAchievementId: string | null;
  dismissAchievement: () => void;
  fetchTdeeProfile: (userId: UserId) => Promise<void>;
  saveTdeeProfile: (profile: Omit<TdeeProfile, "id" | "userId" | "updatedAt">) => Promise<void>;
  fetchDietProfile: (userId: UserId) => Promise<void>;
  saveDietProfile: (preset: DietPreset, restrictions: RestrictionFlag[]) => Promise<void>;
  fetchRecurringMeals: (userId: UserId) => Promise<void>;
  addRecurringMeal: (meal: Omit<RecurringMeal, "id" | "userId">) => Promise<void>;
  updateRecurringMeal: (meal: RecurringMeal) => Promise<void>;
  deleteRecurringMeal: (id: RecurringMealId) => Promise<void>;
  checkAndPromptRecurringMeals: () => void;
  fetchReminders: (userId: UserId) => Promise<void>;
  saveReminder: (reminder: Omit<Reminder, "userId"> & { id?: ReminderId }) => Promise<void>;
  deleteReminder: (id: ReminderId) => Promise<void>;
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
  exportData: () => Promise<BackupPayload | null>;
  importData: (payload: ImportableBackup) => Promise<ImportResult | null>;
  fetchAchievements: (userId: UserId) => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
  tdeeProfile: null,
  dietProfile: null,
  recurringMeals: [],
  reminders: [],
  mealTemplates: [],
  mealPlans: [],
  unlockedAchievements: [],
  pendingAchievementId: null,
  dismissAchievement: () => set({ pendingAchievementId: null }),

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
      void enqueueSyncOperation({
        userId: state.userId,
        entityType: "tdeeProfile",
        syncId: "tdeeProfile",
        operation: "create",
        payload: profile,
      });
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

  importData: async (payload: ImportableBackup) => {
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
      if (newIds.length > 0) {
        set({ pendingAchievementId: newIds[0] });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Achievement check failed:", err);
    }
  },
});

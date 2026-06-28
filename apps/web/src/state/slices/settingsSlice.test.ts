import { beforeEach, describe, expect, it, vi } from "vitest";
import { create, type StateCreator } from "zustand";
import { createSettingsSlice, type CustomMacroGoals, type SettingsSlice } from "./settingsSlice";
import type {
  DietProfile,
  ImportableBackup,
  MealPlan,
  MealTemplate,
  RecurringMeal,
  Reminder,
  TdeeProfile,
} from "../../db/dbService";
import { addMealTemplate, deleteRecurringMeal, updateMealTemplate } from "../../db/dbService";
import type {
  DietPreset,
  ISODate,
  MealPlanId,
  MealTemplateId,
  RecurringMealId,
  ReminderId,
  ReminderType,
  UserId,
} from "@/types";
import * as syncService from "../../hooks/useSyncService";

const mockToast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
const mockGetTdeeProfile = vi.hoisted(() => vi.fn());
const mockGetDietProfile = vi.hoisted(() => vi.fn());
const mockGetRecurringMeals = vi.hoisted(() => vi.fn());
const mockGetAllFoodLogs = vi.hoisted(() => vi.fn());
const mockGetAllWaterLogs = vi.hoisted(() => vi.fn());
const mockGetUnlockedAchievementIds = vi.hoisted(() => vi.fn());
const mockGetUnlockedAchievements = vi.hoisted(() => vi.fn());
const mockEvaluateAchievements = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: mockToast }));
const mockGetMealPlans = vi.hoisted(() => vi.fn());
const mockDeleteMealPlan = vi.hoisted(() => vi.fn());
const mockAddMealPlan = vi.hoisted(() => vi.fn());
const mockGetDailyFoodLogs = vi.hoisted(() => vi.fn());
const mockAddFoodItemLog = vi.hoisted(() => vi.fn());
const mockExportAllData = vi.hoisted(() => vi.fn());
const mockImportBackup = vi.hoisted(() => vi.fn());
const mockSaveTdeeProfile = vi.hoisted(() => vi.fn());
const mockSaveDietProfile = vi.hoisted(() => vi.fn());

vi.mock("../../db/dbService", () => ({
  getTdeeProfile: mockGetTdeeProfile,
  saveTdeeProfile: mockSaveTdeeProfile,
  getDietProfile: mockGetDietProfile,
  saveDietProfile: mockSaveDietProfile,
  getRecurringMeals: mockGetRecurringMeals,
  addRecurringMeal: vi.fn().mockResolvedValue(undefined),
  updateRecurringMeal: vi.fn().mockResolvedValue(undefined),
  deleteRecurringMeal: vi.fn().mockResolvedValue(undefined),
  getReminders: vi.fn().mockResolvedValue([]),
  upsertReminder: vi.fn().mockResolvedValue(undefined),
  deleteReminder: vi.fn().mockResolvedValue(undefined),
  getMealTemplates: vi.fn().mockResolvedValue([]),
  addMealTemplate: vi.fn().mockResolvedValue(undefined),
  updateMealTemplate: vi.fn().mockResolvedValue(undefined),
  deleteMealTemplate: vi.fn().mockResolvedValue(undefined),
  getMealPlans: mockGetMealPlans,
  addMealPlan: mockAddMealPlan,
  deleteMealPlan: mockDeleteMealPlan,
  addFoodItemLog: mockAddFoodItemLog,
  getDailyFoodLogs: mockGetDailyFoodLogs,
  exportAllData: mockExportAllData,
  importBackup: mockImportBackup,
  getAllFoodLogs: mockGetAllFoodLogs,
  getAllWaterLogs: mockGetAllWaterLogs,
  getUnlockedAchievements: mockGetUnlockedAchievements,
  getUnlockedAchievementIds: mockGetUnlockedAchievementIds,
  addUserAchievement: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../hooks/useSyncService", () => ({
  enqueueSyncOperation: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../lib/achievements", () => ({
  evaluateAchievements: mockEvaluateAchievements,
}));

type TestLog = {
  name: string;
  mealType: string;
  calories: number;
  servingSize: string;
  protein: number;
  carbs: number;
  fat: number;
};

type TestState = SettingsSlice & {
  userId: UserId | null;
  dailyLogs: TestLog[];
  init: { status: string; user: { calorieGoal: number } };
  bodyMeasurements: unknown[];
  recipes: unknown[];
  waterGoalMl: number;
  error: string | null;
  updateCalorieGoal: (goal: number) => Promise<void>;
  refreshDailyLogs: (userId: UserId) => Promise<void>;
  fetchInitialData: (userId: UserId) => Promise<void>;
  addFoodLog: (food: unknown) => Promise<void>;
};

function makeStore() {
  return create<TestState>()((set, get, api) => ({
    userId: null,
    dailyLogs: [],
    init: { status: "ready", user: { calorieGoal: 2000 } },
    bodyMeasurements: [],
    recipes: [],
    waterGoalMl: 2000,
    error: null,
    updateCalorieGoal: vi.fn().mockResolvedValue(undefined),
    refreshDailyLogs: vi.fn().mockResolvedValue(undefined),
    fetchInitialData: vi.fn().mockResolvedValue(undefined),
    addFoodLog: vi.fn().mockResolvedValue(undefined),
    ...(createSettingsSlice as unknown as StateCreator<TestState, [], [], SettingsSlice>)(
      set,
      get,
      api,
    ),
  }));
}

describe("settingsSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockGetTdeeProfile.mockResolvedValue(null);
    mockGetDietProfile.mockResolvedValue(null);
    mockGetRecurringMeals.mockResolvedValue([]);
    mockGetAllFoodLogs.mockResolvedValue([]);
    mockGetAllWaterLogs.mockResolvedValue([]);
    mockGetUnlockedAchievementIds.mockResolvedValue([]);
    mockGetUnlockedAchievements.mockResolvedValue([]);
    mockEvaluateAchievements.mockReturnValue([]);
    mockGetMealPlans.mockResolvedValue([]);
    mockDeleteMealPlan.mockResolvedValue(undefined);
    mockAddMealPlan.mockResolvedValue(undefined);
    mockGetDailyFoodLogs.mockResolvedValue([]);
    mockAddFoodItemLog.mockResolvedValue(undefined);
    mockExportAllData.mockResolvedValue({ version: 1 });
    mockImportBackup.mockResolvedValue({ imported: 5, skipped: 1 });
    mockSaveTdeeProfile.mockResolvedValue(undefined);
    mockSaveDietProfile.mockResolvedValue(undefined);
  });

  describe("adaptiveTdeeEnabled", () => {
    it("initializes false when localStorage is empty", () => {
      const store = makeStore();
      expect(store.getState().adaptiveTdeeEnabled).toBe(false);
    });

    it("initializes true when localStorage has 'true'", () => {
      localStorage.setItem("gc_adaptive_tdee", "true");
      const store = makeStore();
      expect(store.getState().adaptiveTdeeEnabled).toBe(true);
    });

    it("setAdaptiveTdeeEnabled(true) updates state and persists to localStorage", () => {
      const store = makeStore();
      store.getState().setAdaptiveTdeeEnabled(true);
      expect(store.getState().adaptiveTdeeEnabled).toBe(true);
      expect(localStorage.getItem("gc_adaptive_tdee")).toBe("true");
    });

    it("setAdaptiveTdeeEnabled(false) updates state and persists to localStorage", () => {
      localStorage.setItem("gc_adaptive_tdee", "true");
      const store = makeStore();
      store.getState().setAdaptiveTdeeEnabled(false);
      expect(store.getState().adaptiveTdeeEnabled).toBe(false);
      expect(localStorage.getItem("gc_adaptive_tdee")).toBe("false");
    });
  });

  describe("customMacroGoals", () => {
    it("initializes null when localStorage is empty", () => {
      const store = makeStore();
      expect(store.getState().customMacroGoals).toBeNull();
    });

    it("initializes from localStorage when valid JSON is stored", () => {
      const goals: CustomMacroGoals = { proteinG: 150, carbsG: 200, fatG: 60 };
      localStorage.setItem("gc_custom_macros", JSON.stringify(goals));
      const store = makeStore();
      expect(store.getState().customMacroGoals).toStrictEqual(goals);
    });

    it("initializes null when localStorage contains invalid JSON", () => {
      localStorage.setItem("gc_custom_macros", "not-json{");
      const store = makeStore();
      expect(store.getState().customMacroGoals).toBeNull();
    });

    it("setCustomMacroGoals with object persists and updates state", () => {
      const store = makeStore();
      const goals: CustomMacroGoals = { proteinG: 160 };
      store.getState().setCustomMacroGoals(goals);
      expect(store.getState().customMacroGoals).toStrictEqual(goals);
      expect(JSON.parse(localStorage.getItem("gc_custom_macros") ?? "null")).toStrictEqual(goals);
    });

    it("setCustomMacroGoals(null) removes localStorage key and clears state", () => {
      localStorage.setItem("gc_custom_macros", JSON.stringify({ proteinG: 150 }));
      const store = makeStore();
      store.getState().setCustomMacroGoals(null);
      expect(store.getState().customMacroGoals).toBeNull();
      expect(localStorage.getItem("gc_custom_macros")).toBeNull();
    });
  });

  describe("dismissAchievement", () => {
    it("sets pendingAchievementId to null", () => {
      const store = makeStore();
      store.setState({ pendingAchievementId: "streak_7" });
      store.getState().dismissAchievement();
      expect(store.getState().pendingAchievementId).toBeNull();
    });
  });

  describe("checkAndPromptRecurringMeals", () => {
    it("no-op when userId is null", () => {
      const store = makeStore();
      store.getState().checkAndPromptRecurringMeals();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("no-op when recurringMeals is empty", () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      store.getState().checkAndPromptRecurringMeals();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("shows toast for a meal scheduled today that has not been logged", () => {
      const store = makeStore();
      const meal: RecurringMeal = {
        id: 1 as unknown as RecurringMealId,
        userId: "user-1" as UserId,
        name: "Morning Oats",
        mealType: "Breakfast",
        scheduledTime: "08:00",
        dayMask: 0x7f, // all 7 days - always matches today
        foods: [
          {
            name: "Oatmeal",
            calories: 300,
            servingSize: 150,
            protein: 10,
            carbs: 50,
            fat: 6,
            mealType: "Breakfast",
          },
        ],
      };
      store.setState({ userId: "user-1" as UserId, recurringMeals: [meal], dailyLogs: [] });
      store.getState().checkAndPromptRecurringMeals();
      expect(mockToast).toHaveBeenCalledWith(
        "Scheduled: Morning Oats",
        expect.objectContaining({ description: "Breakfast at 08:00" }),
      );
    });

    it("skips meals that are already logged", () => {
      const store = makeStore();
      const meal: RecurringMeal = {
        id: 1 as unknown as RecurringMealId,
        userId: "user-1" as UserId,
        name: "Morning Oats",
        mealType: "Breakfast",
        scheduledTime: "08:00",
        dayMask: 0x7f,
        foods: [
          {
            name: "Oatmeal",
            calories: 300,
            servingSize: 150,
            protein: 10,
            carbs: 50,
            fat: 6,
            mealType: "Breakfast",
          },
        ],
      };
      const existingLog: TestLog = {
        name: "Oatmeal",
        mealType: "Breakfast",
        calories: 300,
        servingSize: "1 cup",
        protein: 10,
        carbs: 50,
        fat: 6,
      };
      store.setState({
        userId: "user-1" as UserId,
        recurringMeals: [meal],
        dailyLogs: [existingLog],
      });
      store.getState().checkAndPromptRecurringMeals();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("invokes addFoodLog for each food when the toast action onClick is called", () => {
      const store = makeStore();
      const meal: RecurringMeal = {
        id: 2 as unknown as RecurringMealId,
        userId: "user-1" as UserId,
        name: "Lunch Special",
        mealType: "Lunch",
        scheduledTime: "12:00",
        dayMask: 0x7f,
        foods: [
          {
            name: "Rice",
            calories: 200,
            servingSize: 150,
            protein: 5,
            carbs: 45,
            fat: 1,
            mealType: "Lunch",
          },
        ],
      };
      store.setState({ userId: "user-1" as UserId, recurringMeals: [meal], dailyLogs: [] });
      store.getState().checkAndPromptRecurringMeals();

      const toastOptions = (
        mockToast.mock.calls[0] as [string, { action: { onClick: () => void } }]
      )[1];
      toastOptions.action.onClick();

      expect(store.getState().addFoodLog).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Rice", calories: 200 }),
      );
    });
  });

  describe("fetchTdeeProfile", () => {
    it("sets tdeeProfile when DB returns a profile", async () => {
      const profile = {
        sex: "male",
        weightKg: 80,
        heightCm: 178,
        age: 30,
        activityLevel: "moderate",
        goal: "maintain",
        updatedAt: "",
      } as TdeeProfile;
      mockGetTdeeProfile.mockResolvedValueOnce(profile);
      const store = makeStore();
      await store.getState().fetchTdeeProfile("user-1" as UserId);
      expect(store.getState().tdeeProfile).toStrictEqual(profile);
    });

    it("sets tdeeProfile to null when DB returns null", async () => {
      mockGetTdeeProfile.mockResolvedValueOnce(null);
      const store = makeStore();
      await store.getState().fetchTdeeProfile("user-1" as UserId);
      expect(store.getState().tdeeProfile).toBeNull();
    });
  });

  describe("fetchDietProfile", () => {
    it("sets dietProfile when DB returns a profile", async () => {
      const profile = {
        userId: "user-1" as UserId,
        preset: "generic" as DietPreset,
        restrictions: [],
        updatedAt: "",
      } as DietProfile;
      mockGetDietProfile.mockResolvedValueOnce(profile);
      const store = makeStore();
      await store.getState().fetchDietProfile("user-1" as UserId);
      expect(store.getState().dietProfile).toStrictEqual(profile);
    });
  });

  describe("fetchRecurringMeals", () => {
    it("populates recurringMeals from DB", async () => {
      const meals: RecurringMeal[] = [
        {
          id: 1 as unknown as RecurringMealId,
          userId: "user-1" as UserId,
          name: "Oats",
          mealType: "Breakfast",
          scheduledTime: "08:00",
          dayMask: 0x7f,
          foods: [],
        },
      ];
      mockGetRecurringMeals.mockResolvedValueOnce(meals);
      const store = makeStore();
      await store.getState().fetchRecurringMeals("user-1" as UserId);
      expect(store.getState().recurringMeals).toStrictEqual(meals);
    });
  });

  describe("saveDietProfile", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().saveDietProfile("generic", []);
      expect(store.getState().dietProfile).toBeNull();
    });
  });

  describe("applyWeekPlan", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().applyWeekPlan(1 as unknown as MealPlanId);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("no-op when plan is not found in mealPlans", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId, mealPlans: [] });
      await store.getState().applyWeekPlan(1 as unknown as MealPlanId);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("shows toast when no template is assigned for today", async () => {
      const store = makeStore();
      const plan: MealPlan = {
        id: 1 as unknown as MealPlanId,
        userId: "user-1" as UserId,
        name: "My Plan",
        days: [],
        createdAt: "",
      };
      store.setState({ userId: "user-1" as UserId, mealPlans: [plan] });
      await store.getState().applyWeekPlan(1 as unknown as MealPlanId);
      expect(mockToast).toHaveBeenCalledWith("No template assigned for today in this plan");
    });

    it("sets error when logAllFoodsFromTemplate throws", async () => {
      mockAddFoodItemLog.mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      const templateId = 10 as unknown as MealTemplateId;
      const plan: MealPlan = {
        id: 1 as unknown as MealPlanId,
        userId: "user-1" as UserId,
        name: "My Plan",
        days: Array.from({ length: 7 }, (_, dayIndex) => ({ dayIndex, templateId })),
        createdAt: "",
      };
      const template: MealTemplate = {
        id: templateId,
        userId: "user-1" as UserId,
        name: "Template",
        foods: [
          {
            name: "Apple",
            calories: 100,
            servingSize: 150,
            protein: 0,
            carbs: 25,
            fat: 0,
            mealType: "Breakfast" as const,
          },
        ],
        createdAt: "",
        updatedAt: "",
      };
      store.setState({
        userId: "user-1" as UserId,
        mealPlans: [plan],
        mealTemplates: [template],
      });
      await store.getState().applyWeekPlan(1 as unknown as MealPlanId);
      expect(store.getState().error).toBeTruthy();
    });

    it("sets error when logAllFoodsFromTemplate itself rejects (applyWeekPlan catch block)", async () => {
      // logAllFoodsFromTemplate has its own try/catch and swallows errors internally, so
      // the only way to reach applyWeekPlan's catch block is to override the function in
      // the store state with one that actually rejects. Zustand setState does a shallow
      // merge so the get() call inside applyWeekPlan picks up the replacement.
      const store = makeStore();
      const templateId = 10 as unknown as MealTemplateId;
      const plan: MealPlan = {
        id: 1 as unknown as MealPlanId,
        userId: "user-1" as UserId,
        name: "My Plan",
        days: Array.from({ length: 7 }, (_, dayIndex) => ({ dayIndex, templateId })),
        createdAt: "",
      };
      store.setState({
        userId: "user-1" as UserId,
        mealPlans: [plan],
        logAllFoodsFromTemplate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Unexpected rejection")) as unknown as (
          id: MealTemplateId,
        ) => Promise<void>,
      });
      await store.getState().applyWeekPlan(1 as unknown as MealPlanId);
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe("checkAndUnlockAchievements", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().checkAndUnlockAchievements();
      expect(mockEvaluateAchievements).not.toHaveBeenCalled();
    });

    it("no-op when init.status is not 'ready'", async () => {
      const store = makeStore();
      store.setState({
        userId: "user-1" as UserId,
        init: { status: "loading", user: { calorieGoal: 0 } },
      });
      await store.getState().checkAndUnlockAchievements();
      expect(mockEvaluateAchievements).not.toHaveBeenCalled();
    });

    it("no-op when evaluateAchievements returns no new achievements", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().checkAndUnlockAchievements();
      expect(store.getState().pendingAchievementId).toBeNull();
    });

    it("sets pendingAchievementId when new achievements are unlocked", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      mockEvaluateAchievements.mockReturnValueOnce(["streak_7"]);
      await store.getState().checkAndUnlockAchievements();
      expect(store.getState().pendingAchievementId).toBe("streak_7");
    });
  });

  describe("exportData", () => {
    it("returns null when userId is null", async () => {
      const store = makeStore();
      const result = await store.getState().exportData();
      expect(result).toBeNull();
    });

    it("returns backup payload when userId is set", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const result = await store.getState().exportData();
      expect(result).toStrictEqual({ version: 1 });
    });
  });

  describe("importData", () => {
    it("returns null when userId is null", async () => {
      const store = makeStore();
      const result = await store.getState().importData({} as ImportableBackup);
      expect(result).toBeNull();
    });

    it("returns import result when userId is set", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const result = await store.getState().importData({} as ImportableBackup);
      expect(result).toStrictEqual({ imported: 5, skipped: 1 });
    });
  });

  describe("saveMealPlan", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().saveMealPlan({ name: "Test", days: [] });
      expect(mockAddMealPlan).not.toHaveBeenCalled();
    });

    it("calls addMealPlan and refreshes plans when userId is set", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const newPlan: MealPlan = {
        id: 1 as unknown as MealPlanId,
        userId: "user-1" as UserId,
        name: "Week A",
        days: [],
        createdAt: "",
      };
      mockGetMealPlans.mockResolvedValueOnce([newPlan]);
      await store.getState().saveMealPlan({ name: "Week A", days: [] });
      expect(mockAddMealPlan).toHaveBeenCalledTimes(1);
      expect(store.getState().mealPlans).toStrictEqual([newPlan]);
      expect(mockToast.success).toHaveBeenCalledWith('Plan "Week A" saved');
    });

    it("sets error and shows error toast when addMealPlan throws", async () => {
      mockAddMealPlan.mockRejectedValueOnce(new Error("DB write failed"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().saveMealPlan({ name: "Failing Plan", days: [] });
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe("deleteMealPlan", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().deleteMealPlan(1 as unknown as MealPlanId);
      expect(mockDeleteMealPlan).not.toHaveBeenCalled();
    });

    it("removes plan and refreshes list when userId is set", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      mockGetMealPlans.mockResolvedValueOnce([]);
      await store.getState().deleteMealPlan(1 as unknown as MealPlanId);
      expect(mockDeleteMealPlan).toHaveBeenCalledTimes(1);
      expect(store.getState().mealPlans).toStrictEqual([]);
    });

    it("sets error when deleteMealPlan throws", async () => {
      mockDeleteMealPlan.mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().deleteMealPlan(1 as unknown as MealPlanId);
      expect(store.getState().error).toBeTruthy();
    });
  });

  describe("copyFoodsFromDate", () => {
    it("no-op when userId is null", async () => {
      const store = makeStore();
      await store.getState().copyFoodsFromDate("2026-06-01" as ISODate);
      expect(mockGetDailyFoodLogs).not.toHaveBeenCalled();
    });

    it("copies foods from the given date and refreshes logs when userId is set", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const logs = [
        {
          name: "Oatmeal",
          calories: 300,
          servingSize: "1 cup",
          protein: 10,
          carbs: 50,
          fat: 6,
          mealType: "Breakfast" as const,
        },
      ];
      mockGetDailyFoodLogs.mockResolvedValueOnce(logs);
      await store.getState().copyFoodsFromDate("2026-06-01" as ISODate);
      expect(mockAddFoodItemLog).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith("Copied 1 items from 2026-06-01");
    });

    it("sets error and shows error toast when addFoodItemLog throws", async () => {
      vi.stubEnv("DEV", true);
      vi.spyOn(console, "error").mockImplementation(() => {});
      const logs = [
        {
          name: "Oatmeal",
          calories: 300,
          servingSize: "1 cup",
          protein: 10,
          carbs: 50,
          fat: 6,
          mealType: "Breakfast" as const,
        },
      ];
      mockGetDailyFoodLogs.mockResolvedValueOnce(logs);
      mockAddFoodItemLog.mockRejectedValueOnce(new Error("DB write failed"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().copyFoodsFromDate("2026-06-01" as ISODate);
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
      vi.unstubAllEnvs();
    });
  });

  describe("saveTemplateFromTodayLogs", () => {
    it("sets error and shows error toast when addMealTemplate throws", async () => {
      vi.stubEnv("DEV", true);
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(addMealTemplate).mockRejectedValueOnce(new Error("DB error"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().saveTemplateFromTodayLogs("Fail Template");
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
      vi.unstubAllEnvs();
    });
  });

  describe("fetchMealPlans", () => {
    it("populates mealPlans from DB", async () => {
      const plans: MealPlan[] = [
        {
          id: 1 as unknown as MealPlanId,
          userId: "user-1" as UserId,
          name: "My Plan",
          days: [],
          createdAt: "",
        },
      ];
      mockGetMealPlans.mockResolvedValueOnce(plans);
      const store = makeStore();
      await store.getState().fetchMealPlans("user-1" as UserId);
      expect(store.getState().mealPlans).toStrictEqual(plans);
    });
  });

  describe("saveDietProfile with userId", () => {
    it("enqueues create when no existing dietProfile", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId, dietProfile: null });
      await store.getState().saveDietProfile("generic", []);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "dietProfile", operation: "create" }),
      );
    });

    it("enqueues update when dietProfile already exists", async () => {
      const store = makeStore();
      const existing: DietProfile = {
        userId: "user-1" as UserId,
        preset: "vegetarian" as DietPreset,
        restrictions: [],
        updatedAt: new Date().toISOString(),
        syncId: "existing-sync-id",
      };
      store.setState({ userId: "user-1" as UserId, dietProfile: existing });
      await store.getState().saveDietProfile("generic", []);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "dietProfile", operation: "update" }),
      );
    });
  });

  describe("saveReminder with userId", () => {
    it("enqueues create for a new reminder", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId, reminders: [] });
      await store.getState().saveReminder({
        type: "water" as ReminderType,
        time: "08:00",
        daysOfWeek: 127,
        enabled: true,
      });
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "reminder", operation: "create" }),
      );
    });

    it("looks up existing reminder by id when id is provided and enqueues update", async () => {
      const reminderId = 9 as unknown as ReminderId;
      const existing: Reminder = {
        id: reminderId,
        userId: "user-1" as UserId,
        type: "water" as ReminderType,
        time: "08:00",
        daysOfWeek: 127,
        enabled: true,
        syncId: "reminder-id-sync",
      };
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId, reminders: [existing] });
      await store.getState().saveReminder({
        id: reminderId,
        type: "water" as ReminderType,
        time: "10:00",
        daysOfWeek: 127,
        enabled: false,
      });
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "reminder", operation: "update" }),
      );
    });

    it("enqueues update when reminder type already exists", async () => {
      const store = makeStore();
      const existing: Reminder = {
        id: 1 as unknown as ReminderId,
        userId: "user-1" as UserId,
        type: "water" as ReminderType,
        time: "08:00",
        daysOfWeek: 127,
        enabled: true,
        syncId: "reminder-sync-id",
      };
      store.setState({ userId: "user-1" as UserId, reminders: [existing] });
      await store.getState().saveReminder({
        type: "water" as ReminderType,
        time: "09:00",
        daysOfWeek: 127,
        enabled: true,
      });
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "reminder", operation: "update" }),
      );
    });
  });

  describe("deleteReminder with userId and syncId", () => {
    it("enqueues delete when the reminder has a syncId", async () => {
      const store = makeStore();
      const reminderId = 5 as unknown as ReminderId;
      const existing: Reminder = {
        id: reminderId,
        userId: "user-1" as UserId,
        type: "water" as ReminderType,
        time: "08:00",
        daysOfWeek: 127,
        enabled: true,
        syncId: "reminder-to-delete-sync-id",
      };
      store.setState({ userId: "user-1" as UserId, reminders: [existing] });
      await store.getState().deleteReminder(reminderId);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "reminder",
          operation: "delete",
          syncId: "reminder-to-delete-sync-id",
        }),
      );
    });
  });

  describe("addMealTemplate with userId", () => {
    it("enqueues create and refreshes templates", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      await store.getState().addMealTemplate({ name: "Breakfast Bowl", foods: [] });
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "mealTemplate", operation: "create" }),
      );
    });
  });

  describe("updateMealTemplate with userId and syncId", () => {
    it("enqueues update when template has a syncId", async () => {
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const template: MealTemplate = {
        id: 1 as unknown as MealTemplateId,
        userId: "user-1" as UserId,
        name: "Lunch",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: "template-sync-id",
      };
      await store.getState().updateMealTemplate(template);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "mealTemplate",
          operation: "update",
          syncId: "template-sync-id",
        }),
      );
    });

    it("sets error and shows error toast when updateMealTemplate throws", async () => {
      vi.mocked(updateMealTemplate).mockRejectedValueOnce(new Error("DB write failed"));
      const store = makeStore();
      const template: MealTemplate = {
        id: 2 as unknown as MealTemplateId,
        userId: "user-1" as UserId,
        name: "Brunch",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.setState({ userId: "user-1" as UserId });
      await store.getState().updateMealTemplate(template);
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe("deleteMealTemplate with userId and syncId", () => {
    it("enqueues delete when the template has a syncId", async () => {
      const store = makeStore();
      const templateId = 3 as unknown as MealTemplateId;
      const template: MealTemplate = {
        id: templateId,
        userId: "user-1" as UserId,
        name: "Dinner",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncId: "template-delete-sync-id",
      };
      store.setState({ userId: "user-1" as UserId, mealTemplates: [template] });
      await store.getState().deleteMealTemplate(templateId);
      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "mealTemplate",
          operation: "delete",
          syncId: "template-delete-sync-id",
        }),
      );
    });
  });

  describe("exportData error path", () => {
    it("sets error and returns null when exportAllData throws", async () => {
      mockExportAllData.mockRejectedValueOnce(new Error("Disk full"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const result = await store.getState().exportData();
      expect(result).toBeNull();
    });
  });

  describe("importData error path", () => {
    it("sets error and returns null when importBackup throws", async () => {
      mockImportBackup.mockRejectedValueOnce(new Error("Corrupt file"));
      const store = makeStore();
      store.setState({ userId: "user-1" as UserId });
      const result = await store.getState().importData({} as ImportableBackup);
      expect(result).toBeNull();
    });
  });

  describe("deleteRecurringMeal error path", () => {
    it("sets error and shows error toast when deleteRecurringMeal throws", async () => {
      vi.mocked(deleteRecurringMeal).mockRejectedValueOnce(new Error("DB write failed"));
      const store = makeStore();
      const mealId = 1 as unknown as RecurringMealId;
      store.setState({ userId: "user-1" as UserId });
      await store.getState().deleteRecurringMeal(mealId);
      expect(store.getState().error).toBeTruthy();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});

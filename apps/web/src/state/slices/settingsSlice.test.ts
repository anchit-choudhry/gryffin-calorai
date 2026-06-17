import { beforeEach, describe, expect, it, vi } from "vitest";
import { create, type StateCreator } from "zustand";
import { createSettingsSlice, type CustomMacroGoals, type SettingsSlice } from "./settingsSlice";
import type {
  ImportableBackup,
  MealPlan,
  RecurringMeal,
  TdeeProfile,
  DietProfile,
} from "../../db/dbService";
import type { DietPreset, ISODate, MealPlanId, RecurringMealId, UserId } from "@/types";

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
});

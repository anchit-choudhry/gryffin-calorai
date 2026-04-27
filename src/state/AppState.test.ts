import { describe, expect, it, vi } from "vitest";
import { useAppState } from "./AppState";
import { FoodItemId, ISODate, UserId } from "../types";

vi.mock("../db/dbService", () => ({
  getOrCreateUser: vi.fn(async (userId) => ({
    id: userId,
    username: "Test User",
    email: "test@example.com",
    lastLogin: new Date().toISOString(),
    calorieGoal: 2000,
  })),
  getDailyFoodLogs: vi.fn(async () => [
    {
      id: FoodItemId(1),
      userId: UserId("1"),
      name: "Apple",
      calories: 95,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: ISODate("2026-04-26"),
    },
  ]),
  addFoodItemLog: vi.fn(async () => FoodItemId(1)),
  deleteFoodItem: vi.fn(async () => undefined),
  updateUserProfile: vi.fn(async () => undefined),
  getAllRecipes: vi.fn(async () => []),
  deleteRecipe: vi.fn(async () => undefined),
  getRecentFoodItems: vi.fn(async () => []),
  getAllFoodLogs: vi.fn(async () => []),
}));

describe("AppState", () => {
  it("should initialize with correct default state", () => {
    const state = useAppState.getState();
    expect(state.dailyLogs).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("should have required methods available", () => {
    const state = useAppState.getState();
    expect(typeof state.fetchInitialData).toBe("function");
    expect(typeof state.refreshDailyLogs).toBe("function");
    expect(typeof state.addFoodLog).toBe("function");
  });

  it("should track userId after initialization", () => {
    const testUserId = UserId("test-user-123");
    useAppState.setState({ userId: testUserId });
    const state = useAppState.getState();
    expect(state.userId).toBe(testUserId);
  });

  it("should track loading state", () => {
    useAppState.setState({ isLoading: false });
    expect(useAppState.getState().isLoading).toBe(false);

    useAppState.setState({ isLoading: true });
    expect(useAppState.getState().isLoading).toBe(true);
  });

  it("should track error state", () => {
    useAppState.setState({ error: "Test error message" });
    expect(useAppState.getState().error).toBe("Test error message");

    useAppState.setState({ error: null });
    expect(useAppState.getState().error).toBeNull();
  });

  it("should have new CRUD action methods available", () => {
    const state = useAppState.getState();
    expect(typeof state.deleteFoodLog).toBe("function");
    expect(typeof state.updateCalorieGoal).toBe("function");
    expect(typeof state.fetchRecipes).toBe("function");
    expect(typeof state.deleteRecipe).toBe("function");
    expect(typeof state.fetchAllFoodItems).toBe("function");
  });

  it("should initialize with allFoodItems and recipes arrays", () => {
    const state = useAppState.getState();
    expect(Array.isArray(state.allFoodItems)).toBe(true);
    expect(Array.isArray(state.recipes)).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOUR_TOTAL_STEPS } from "../components/tour/tourSteps";

vi.mock("../db/dbService", () => ({
  db: { open: vi.fn() },
  addBodyMeasurement: vi.fn(),
  addFoodItemLog: vi.fn(),
  addStepLog: vi.fn(),
  addUserAchievement: vi.fn(),
  addWaterLog: vi.fn(),
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
  deleteBodyMeasurement: vi.fn(),
  deleteFoodItem: vi.fn(),
  deleteRecipe: vi.fn(),
  deleteStepLog: vi.fn(),
  deleteWaterLog: vi.fn(),
  getAllBodyMeasurements: vi.fn().mockResolvedValue([]),
  getAllFoodLogs: vi.fn().mockResolvedValue([]),
  getAllRecipes: vi.fn().mockResolvedValue([]),
  getAllWaterLogs: vi.fn().mockResolvedValue([]),
  getDailyFoodLogs: vi.fn().mockResolvedValue([]),
  getDailyStepLogs: vi.fn().mockResolvedValue([]),
  getDailyWaterLogs: vi.fn().mockResolvedValue([]),
  getFavoriteFoodItems: vi.fn().mockResolvedValue([]),
  getOrCreateUser: vi.fn().mockResolvedValue({
    id: "1",
    username: "Guest",
    email: "guest@example.com",
    lastLogin: new Date().toISOString(),
    calorieGoal: 2000,
    hasCompletedOnboarding: false,
  }),
  getRecentFoodItems: vi.fn().mockResolvedValue([]),
  getUnlockedAchievementIds: vi.fn().mockResolvedValue(new Set()),
  getUnlockedAchievements: vi.fn().mockResolvedValue([]),
  toggleFavoriteFoodItem: vi.fn(),
  updateFoodItem: vi.fn(),
  updateRecipe: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock("../lib/achievements", () => ({
  ACHIEVEMENTS: [],
  evaluateAchievements: vi.fn().mockReturnValue([]),
}));

describe("AppState tour actions", () => {
  let useAppState: typeof import("./AppState").useAppState;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./AppState");
    useAppState = mod.useAppState;
    useAppState.setState({
      init: {
        status: "ready",
        user: {
          id: "1" as import("../types").UserId,
          username: "Guest",
          email: "guest@example.com",
          lastLogin: new Date().toISOString(),
          calorieGoal: 2000,
          hasCompletedOnboarding: false,
        },
      },
      userId: "1" as import("../types").UserId,
      tourActive: false,
      tourStep: 0,
      tourTotalSteps: TOUR_TOTAL_STEPS,
    });
  });

  it("startTour sets tourActive true and step to 0", () => {
    useAppState.getState().startTour();
    const state = useAppState.getState();
    expect(state.tourActive).toBe(true);
    expect(state.tourStep).toBe(0);
  });

  it("nextTourStep advances to the next step", () => {
    useAppState.getState().startTour();
    useAppState.getState().nextTourStep();
    expect(useAppState.getState().tourStep).toBe(1);
  });

  it("nextTourStep does not advance past the last step", () => {
    useAppState.setState({ tourStep: TOUR_TOTAL_STEPS - 1 });
    useAppState.getState().nextTourStep();
    expect(useAppState.getState().tourStep).toBe(TOUR_TOTAL_STEPS - 1);
  });

  it("prevTourStep goes back a step", () => {
    useAppState.setState({ tourStep: 2, tourActive: true });
    useAppState.getState().prevTourStep();
    expect(useAppState.getState().tourStep).toBe(1);
  });

  it("prevTourStep does not go below 0", () => {
    useAppState.setState({ tourStep: 0, tourActive: true });
    useAppState.getState().prevTourStep();
    expect(useAppState.getState().tourStep).toBe(0);
  });

  it("skipTour sets tourActive false and step to 0", async () => {
    useAppState.setState({ tourActive: true, tourStep: 3 });
    await useAppState.getState().skipTour();
    const state = useAppState.getState();
    expect(state.tourActive).toBe(false);
    expect(state.tourStep).toBe(0);
  });

  it("endTour sets tourActive false and step to 0", async () => {
    useAppState.setState({ tourActive: true, tourStep: TOUR_TOTAL_STEPS - 1 });
    await useAppState.getState().endTour();
    const state = useAppState.getState();
    expect(state.tourActive).toBe(false);
    expect(state.tourStep).toBe(0);
  });

  it("completeOnboarding updates the user in state", async () => {
    await useAppState.getState().completeOnboarding();
    const state = useAppState.getState();
    expect(state.init.status).toBe("ready");
    if (state.init.status === "ready") {
      expect(state.init.user.hasCompletedOnboarding).toBe(true);
    }
  });

  it("tourTotalSteps matches TOUR_TOTAL_STEPS constant", () => {
    expect(useAppState.getState().tourTotalSteps).toBe(TOUR_TOTAL_STEPS);
  });
});

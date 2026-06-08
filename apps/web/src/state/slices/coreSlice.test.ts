import "fake-indexeddb/auto";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAppState } from "../AppState";
import { ISODate, todayISO, UserId } from "@/types";

const TEST_USER = UserId("core-slice-test-user");

beforeEach(() => {
  useAppState.setState({
    userId: TEST_USER,
    selectedDate: todayISO(),
    error: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("coreSlice.setSelectedDate", () => {
  it("updates selectedDate synchronously", async () => {
    const target = ISODate("2026-01-15");
    await useAppState.getState().setSelectedDate(target);
    expect(useAppState.getState().selectedDate).toBe(target);
  });

  it("returns without changing date when userId is null", async () => {
    useAppState.setState({ userId: null, selectedDate: todayISO() });
    const before = useAppState.getState().selectedDate;
    await useAppState.getState().setSelectedDate(ISODate("2026-01-01"));
    expect(useAppState.getState().selectedDate).toBe(before);
  });

  it("refreshes daily logs after date change", async () => {
    const target = ISODate("2026-03-10");
    await useAppState.getState().setSelectedDate(target);
    const state = useAppState.getState();
    expect(Array.isArray(state.dailyLogs)).toBe(true);
    expect(Array.isArray(state.dailyWaterLogs)).toBe(true);
    expect(Array.isArray(state.dailyStepLogs)).toBe(true);
    expect(Array.isArray(state.dailyActivityLogs)).toBe(true);
    expect(state.error).toBeNull();
  });

  it("sets selectedDate to today when called with todayISO()", async () => {
    useAppState.setState({ selectedDate: ISODate("2025-12-01") });
    await useAppState.getState().setSelectedDate(todayISO());
    expect(useAppState.getState().selectedDate).toBe(todayISO());
  });

  it("sets error state when DB calls fail", async () => {
    const dbService = await import("../../db/dbService");
    vi.spyOn(dbService, "getDailyFoodLogs").mockRejectedValueOnce(new Error("DB failure"));
    await useAppState.getState().setSelectedDate(ISODate("2026-02-01"));
    expect(useAppState.getState().error).toBeTruthy();
  });
});

describe("coreSlice.setWaterGoalMl", () => {
  it("updates waterGoalMl for valid values", () => {
    useAppState.getState().setWaterGoalMl(2500);
    expect(useAppState.getState().waterGoalMl).toBe(2500);
  });

  it("ignores invalid values", () => {
    const before = useAppState.getState().waterGoalMl;
    useAppState.getState().setWaterGoalMl(100);
    expect(useAppState.getState().waterGoalMl).toBe(before);
  });
});

describe("coreSlice.setStepGoal", () => {
  it("updates stepGoal for valid values", () => {
    useAppState.getState().setStepGoal(12000);
    expect(useAppState.getState().stepGoal).toBe(12000);
  });

  it("ignores out-of-range values", () => {
    const before = useAppState.getState().stepGoal;
    useAppState.getState().setStepGoal(500);
    expect(useAppState.getState().stepGoal).toBe(before);
  });
});

describe("coreSlice tour actions", () => {
  it("startTour sets tourActive true", () => {
    useAppState.getState().startTour();
    expect(useAppState.getState().tourActive).toBe(true);
    expect(useAppState.getState().tourStep).toBe(0);
  });

  it("nextTourStep increments tourStep", () => {
    useAppState.setState({ tourStep: 0, tourTotalSteps: 5 });
    useAppState.getState().nextTourStep();
    expect(useAppState.getState().tourStep).toBe(1);
  });

  it("nextTourStep does not exceed total steps", () => {
    const total = useAppState.getState().tourTotalSteps;
    useAppState.setState({ tourStep: total - 1 });
    useAppState.getState().nextTourStep();
    expect(useAppState.getState().tourStep).toBe(total - 1);
  });

  it("prevTourStep decrements tourStep", () => {
    useAppState.setState({ tourStep: 3 });
    useAppState.getState().prevTourStep();
    expect(useAppState.getState().tourStep).toBe(2);
  });

  it("prevTourStep does not go below 0", () => {
    useAppState.setState({ tourStep: 0 });
    useAppState.getState().prevTourStep();
    expect(useAppState.getState().tourStep).toBe(0);
  });

  it("endTour resets tour state", async () => {
    useAppState.setState({
      tourActive: true,
      tourStep: 2,
      userId: TEST_USER,
      init: {
        status: "ready",
        user: {
          id: TEST_USER,
          username: "Test",
          email: "",
          lastLogin: "",
          calorieGoal: 2000,
          hasCompletedOnboarding: false,
        },
      },
    });
    await useAppState.getState().endTour();
    expect(useAppState.getState().tourActive).toBe(false);
    expect(useAppState.getState().tourStep).toBe(0);
  });

  it("skipTour resets tour state", async () => {
    useAppState.setState({
      tourActive: true,
      tourStep: 1,
      userId: TEST_USER,
      init: {
        status: "ready",
        user: {
          id: TEST_USER,
          username: "Test",
          email: "",
          lastLogin: "",
          calorieGoal: 2000,
          hasCompletedOnboarding: false,
        },
      },
    });
    await useAppState.getState().skipTour();
    expect(useAppState.getState().tourActive).toBe(false);
  });
});

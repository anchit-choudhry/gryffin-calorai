import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ActivityTracker from "./ActivityTracker";
import * as appStateModule from "@/state/AppState";
import type { ActivityLog } from "@/db/dbService";
import { ActivityLogId } from "@/types";
import type { ISODate, UserId } from "@/types";

vi.mock("@/state/AppState");
vi.mock("lucide-react", () => ({
  Flame: () => <svg data-testid="flame-icon" aria-hidden="true" />,
}));

const makeLog = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id: ActivityLogId(1),
  userId: "u1" as UserId,
  activityType: "Running",
  durationMin: 30,
  caloriesBurned: 300,
  dateLogged: "2026-06-08" as ISODate,
  loggedAt: new Date().toISOString(),
  ...overrides,
});

const mockState = (logs: ActivityLog[]) => {
  vi.mocked(appStateModule).useAppState.mockReturnValue({
    dailyActivityLogs: logs,
  } as unknown as ReturnType<typeof appStateModule.useAppState>);
};

describe("ActivityTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState([]);
  });

  it("shows 0 kcal burned when there are no activity logs", () => {
    render(<ActivityTracker />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("kcal burned")).toBeTruthy();
  });

  it("shows the empty state message when no activities logged", () => {
    render(<ActivityTracker />);
    expect(screen.getByText("No activities today.")).toBeTruthy();
  });

  it("sums caloriesBurned across all logs", () => {
    mockState([
      makeLog({ caloriesBurned: 200 }),
      makeLog({ id: ActivityLogId(2), caloriesBurned: 150 }),
    ]);
    render(<ActivityTracker />);
    expect(screen.getByText("350")).toBeTruthy();
  });

  it("renders each activity type in the list", () => {
    mockState([
      makeLog({ activityType: "Running", caloriesBurned: 300 }),
      makeLog({ id: ActivityLogId(2), activityType: "Cycling", caloriesBurned: 250 }),
    ]);
    render(<ActivityTracker />);
    expect(screen.getByText("Running")).toBeTruthy();
    expect(screen.getByText("Cycling")).toBeTruthy();
  });

  it("renders calorie burn per activity", () => {
    mockState([makeLog({ activityType: "Swimming", caloriesBurned: 400 })]);
    render(<ActivityTracker />);
    expect(screen.getByText("400 kcal")).toBeTruthy();
  });

  it("renders the Log activity link", () => {
    render(<ActivityTracker />);
    expect(screen.getByRole("link", { name: "Log activity" })).toBeTruthy();
  });

  it("does not show the empty state when activities are present", () => {
    mockState([makeLog()]);
    render(<ActivityTracker />);
    expect(screen.queryByText("No activities today.")).toBeNull();
  });

  it("clicking Log activity calls scrollIntoView on the tour target", () => {
    const scrollIntoView = vi.fn();
    const mockEl = { scrollIntoView };
    vi.spyOn(document, "querySelector").mockReturnValue(mockEl as unknown as Element);
    render(<ActivityTracker />);
    fireEvent.click(screen.getByRole("link", { name: "Log activity" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    vi.restoreAllMocks();
  });
});

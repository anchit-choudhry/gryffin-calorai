import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnergyForecastCard } from "./EnergyForecastCard";
import type { FoodItem } from "@/db/dbService";
import type { FoodItemId, ISODate, UserId } from "@/types";

vi.mock("@/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/types")>();
  return {
    ...actual,
    todayISO: () => "2026-01-07" as ISODate,
  };
});

const UID = "u1" as UserId;

function makeLog(date: string, calories: number): FoodItem {
  return {
    id: 1 as FoodItemId,
    userId: UID,
    name: "food",
    calories,
    servingSize: 100,
    dateLogged: date as ISODate,
    isFavorite: false,
  };
}

describe("EnergyForecastCard", () => {
  it("shows empty state when no logs exist", () => {
    render(<EnergyForecastCard foodLogs={[]} calorieGoal={2000} />);
    expect(
      screen.getByText(/Week-end forecast unlocks once you log at least one day this week/),
    ).toBeTruthy();
  });

  it("shows empty state when calorieGoal is 0", () => {
    const logs = [makeLog("2026-01-05", 2000)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={0} />);
    expect(
      screen.getByText(/Week-end forecast unlocks once you log at least one day this week/),
    ).toBeTruthy();
  });

  it("renders the section heading when data is available", () => {
    const logs = [makeLog("2026-01-05", 2000), makeLog("2026-01-06", 2000)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={2000} />);
    expect(screen.getByText("Week-end forecast")).toBeTruthy();
  });

  it("shows projected total, weekly budget, and balance cells", () => {
    const logs = [makeLog("2026-01-05", 2500), makeLog("2026-01-06", 2500)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={2000} />);
    expect(screen.getByText("Projected total")).toBeTruthy();
    expect(screen.getByText("Weekly budget")).toBeTruthy();
  });

  it("shows surplus label when projected intake exceeds budget", () => {
    // High intake logs, 2 days logged out of 7, projected surplus
    const logs = [makeLog("2026-01-05", 3000), makeLog("2026-01-06", 3000)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={2000} />);
    expect(screen.getByText(/Projected surplus/)).toBeTruthy();
    expect(screen.getByText("above budget at week end")).toBeTruthy();
  });

  it("shows deficit label when projected intake is below budget", () => {
    // Low intake logs result in a deficit
    const logs = [makeLog("2026-01-05", 1000), makeLog("2026-01-06", 1000)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={2000} />);
    expect(screen.getByText(/Projected deficit/)).toBeTruthy();
    expect(screen.getByText("below budget at week end")).toBeTruthy();
  });

  it("shows days logged count", () => {
    const logs = [
      makeLog("2026-01-05", 2000),
      makeLog("2026-01-06", 2000),
      makeLog("2026-01-07", 2000),
    ];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={2000} />);
    expect(screen.getByText("3 days logged")).toBeTruthy();
  });

  it("shows daily goal in budget cell", () => {
    const logs = [makeLog("2026-01-06", 2000)];
    render(<EnergyForecastCard foodLogs={logs} calorieGoal={1800} />);
    expect(screen.getByText("1,800 / day")).toBeTruthy();
  });
});

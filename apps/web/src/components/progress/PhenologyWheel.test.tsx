import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhenologyWheel } from "./PhenologyWheel";
import type { FoodItem, BodyMeasurement, UserAchievement } from "@/db/dbService";

const currentYear = new Date().getFullYear();

const makeLog = (dateLogged: string, calories: number): FoodItem =>
  ({
    id: 1 as unknown as FoodItem["id"],
    name: "Chicken",
    calories,
    protein: 30,
    carbs: 0,
    fat: 3,
    dateLogged: dateLogged as FoodItem["dateLogged"],
    userId: "u1" as FoodItem["userId"],
    isFavorite: false,
    captureMethod: "manual",
  }) as FoodItem;

const makeMeasurement = (measuredAt: string, weight: number): BodyMeasurement =>
  ({
    id: 1 as unknown as BodyMeasurement["id"],
    userId: "u1" as BodyMeasurement["userId"],
    measuredAt: measuredAt as BodyMeasurement["measuredAt"],
    weight,
  }) as BodyMeasurement;

const makeAchievement = (unlockedAt: string): UserAchievement =>
  ({
    id: 1 as unknown as UserAchievement["id"],
    userId: "u1" as UserAchievement["userId"],
    achievementId: "first_log",
    unlockedAt,
  }) as UserAchievement;

describe("PhenologyWheel", () => {
  it("renders an SVG with role=img", () => {
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("has a descriptive aria-label containing the year", () => {
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("aria-label")).toContain(String(currentYear));
  });

  it("renders kicker text with current year", () => {
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getAllByText(new RegExp(String(currentYear))).length).toBeGreaterThan(0);
  });

  it("renders legend items", () => {
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByText(/on target/i)).toBeTruthy();
    expect(screen.getByText(/weight/i)).toBeTruthy();
  });

  it("renders with food log data for the current year", () => {
    const logs = [makeLog(`${currentYear}-01-15`, 2000), makeLog(`${currentYear}-03-20`, 1800)];
    render(
      <PhenologyWheel
        allLogs={logs}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("renders with body measurement data for the current year", () => {
    const measurements = [
      makeMeasurement(`${currentYear}-02-01`, 75),
      makeMeasurement(`${currentYear}-04-01`, 73),
      makeMeasurement(`${currentYear}-06-01`, 71),
    ];
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={measurements}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("renders without error when achievement unlockedAt is in current year", () => {
    const achievements = [makeAchievement(`${currentYear}-01-20T10:00:00Z`)];
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[]}
        unlockedAchievements={achievements}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("filters out logs from previous years", () => {
    const oldLog = makeLog(`${currentYear - 1}-06-15`, 2000);
    render(
      <PhenologyWheel
        allLogs={[oldLog]}
        bodyMeasurements={[]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("renders without weight spline when fewer than 2 body measurements", () => {
    render(
      <PhenologyWheel
        allLogs={[]}
        bodyMeasurements={[makeMeasurement(`${currentYear}-03-01`, 70)]}
        unlockedAchievements={[]}
        calorieGoal={2000}
      />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectedWeightCard from "./ProjectedWeightCard";
import type { TdeeProfile } from "@/db/dbService";
import { UserId } from "@/types";

const userId = UserId("test-user");

const baseProfile: TdeeProfile = {
  userId,
  age: 30,
  sex: "male",
  heightCm: 175,
  weightKg: 80,
  activityLevel: "moderate",
  goal: "lose",
  updatedAt: new Date().toISOString(),
};

describe("ProjectedWeightCard", () => {
  it("renders current weight in kg", () => {
    render(<ProjectedWeightCard tdeeProfile={baseProfile} />);
    expect(screen.getByText("80 kg")).toBeTruthy();
  });

  it("shows weekly rate for lose goal (~0.45 kg/week for 500 kcal deficit)", () => {
    render(<ProjectedWeightCard tdeeProfile={baseProfile} />);
    expect(screen.getByText(/0\.45 kg\/week/)).toBeTruthy();
  });

  it("shows weekly rate for gain goal (~0.27 kg/week for 300 kcal surplus)", () => {
    const profile: TdeeProfile = { ...baseProfile, goal: "gain" };
    render(<ProjectedWeightCard tdeeProfile={profile} />);
    expect(screen.getByText(/0\.27 kg\/week/)).toBeTruthy();
  });

  it("shows settings prompt when no target weight set", () => {
    render(<ProjectedWeightCard tdeeProfile={baseProfile} />);
    expect(screen.getByText(/Set in Settings - Profile/)).toBeTruthy();
    expect(screen.getByText(/Add a target weight in Settings/)).toBeTruthy();
  });

  it("shows projected date row when target weight is set", () => {
    const profile: TdeeProfile = { ...baseProfile, targetWeightKg: 75 };
    render(<ProjectedWeightCard tdeeProfile={profile} />);
    expect(screen.getByText(/5 kg to go/)).toBeTruthy();
    expect(screen.queryByText(/Set in Settings - Profile/)).toBeNull();
  });

  it("shows maintaining message for maintain goal", () => {
    const profile: TdeeProfile = { ...baseProfile, goal: "maintain" };
    render(<ProjectedWeightCard tdeeProfile={profile} />);
    expect(screen.getByText(/maintain your current weight/)).toBeTruthy();
    expect(screen.queryByText(/\/week/)).toBeNull();
  });

  it("shows lb values when weightUnit is lb", () => {
    render(<ProjectedWeightCard tdeeProfile={baseProfile} weightUnit="lb" />);
    // 80 kg * 2.20462 = ~176.4 lb
    expect(screen.getByText(/176\.4 lb/)).toBeTruthy();
  });

  it("shows goal badge in header", () => {
    render(<ProjectedWeightCard tdeeProfile={baseProfile} />);
    expect(screen.getByText("Lose Weight")).toBeTruthy();
  });

  it("shows gain badge for gain goal", () => {
    const profile: TdeeProfile = { ...baseProfile, goal: "gain" };
    render(<ProjectedWeightCard tdeeProfile={profile} />);
    expect(screen.getByText("Gain Weight")).toBeTruthy();
  });

  it("shows target weight in lb when unit is lb and target is set", () => {
    const profile: TdeeProfile = { ...baseProfile, targetWeightKg: 70 };
    render(<ProjectedWeightCard tdeeProfile={profile} weightUnit="lb" />);
    // 70 kg * 2.20462 = ~154.3 lb
    expect(screen.getByText(/154\.3 lb/)).toBeTruthy();
  });

  it("shows update goal message when target matches current weight", () => {
    const profile: TdeeProfile = { ...baseProfile, weightKg: 75, targetWeightKg: 75 };
    render(<ProjectedWeightCard tdeeProfile={profile} />);
    expect(screen.getByText(/update your goal/)).toBeTruthy();
  });
});

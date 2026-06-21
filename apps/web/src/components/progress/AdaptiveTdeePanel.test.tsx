import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdaptiveTdeePanel } from "./AdaptiveTdeePanel";
import type { BodyMeasurement, FoodItem, TdeeProfile } from "@/db/dbService";
import type { BodyMeasurementId, FoodItemId, ISODate, UserId } from "@/types";

const UID = "u1" as UserId;

const mockSetAdaptiveTdeeEnabled = vi.fn();

interface MockState {
  bodyMeasurements: BodyMeasurement[];
  adaptiveTdeeEnabled: boolean;
  setAdaptiveTdeeEnabled: (v: boolean) => void;
  tdeeProfile: TdeeProfile | null;
}

const mockState: MockState = {
  bodyMeasurements: [],
  adaptiveTdeeEnabled: true,
  setAdaptiveTdeeEnabled: mockSetAdaptiveTdeeEnabled,
  tdeeProfile: null,
};

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: MockState) => unknown) => selector(mockState),
}));

function makeWeight(date: string, weight: number): BodyMeasurement {
  return {
    id: 1 as BodyMeasurementId,
    userId: UID,
    measuredAt: date as ISODate,
    weight,
  };
}

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

function makeProfile(): TdeeProfile {
  return {
    userId: UID,
    age: 30,
    sex: "male",
    heightCm: 175,
    weightKg: 80,
    activityLevel: "moderate",
    goal: "lose",
    updatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  mockState.bodyMeasurements = [];
  mockState.adaptiveTdeeEnabled = true;
  mockState.tdeeProfile = null;
  mockSetAdaptiveTdeeEnabled.mockClear();
});

describe("AdaptiveTdeePanel", () => {
  it("renders the section heading", () => {
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(screen.getByText("Adaptive TDEE")).toBeTruthy();
  });

  it("shows empty state when panel is expanded but insufficient data", () => {
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(
      screen.getByText(/Needs at least 2 weight measurements and 7 days of food logs/),
    ).toBeTruthy();
  });

  it("hides content when panel is collapsed", () => {
    mockState.adaptiveTdeeEnabled = false;
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(screen.queryByText(/Needs at least 2 weight measurements/)).toBeNull();
  });

  it("calls setAdaptiveTdeeEnabled when toggle button is clicked", () => {
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    const toggleBtn = screen.getByRole("button", { name: /collapse adaptive tdee panel/i });
    fireEvent.click(toggleBtn);
    expect(mockSetAdaptiveTdeeEnabled).toHaveBeenCalledWith(false);
  });

  it("shows expand aria-label when collapsed", () => {
    mockState.adaptiveTdeeEnabled = false;
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(screen.getByRole("button", { name: /expand adaptive tdee panel/i })).toBeTruthy();
  });

  it("shows TDEE result grid when sufficient data is provided", () => {
    const measurements = [
      makeWeight("2026-01-01", 80),
      makeWeight("2026-01-08", 79.8),
      makeWeight("2026-01-15", 79.5),
    ];
    const logs: FoodItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date("2026-01-01");
      d.setDate(d.getDate() + i);
      logs.push(makeLog(d.toISOString().slice(0, 10), 1800));
    }
    mockState.bodyMeasurements = measurements;
    render(<AdaptiveTdeePanel foodLogs={logs} />);
    expect(screen.getByText("Observed TDEE")).toBeTruthy();
    expect(screen.getByText("Avg intake")).toBeTruthy();
    expect(screen.getByText("Weight change")).toBeTruthy();
  });

  it("shows vs formula cell when tdeeProfile is set and data is available", () => {
    const measurements = [
      makeWeight("2026-01-01", 80),
      makeWeight("2026-01-08", 79.8),
      makeWeight("2026-01-15", 79.5),
    ];
    const logs: FoodItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date("2026-01-01");
      d.setDate(d.getDate() + i);
      logs.push(makeLog(d.toISOString().slice(0, 10), 1800));
    }
    mockState.bodyMeasurements = measurements;
    mockState.tdeeProfile = makeProfile();
    render(<AdaptiveTdeePanel foodLogs={logs} />);
    expect(screen.getByText("vs formula")).toBeTruthy();
  });

  it("shows plateau alert when weight plateau is detected", () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 21);
    mockState.bodyMeasurements = [
      makeWeight(start.toISOString().slice(0, 10), 80),
      makeWeight(today.toISOString().slice(0, 10), 80.1),
    ];
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(screen.getByText("Weight plateau detected")).toBeTruthy();
  });

  it("does not show plateau alert when no plateau", () => {
    mockState.bodyMeasurements = [makeWeight("2026-01-01", 80), makeWeight("2026-01-02", 79)];
    render(<AdaptiveTdeePanel foodLogs={[]} />);
    expect(screen.queryByText("Weight plateau detected")).toBeNull();
  });
});

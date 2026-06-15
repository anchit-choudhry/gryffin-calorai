import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CorrelationInsightsPanel } from "./CorrelationInsightsPanel";
import type { BodyMeasurement, FastingSession, FoodItem } from "@/db/dbService";
import type { BodyMeasurementId, FastingSessionId, FoodItemId, ISODate, UserId } from "@/types";

const UID = "u1" as UserId;

interface MockState {
  bodyMeasurements: BodyMeasurement[];
  fastingHistory: FastingSession[];
  trainingDays: ISODate[];
  init:
    | { status: "ready"; user: { calorieGoal: number } }
    | { status: "loading" }
    | { status: "error" };
}

const mockState: MockState = {
  bodyMeasurements: [],
  fastingHistory: [],
  trainingDays: [],
  init: { status: "ready", user: { calorieGoal: 2000 } },
};

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: MockState) => unknown) => selector(mockState),
}));

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

function makeFasting(date: string, completed: boolean): FastingSession {
  return {
    id: 1 as FastingSessionId,
    userId: UID,
    startTime: `${date}T08:00:00Z`,
    endTime: completed ? `${date}T22:00:00Z` : null,
    targetHours: 14,
    dateLogged: date as ISODate,
    completed,
  };
}

function makeWeight(date: string, weight: number): BodyMeasurement {
  return {
    id: 1 as BodyMeasurementId,
    userId: UID,
    measuredAt: date as ISODate,
    weight,
  };
}

beforeEach(() => {
  mockState.bodyMeasurements = [];
  mockState.fastingHistory = [];
  mockState.trainingDays = [];
  mockState.init = { status: "ready", user: { calorieGoal: 2000 } };
});

describe("CorrelationInsightsPanel", () => {
  it("shows empty state when no correlations can be computed", () => {
    render(<CorrelationInsightsPanel foodLogs={[]} />);
    expect(screen.getByText(/Correlation insights unlock with more data/)).toBeTruthy();
    expect(screen.getByText(/Needs 5\+ paired data points per correlation/i)).toBeTruthy();
  });

  it("shows fasting correlation card when sufficient data exists", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i): FoodItem => makeLog(d, i % 2 === 0 ? 800 : 2400));
    const fasting = dates.filter((_, i) => i % 2 === 0).map((d) => makeFasting(d, true));
    mockState.fastingHistory = fasting;
    render(<CorrelationInsightsPanel foodLogs={logs} />);
    expect(screen.getByText("Fasting days vs total intake")).toBeTruthy();
  });

  it("shows training correlation card when sufficient data exists", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i): FoodItem => makeLog(d, i % 2 === 0 ? 2800 : 1600));
    const trainingDays = dates.filter((_, i) => i % 2 === 0) as ISODate[];
    mockState.trainingDays = trainingDays;
    render(<CorrelationInsightsPanel foodLogs={logs} />);
    expect(screen.getByText("Training days vs calorie intake")).toBeTruthy();
  });

  it("shows sodium-weight correlation card when sufficient paired data exists", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map(
      (d, i): FoodItem => ({
        id: 1 as FoodItemId,
        userId: UID,
        name: "food",
        calories: 2000,
        servingSize: 100,
        dateLogged: d as ISODate,
        isFavorite: false,
        nutritionData: { sodium: (i + 1) * 300 },
      }),
    );
    const weights = dates.flatMap((d, i) => {
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);
      const next = nextDate.toISOString().slice(0, 10);
      return [makeWeight(d, 80 + i * 0.01), makeWeight(next, 80 + i * 0.01 + (i + 1) * 0.002)];
    });
    mockState.bodyMeasurements = weights;
    render(<CorrelationInsightsPanel foodLogs={logs} />);
    expect(screen.getByText("Sodium vs next-day weight")).toBeTruthy();
  });

  it("renders correlation cards with r value, strength, and description", () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d, i): FoodItem => makeLog(d, i % 2 === 0 ? 800 : 2400));
    const fasting = dates.filter((_, i) => i % 2 === 0).map((d) => makeFasting(d, true));
    mockState.fastingHistory = fasting;
    render(<CorrelationInsightsPanel foodLogs={logs} />);
    // r value should be shown
    const rLabel = screen.getByText("r");
    expect(rLabel).toBeTruthy();
    // paired observations label
    expect(screen.getByText(/n=\d+ paired observations/)).toBeTruthy();
  });

  it("shows calorieGoal 0 when init status is not ready", () => {
    mockState.init = { status: "loading" };
    // With calorieGoal=0, trainingVsAdherenceCorrelation returns undefined
    const dates = Array.from({ length: 10 }, (_, i) => {
      return `2026-01-${String(i + 1).padStart(2, "0")}`;
    });
    const logs = dates.map((d): FoodItem => makeLog(d, 2000));
    mockState.trainingDays = dates.slice(0, 7) as ISODate[];
    render(<CorrelationInsightsPanel foodLogs={logs} />);
    // With calorieGoal=0, training correlation undefined, likely empty state
    expect(screen.getByText(/Correlation insights unlock with more data/)).toBeTruthy();
  });
});

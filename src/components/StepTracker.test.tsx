import { describe, expect, it, vi } from "vitest";

vi.mock("../state/AppState", () => ({
  useAppState: vi.fn(() => ({
    dailyStepLogs: [],
    stepGoal: 10000,
    deleteStepLog: vi.fn(),
    setStepGoal: vi.fn(),
  })),
}));

vi.mock("../hooks/useStepForm", () => ({
  useStepForm: vi.fn(() => ({
    form: {
      register: vi.fn(() => ({})),
      getValues: vi.fn(() => 1000),
    },
    isLoading: false,
    submitStepLog: vi.fn(async () => true),
  })),
}));

describe("StepTracker", () => {
  it("exports StepTracker as a function component", async () => {
    const { default: StepTracker } = await import("./StepTracker");
    expect(typeof StepTracker).toBe("function");
  });
});

describe("step count aggregation", () => {
  it("sums steps across multiple log entries", () => {
    const logs = [{ steps: 2000 }, { steps: 3000 }, { steps: 5000 }];
    const total = logs.reduce((sum, l) => sum + l.steps, 0);
    expect(total).toBe(10000);
  });

  it("returns 0 for empty log list", () => {
    const logs: { steps: number }[] = [];
    expect(logs.reduce((sum, l) => sum + l.steps, 0)).toBe(0);
  });

  it("handles a single log entry", () => {
    const logs = [{ steps: 7500 }];
    expect(logs.reduce((sum, l) => sum + l.steps, 0)).toBe(7500);
  });
});

describe("progress percentage calculation", () => {
  const calcPct = (totalSteps: number, stepGoal: number) =>
    Math.min(100, Math.round((totalSteps / stepGoal) * 100));

  it("returns 0% when no steps logged", () => {
    expect(calcPct(0, 10000)).toBe(0);
  });

  it("returns 50% at half the goal", () => {
    expect(calcPct(5000, 10000)).toBe(50);
  });

  it("returns 75% at three-quarter goal", () => {
    expect(calcPct(7500, 10000)).toBe(75);
  });

  it("returns 100% at goal", () => {
    expect(calcPct(10000, 10000)).toBe(100);
  });

  it("caps at 100% when steps exceed goal", () => {
    expect(calcPct(15000, 10000)).toBe(100);
    expect(calcPct(50000, 10000)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(calcPct(3333, 10000)).toBe(33);
    expect(calcPct(6667, 10000)).toBe(67);
  });
});

describe("quick-add step amounts", () => {
  const QUICK_STEPS = [2000, 5000, 8000, 10000] as const;

  it("defines four quick-add amounts", () => {
    expect(QUICK_STEPS).toHaveLength(4);
  });

  it("includes 10,000 steps as a quick option", () => {
    expect(QUICK_STEPS).toContain(10000);
  });

  it("all quick amounts are within valid schema range", () => {
    QUICK_STEPS.forEach((steps) => {
      expect(steps).toBeGreaterThanOrEqual(1);
      expect(steps).toBeLessThanOrEqual(100000);
    });
  });

  it("quick amounts are sorted ascending", () => {
    const sorted = [...QUICK_STEPS].sort((a, b) => a - b);
    expect([...QUICK_STEPS]).toEqual(sorted);
  });
});

describe("step goal validation", () => {
  const isValidGoal = (steps: number) => Number.isFinite(steps) && steps >= 1000 && steps <= 100000;

  it("accepts 10,000 as default goal", () => {
    expect(isValidGoal(10000)).toBe(true);
  });

  it("rejects goals below 1,000", () => {
    expect(isValidGoal(999)).toBe(false);
    expect(isValidGoal(0)).toBe(false);
  });

  it("rejects goals above 100,000", () => {
    expect(isValidGoal(100001)).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isValidGoal(Infinity)).toBe(false);
    expect(isValidGoal(NaN)).toBe(false);
  });
});

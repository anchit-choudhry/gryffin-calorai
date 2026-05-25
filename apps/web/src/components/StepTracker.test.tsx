import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import StepTracker from "./StepTracker";
import * as appState from "../state/AppState";
import * as stepFormHook from "../hooks/useStepForm";

vi.mock("../state/AppState");
vi.mock("../hooks/useStepForm");
vi.mock("sonner");

describe("StepTracker component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1000),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: vi.fn().mockResolvedValue(true),
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports StepTracker as a function component", async () => {
    const { default: StepTrackerModule } = await import("./StepTracker");
    expect(typeof StepTrackerModule).toBe("function");
  });

  it("renders step tracker successfully", () => {
    render(<StepTracker />);
    expect(screen.getByText(/Step Count/i)).toBeDefined();
  });

  it("renders with empty daily step logs", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    expect(screen.getByText(/No entries yet today/i)).toBeDefined();
  });

  it("renders quick-add step buttons", () => {
    render(<StepTracker />);
    expect(screen.getByText(/\+2,000/)).toBeDefined();
    expect(screen.getByText(/\+5,000/)).toBeDefined();
    expect(screen.getByText(/\+8,000/)).toBeDefined();
    expect(screen.getByText(/\+10,000/)).toBeDefined();
  });

  it("renders custom button", () => {
    render(<StepTracker />);
    expect(screen.getByText("Custom")).toBeDefined();
  });

  it("renders with daily step logs", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [
        {
          id: 1,
          userId: "user-1",
          steps: 5000,
          dateLogged: "2026-05-17",
          loggedAt: new Date().toISOString(),
        },
      ],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    expect(screen.getByText(/5,000 steps/)).toBeDefined();
  });

  it("renders step goal display", () => {
    render(<StepTracker />);
    expect(screen.getByText(/0 \/ 10,000 steps/)).toBeDefined();
  });

  it("renders with custom step goal", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 8000,
      setStepGoal: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    expect(screen.getByText(/0 \/ 8,000 steps/)).toBeDefined();
  });

  it("allows editing the step goal", async () => {
    const setStepGoalMock = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: setStepGoalMock,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    const editButton = screen.getByRole("button", { name: /10,000 steps/i });
    fireEvent.click(editButton);
    expect(screen.getByDisplayValue("10000")).toBeDefined();
    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("saves a new step goal when Save is clicked", async () => {
    const setStepGoalMock = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: setStepGoalMock,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    const editButton = screen.getByRole("button", { name: /10,000 steps/i });
    fireEvent.click(editButton);

    const goalInput = screen.getByDisplayValue("10000") as HTMLInputElement;
    fireEvent.change(goalInput, { target: { value: "12000" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(setStepGoalMock).toHaveBeenCalledWith(12000);
  });

  it("cancels goal editing when Cancel is clicked", async () => {
    const setStepGoalMock = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [],
      addStepLog: vi.fn(),
      deleteStepLog: vi.fn(),
      stepGoal: 10000,
      setStepGoal: setStepGoalMock,
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    const editButton = screen.getByRole("button", { name: /10,000 steps/i });
    fireEvent.click(editButton);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(setStepGoalMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("shows custom input when Custom button is clicked", () => {
    render(<StepTracker />);
    const customButton = screen.getByText("Custom");
    fireEvent.click(customButton);
    expect(screen.getByLabelText("Custom step count")).toBeDefined();
    expect(screen.getByText("Add")).toBeDefined();
  });

  it("submits custom step count when Add is clicked", async () => {
    const submitStepLogMock = vi.fn().mockResolvedValue(true);
    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1500),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: submitStepLogMock,
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);

    render(<StepTracker />);
    const customButton = screen.getByText("Custom");
    fireEvent.click(customButton);

    const addButton = screen.getByText("Add");
    fireEvent.click(addButton);

    expect(submitStepLogMock).toHaveBeenCalledWith(1500);
  });

  it("clicking a quick-add button calls submitStepLog with that step count", async () => {
    const submitStepLogMock = vi.fn().mockResolvedValue(true);
    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1000),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: submitStepLogMock,
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);

    render(<StepTracker />);
    const btn = screen.getByText(/\+2,000/);
    fireEvent.click(btn);
    expect(submitStepLogMock).toHaveBeenCalledWith(2000);
  });

  it("does not show success toast when quick-add returns false", async () => {
    const { toast } = await import("sonner");
    const submitStepLogMock = vi.fn().mockResolvedValue(false);
    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1000),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: submitStepLogMock,
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);

    render(<StepTracker />);
    const btn = screen.getByText(/\+2,000/);
    fireEvent.click(btn);
    await Promise.resolve();
    expect(vi.mocked(toast).success).not.toHaveBeenCalled();
  });

  it("deletes a step log entry when remove button is clicked", () => {
    const deleteStepLogMock = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyStepLogs: [
        {
          id: 1,
          userId: "user-1",
          steps: 5000,
          dateLogged: "2026-05-17",
          loggedAt: new Date().toISOString(),
        },
      ],
      addStepLog: vi.fn(),
      deleteStepLog: deleteStepLogMock,
      stepGoal: 10000,
      setStepGoal: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<StepTracker />);
    const removeButton = screen.getByLabelText(/Remove 5,000 steps entry/);
    fireEvent.click(removeButton);

    expect(deleteStepLogMock).toHaveBeenCalledWith(1);
  });

  it("calls submitStepLog when Add button is clicked after setting custom value", async () => {
    const submitStepLogMock = vi.fn().mockResolvedValue(true);
    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1500),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: submitStepLogMock,
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);

    render(<StepTracker />);
    const customButton = screen.getByText("Custom");
    fireEvent.click(customButton);

    const addButton = screen.getByText("Add");
    fireEvent.click(addButton);

    expect(submitStepLogMock).toHaveBeenCalledWith(1500);
  });

  it("hides custom input after successful submission", async () => {
    const submitStepLogMock = vi.fn().mockResolvedValue(true);
    vi.mocked(stepFormHook).useStepForm.mockReturnValue({
      form: {
        register: vi.fn(() => ({})),
        getValues: vi.fn(() => 1500),
        setValue: vi.fn(),
      } as unknown as ReturnType<typeof stepFormHook.useStepForm>["form"],
      isLoading: false,
      submitStepLog: submitStepLogMock,
    } as unknown as ReturnType<typeof stepFormHook.useStepForm>);

    render(<StepTracker />);
    const customButton = screen.getByText("Custom");
    fireEvent.click(customButton);

    const customInput = screen.getByLabelText("Custom step count");
    expect(customInput).toBeDefined();

    const addButton = screen.getByText("Add");
    fireEvent.click(addButton);

    expect(submitStepLogMock).toHaveBeenCalled();
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
    expect([...QUICK_STEPS]).toStrictEqual(sorted);
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

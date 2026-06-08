import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import WaterTracker from "./WaterTracker";
import * as appState from "../state/AppState";
import type { WaterLog } from "../db/dbService";
import { ISODate, UserId, WaterLogId } from "@/types";
import { toast } from "sonner";

vi.mock("sonner");
vi.mock("../state/AppState");

const mockSubmitWaterLog = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock("../hooks/useWaterForm", () => ({
  useWaterForm: () => ({
    form: {
      register: vi.fn().mockReturnValue({}),
      getValues: vi.fn().mockReturnValue(300),
    },
    isLoading: false,
    submitWaterLog: mockSubmitWaterLog,
  }),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Pencil: () => <svg data-testid="pencil-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

const makeLog = (id: number, amount: number): WaterLog => ({
  id: WaterLogId(id),
  userId: UserId("user-1"),
  amount,
  dateLogged: ISODate("2026-05-24"),
  loggedAt: new Date("2026-05-24T08:00:00").toISOString(),
});

const baseState = {
  dailyWaterLogs: [] as WaterLog[],
  addWaterLog: vi.fn().mockResolvedValue(WaterLogId(42)),
  deleteWaterLog: vi.fn(),
  waterGoalMl: 2000,
  setWaterGoalMl: vi.fn(),
};

describe("WaterTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitWaterLog.mockResolvedValue(true);
    vi.mocked(appState).useAppState.mockReturnValue(
      baseState as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  it("renders Water Intake heading", () => {
    render(<WaterTracker />);
    expect(screen.getByText("Water Intake")).toBeTruthy();
  });

  it("shows total and goal in ml", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyWaterLogs: [makeLog(1, 500)],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<WaterTracker />);
    expect(screen.getByText(/500 \/ 2000 ml/)).toBeTruthy();
  });

  it("renders the three quick-add buttons", () => {
    render(<WaterTracker />);
    expect(screen.getByText("+250")).toBeTruthy();
    expect(screen.getByText("+500")).toBeTruthy();
    expect(screen.getByText("+750")).toBeTruthy();
  });

  it("clicking +250 calls addWaterLog with 250", async () => {
    render(<WaterTracker />);
    await act(async () => {
      fireEvent.click(screen.getByText("+250"));
    });
    expect(baseState.addWaterLog).toHaveBeenCalledWith(250);
  });

  it("clicking +500 shows success toast with undo action", async () => {
    render(<WaterTracker />);
    await act(async () => {
      fireEvent.click(screen.getByText("+500"));
    });
    expect(toast.success).toHaveBeenCalledWith(
      "+500 ml logged",
      expect.objectContaining({ action: expect.objectContaining({ label: "Undo" }) }),
    );
  });

  it("custom input is hidden by default", () => {
    render(<WaterTracker />);
    expect(screen.queryByLabelText("Custom water amount in ml")).toBeNull();
  });

  it("clicking Custom shows the amount input", () => {
    render(<WaterTracker />);
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.getByLabelText("Custom water amount in ml")).toBeTruthy();
  });

  it("clicking Custom again hides the input (toggle)", () => {
    render(<WaterTracker />);
    fireEvent.click(screen.getByText("Custom"));
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.queryByLabelText("Custom water amount in ml")).toBeNull();
  });

  it("shows 'No entries yet today.' when dailyWaterLogs is empty", () => {
    render(<WaterTracker />);
    expect(screen.getByText("No entries yet today.")).toBeTruthy();
  });

  it("renders log entries", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyWaterLogs: [makeLog(1, 250), makeLog(2, 500)],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<WaterTracker />);
    expect(screen.getByText(/250 ml/)).toBeTruthy();
    expect(screen.getByText(/500 ml/)).toBeTruthy();
  });

  it("delete button calls deleteWaterLog with the entry id", () => {
    const mockDelete = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyWaterLogs: [makeLog(42, 300)],
      deleteWaterLog: mockDelete,
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<WaterTracker />);
    fireEvent.click(screen.getByLabelText("Remove 300 ml entry"));
    expect(mockDelete).toHaveBeenCalledWith(WaterLogId(42));
  });

  it("delete shows toast with Undo action", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyWaterLogs: [makeLog(1, 300)],
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<WaterTracker />);
    fireEvent.click(screen.getByLabelText("Remove 300 ml entry"));
    expect(toast).toHaveBeenCalledWith(
      "Entry removed",
      expect.objectContaining({ action: expect.objectContaining({ label: "Undo" }) }),
    );
  });

  it("Undo action calls addWaterLog with the deleted amount", () => {
    const mockAdd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseState,
      dailyWaterLogs: [makeLog(1, 300)],
      addWaterLog: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);
    render(<WaterTracker />);
    fireEvent.click(screen.getByLabelText("Remove 300 ml entry"));

    const toastArgs = vi.mocked(toast).mock.calls[0]!;
    const options = toastArgs[1] as unknown as { action: { onClick: () => void } };
    options.action.onClick();
    expect(mockAdd).toHaveBeenCalledWith(300);
  });

  describe("goal editing", () => {
    it("clicking the ml display enters goal-edit mode", () => {
      render(<WaterTracker />);
      fireEvent.click(screen.getByText(/0 \/ 2000 ml/));
      expect(screen.getByLabelText("Daily water goal in ml")).toBeTruthy();
    });

    it("Save in goal-edit calls setWaterGoalMl and exits edit mode", () => {
      const mockSet = vi.fn();
      vi.mocked(appState).useAppState.mockReturnValue({
        ...baseState,
        setWaterGoalMl: mockSet,
      } as unknown as ReturnType<typeof appState.useAppState>);
      render(<WaterTracker />);
      fireEvent.click(screen.getByText(/0 \/ 2000 ml/));
      const input = screen.getByLabelText("Daily water goal in ml");
      fireEvent.change(input, { target: { value: "3000" } });
      fireEvent.click(screen.getByText("Save"));
      expect(mockSet).toHaveBeenCalledWith(3000);
      expect(screen.queryByLabelText("Daily water goal in ml")).toBeNull();
    });

    it("Cancel in goal-edit exits edit mode without saving", () => {
      const mockSet = vi.fn();
      vi.mocked(appState).useAppState.mockReturnValue({
        ...baseState,
        setWaterGoalMl: mockSet,
      } as unknown as ReturnType<typeof appState.useAppState>);
      render(<WaterTracker />);
      fireEvent.click(screen.getByText(/0 \/ 2000 ml/));
      fireEvent.click(screen.getByText("Cancel"));
      expect(mockSet).not.toHaveBeenCalled();
      expect(screen.queryByLabelText("Daily water goal in ml")).toBeNull();
    });

    it("goal input enforces minimum of 250 (onChange clamps)", () => {
      render(<WaterTracker />);
      fireEvent.click(screen.getByText(/0 \/ 2000 ml/));
      const input = screen.getByLabelText("Daily water goal in ml") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.click(screen.getByText("Save"));
      expect(baseState.setWaterGoalMl).toHaveBeenCalledWith(250);
    });
  });
});

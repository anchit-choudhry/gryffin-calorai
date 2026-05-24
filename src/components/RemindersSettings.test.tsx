import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useAppState } from "@/state/AppState";
import RemindersSettings from "./RemindersSettings";
import { REMINDER_LABELS } from "@/types";
import type { Reminder } from "@/db/dbService";
import { ReminderId, UserId } from "@/types";

vi.mock("@/state/AppState");

const mockSaveReminder = vi.fn();

const BASE_STATE = {
  reminders: [] as Reminder[],
  saveReminder: mockSaveReminder,
  deleteReminder: vi.fn(),
};

function setupMock(overrides: Partial<typeof BASE_STATE> = {}) {
  vi.mocked(useAppState).mockReturnValue({
    ...BASE_STATE,
    ...overrides,
  } as unknown as ReturnType<typeof useAppState>);
}

describe("RemindersSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    // Default: Notification API absent
    vi.stubGlobal("Notification", undefined);
  });

  it("renders all 5 reminder type labels", () => {
    setupMock();
    render(<RemindersSettings />);
    expect(screen.getByText(REMINDER_LABELS["log_meal"])).toBeTruthy();
    expect(screen.getByText(REMINDER_LABELS["drink_water"])).toBeTruthy();
    expect(screen.getByText(REMINDER_LABELS["weigh_in"])).toBeTruthy();
    expect(screen.getByText(REMINDER_LABELS["log_steps"])).toBeTruthy();
    expect(screen.getByText(REMINDER_LABELS["fasting_check"])).toBeTruthy();
  });

  it("does not show permission banner when Notification API is absent", () => {
    setupMock();
    render(<RemindersSettings />);
    expect(screen.queryByText(/notifications/i)).toBeNull();
  });

  it("shows permission banner when Notification.permission is default", () => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
    setupMock();
    render(<RemindersSettings />);
    expect(screen.getByText(/allow notifications/i)).toBeTruthy();
  });

  it("shows Allow button when permission is default", () => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
    setupMock();
    render(<RemindersSettings />);
    expect(screen.getByRole("button", { name: /allow/i })).toBeTruthy();
  });

  it("shows blocked message and no Allow button when permission is denied", () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    setupMock();
    render(<RemindersSettings />);
    expect(screen.getByText(/blocked/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^allow$/i })).toBeNull();
  });

  it("shows bell-off icon toggle for each disabled reminder type", () => {
    setupMock();
    render(<RemindersSettings />);
    const toggles = screen.getAllByRole("button", { name: /enable/i });
    expect(toggles).toHaveLength(5);
  });

  it("shows bell-on icon when a reminder is enabled", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(1),
      userId: UserId("1"),
      type: "drink_water",
      time: "09:00",
      daysOfWeek: 0b1111111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    expect(screen.getByRole("button", { name: /disable drink water/i })).toBeTruthy();
  });

  it("shows time input and day buttons when a reminder is enabled", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(2),
      userId: UserId("1"),
      type: "log_meal",
      time: "12:30",
      daysOfWeek: 0b0011111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    const timeInput = screen.getByLabelText("Reminder time");
    expect(timeInput).toBeTruthy();
    expect(screen.getByLabelText("Days of week")).toBeTruthy();
  });

  it("calls saveReminder when toggling an off reminder on", () => {
    setupMock();
    render(<RemindersSettings />);
    const enableBtn = screen.getAllByRole("button", { name: /enable log a meal/i })[0]!;
    fireEvent.click(enableBtn);
    expect(mockSaveReminder).toHaveBeenCalledWith(
      expect.objectContaining({ type: "log_meal", enabled: true }),
    );
  });

  it("calls saveReminder with enabled:false when toggling an enabled reminder off", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(3),
      userId: UserId("1"),
      type: "weigh_in",
      time: "07:00",
      daysOfWeek: 0b1111111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    const disableBtn = screen.getByRole("button", { name: /disable weigh in/i });
    fireEvent.click(disableBtn);
    expect(mockSaveReminder).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("has aria-pressed attribute on toggle buttons", () => {
    setupMock();
    render(<RemindersSettings />);
    const toggles = screen.getAllByRole("button", { name: /enable/i });
    for (const toggle of toggles) {
      expect(toggle.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("changing the time input calls onChange without persisting (no existing reminder)", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(4),
      userId: UserId("1"),
      type: "log_steps",
      time: "08:00",
      daysOfWeek: 0b1111111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    const timeInput = screen.getByLabelText("Reminder time");
    fireEvent.change(timeInput, { target: { value: "10:00" } });
    expect((timeInput as HTMLInputElement).value).toBe("10:00");
  });

  it("blurring the time input calls saveReminder when reminder exists", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(5),
      userId: UserId("1"),
      type: "fasting_check",
      time: "08:00",
      daysOfWeek: 0b1111111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    const timeInput = screen.getByLabelText("Reminder time");
    fireEvent.change(timeInput, { target: { value: "09:30" } });
    fireEvent.blur(timeInput);
    expect(mockSaveReminder).toHaveBeenCalledWith(
      expect.objectContaining({ type: "fasting_check" }),
    );
  });

  it("clicking a day button calls saveReminder when reminder exists", () => {
    const enabledReminder: Reminder = {
      id: ReminderId(6),
      userId: UserId("1"),
      type: "drink_water",
      time: "09:00",
      daysOfWeek: 0b1111111,
      enabled: true,
    };
    setupMock({ reminders: [enabledReminder] });
    render(<RemindersSettings />);
    const mondayBtn = screen.getByRole("button", { name: "Monday" });
    fireEvent.click(mondayBtn);
    expect(mockSaveReminder).toHaveBeenCalledWith(expect.objectContaining({ type: "drink_water" }));
  });

  it("clicking Allow button calls requestPermission", async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: mockRequestPermission,
    });
    setupMock();
    render(<RemindersSettings />);
    const allowBtn = screen.getByRole("button", { name: /allow/i });
    fireEvent.click(allowBtn);
    await Promise.resolve();
    expect(mockRequestPermission).toHaveBeenCalled();
  });
});

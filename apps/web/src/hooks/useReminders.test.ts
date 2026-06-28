import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { msUntilNextReminder, useReminders } from "./useReminders";
import { useAppState } from "@/state/AppState";
import { ReminderId, UserId } from "@/types";
import type { Reminder } from "@/db/dbService";

vi.mock("@/state/AppState");
vi.mock("@/lib/pushNotifications", () => ({
  initializePushSubscription: vi.fn().mockResolvedValue(undefined),
}));

// bit 0 = Mon, ..., bit 6 = Sun
const ALL_DAYS = 0b1111111;
const MON_ONLY = 0b0000001;
const WEEKDAYS = 0b0011111;
const WEEKEND = 0b1100000;

describe("msUntilNextReminder", () => {
  it("returns null for malformed time string", () => {
    expect(msUntilNextReminder("invalid", ALL_DAYS)).toBeNull();
  });

  it("returns null when daysOfWeek is zero (no day selected)", () => {
    // The function loops 0-7 and never finds a matching day
    const now = new Date("2026-01-05T08:00:00"); // Monday
    expect(msUntilNextReminder("09:00", 0, now)).toBeNull();
  });

  it("returns ms until next occurrence today when future time matches today", () => {
    // Monday Jan 5 2026, 08:00 - next Mon at 09:00 is today in 1 hour
    const now = new Date("2026-01-05T08:00:00");
    const ms = msUntilNextReminder("09:00", MON_ONLY, now);
    expect(ms).not.toBeNull();
    expect(ms).toBeCloseTo(60 * 60 * 1000, -3); // ~1 hour
  });

  it("skips past times for today and finds next matching day", () => {
    // Monday Jan 5 2026, 10:00 - 09:00 Mon has passed, next Mon is in 7 days
    const now = new Date("2026-01-05T10:00:00");
    const ms = msUntilNextReminder("09:00", MON_ONLY, now);
    expect(ms).not.toBeNull();
    // ~7 days minus 1 hour = 6 days 23 hours in ms
    expect(ms).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(ms).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });

  it("finds the correct next day among weekdays", () => {
    // Tuesday Jan 6 2026, 12:00 - next weekday at 08:00 is Wednesday Jan 7 at 08:00
    const now = new Date("2026-01-06T12:00:00");
    const ms = msUntilNextReminder("08:00", WEEKDAYS, now);
    expect(ms).not.toBeNull();
    // Wednesday is ~20 hours away
    expect(ms).toBeCloseTo(20 * 60 * 60 * 1000, -6);
  });

  it("finds the next weekend day from a weekday", () => {
    // Wednesday Jan 7 2026, 12:00 - next weekend at 10:00 is Saturday Jan 10
    const now = new Date("2026-01-07T12:00:00");
    const ms = msUntilNextReminder("10:00", WEEKEND, now);
    expect(ms).not.toBeNull();
    // Saturday Jan 10 at 10:00 = 2d 22h away
    const expected = (2 * 24 + 22) * 60 * 60 * 1000;
    expect(ms).toBeCloseTo(expected, -6);
  });

  it("returns null if no day ever matches within 7-day window", () => {
    // All-day mask zero check (already tested), but also ensure >7 days still null
    // mask=0 is tested; this verifies the loop bound
    expect(msUntilNextReminder("08:00", 0, new Date())).toBeNull();
  });

  it("returns a positive number of ms", () => {
    const now = new Date("2026-01-05T08:00:00");
    const ms = msUntilNextReminder("09:00", ALL_DAYS, now);
    expect(ms).toBeGreaterThan(0);
  });

  it("result is less than 8 days in ms", () => {
    const now = new Date("2026-01-05T08:00:00");
    const ms = msUntilNextReminder("09:00", ALL_DAYS, now);
    expect(ms).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });

  it("works for Sunday (bit 6)", () => {
    const SUN_ONLY = 0b1000000;
    // Monday Jan 5 2026, 08:00 - next Sunday is Jan 11 at 10:00 = 6d 2h
    const now = new Date("2026-01-05T08:00:00");
    const ms = msUntilNextReminder("10:00", SUN_ONLY, now);
    expect(ms).not.toBeNull();
    const expected = (6 * 24 + 2) * 60 * 60 * 1000;
    expect(ms).toBeCloseTo(expected, -6);
  });
});

describe("useReminders hook", () => {
  const enabledReminder: Reminder = {
    id: ReminderId(1),
    userId: UserId("1"),
    type: "drink_water",
    time: "09:00",
    daysOfWeek: 0b1111111,
    enabled: true,
  };

  const disabledReminder: Reminder = {
    id: ReminderId(2),
    userId: UserId("1"),
    type: "log_meal",
    time: "12:00",
    daysOfWeek: 0b1111111,
    enabled: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not schedule timers when Notification is absent", () => {
    vi.stubGlobal("Notification", undefined);
    vi.mocked(useAppState).mockReturnValue({ reminders: [enabledReminder] } as ReturnType<
      typeof useAppState
    >);

    renderHook(() => useReminders());
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not schedule timers when permission is not granted", () => {
    vi.stubGlobal("Notification", { permission: "default" });
    vi.mocked(useAppState).mockReturnValue({ reminders: [enabledReminder] } as ReturnType<
      typeof useAppState
    >);

    renderHook(() => useReminders());
    expect(vi.getTimerCount()).toBe(0);
  });

  it("schedules a timer for each enabled reminder when permission is granted", () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.mocked(useAppState).mockReturnValue({
      reminders: [enabledReminder, disabledReminder],
    } as ReturnType<typeof useAppState>);

    renderHook(() => useReminders());
    // Only the enabled reminder should get a timer
    expect(vi.getTimerCount()).toBe(1);
  });

  it("fires notification when timer elapses", () => {
    const MockNotification = Object.assign(vi.fn(), { permission: "granted" });
    vi.stubGlobal("Notification", MockNotification);
    vi.mocked(useAppState).mockReturnValue({ reminders: [enabledReminder] } as ReturnType<
      typeof useAppState
    >);

    renderHook(() => useReminders());
    vi.runOnlyPendingTimers();

    expect(MockNotification).toHaveBeenCalledWith(
      "Gryffin Calorai",
      expect.objectContaining({ body: expect.any(String) }),
    );
  });

  it("clears timers on unmount", () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.mocked(useAppState).mockReturnValue({ reminders: [enabledReminder] } as ReturnType<
      typeof useAppState
    >);

    const { unmount } = renderHook(() => useReminders());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not fire notification after unmount (cancelled flag)", () => {
    const MockNotification = Object.assign(vi.fn(), { permission: "granted" });
    vi.stubGlobal("Notification", MockNotification);
    vi.mocked(useAppState).mockReturnValue({ reminders: [enabledReminder] } as ReturnType<
      typeof useAppState
    >);

    const { unmount } = renderHook(() => useReminders());
    unmount();
    vi.runAllTimers();

    expect(MockNotification).not.toHaveBeenCalled();
  });

  it("does not schedule any timers when reminders list is empty", () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.mocked(useAppState).mockReturnValue({ reminders: [] } as ReturnType<typeof useAppState>);

    renderHook(() => useReminders());
    expect(vi.getTimerCount()).toBe(0);
  });
});

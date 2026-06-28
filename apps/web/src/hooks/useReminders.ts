import { useEffect } from "react";
import { useAppState } from "@/state/AppState";
import type { Reminder } from "@/db/dbService";
import { REMINDER_LABELS } from "@/types";
import { initializePushSubscription } from "@/lib/pushNotifications";

export function msUntilNextReminder(
  timeStr: string,
  daysOfWeek: number,
  now: Date = new Date(),
): number | null {
  const parts = timeStr.split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (isNaN(hh) || isNaN(mm)) return null;

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hh, mm, 0, 0);

    if (candidate <= now) continue;

    // bit 0 = Mon, bit 6 = Sun; JS getDay() is 0=Sun...6=Sat
    const dayIndex = (candidate.getDay() + 6) % 7;
    if (daysOfWeek & (1 << dayIndex)) {
      return candidate.getTime() - now.getTime();
    }
  }
  return null;
}

type NotifCtor = { permission: NotificationPermission } & (new (
  title: string,
  options?: NotificationOptions,
) => Notification);

function getSafeNotif(): NotifCtor | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Notification?: NotifCtor }).Notification ?? null;
}

function fireNotification(reminder: Reminder) {
  const notif = getSafeNotif();
  if (!notif || notif.permission !== "granted") return;
  new notif("Gryffin Calorai", {
    body: REMINDER_LABELS[reminder.type],
    icon: "/favicon.ico",
  });
}

export function useReminders() {
  const { reminders } = useAppState();

  // Register service worker and subscribe to push once on mount. The in-tab setTimeout
  // scheduling below continues to work as a reliable same-session fallback.
  useEffect(() => {
    void initializePushSubscription();
  }, []);

  useEffect(() => {
    const notif = getSafeNotif();
    if (!notif || notif.permission !== "granted") return;

    const handles: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const schedule = (reminder: Reminder) => {
      const ms = msUntilNextReminder(reminder.time, reminder.daysOfWeek);
      if (ms === null) return;

      const id = setTimeout(() => {
        if (cancelled) return;
        fireNotification(reminder);
        schedule(reminder);
      }, ms);
      handles.push(id);
    };

    for (const reminder of reminders) {
      if (reminder.enabled) schedule(reminder);
    }

    return () => {
      cancelled = true;
      handles.forEach(clearTimeout);
    };
  }, [reminders]);
}

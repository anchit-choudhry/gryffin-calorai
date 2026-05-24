import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { REMINDER_LABELS, REMINDER_TYPES } from "@/types";
import type { ReminderType } from "@/types";
import type { Reminder } from "@/db/dbService";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAY_ABBR = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const DEFAULT_DAYS = 0b0011111; // Mon-Fri

interface ReminderRowProps {
  type: ReminderType;
  existing: Reminder | undefined;
}

function ReminderRow({ type, existing }: ReminderRowProps) {
  const { saveReminder } = useAppState();
  const enabled = existing?.enabled ?? false;
  const [time, setTime] = useState(existing?.time ?? "08:00");
  const [days, setDays] = useState(existing?.daysOfWeek ?? DEFAULT_DAYS);

  const persist = (patch: Partial<Omit<Reminder, "id" | "userId">>) => {
    const base = existing
      ? { ...existing, time, daysOfWeek: days }
      : { type, time, daysOfWeek: days, enabled: false };
    void saveReminder({ ...base, ...patch });
  };

  const toggleEnabled = () => persist({ enabled: !enabled });

  const toggleDay = (i: number) => {
    const next = days ^ (1 << i);
    if (next === 0) return;
    setDays(next);
    if (existing) persist({ daysOfWeek: next });
  };

  const handleTimeBlur = () => {
    if (existing) persist({ time });
  };

  return (
    <div className="flex items-start gap-4 py-4">
      <button
        type="button"
        onClick={toggleEnabled}
        className="mt-0.5 text-ink-soft hover:text-ink transition-colors"
        aria-label={
          enabled ? `Disable ${REMINDER_LABELS[type]}` : `Enable ${REMINDER_LABELS[type]}`
        }
        aria-pressed={enabled}
      >
        {enabled ? <Bell className="size-4 text-persimmon" /> : <BellOff className="size-4" />}
      </button>
      <div className="flex-1">
        <p className={cn("text-sm", enabled ? "text-ink" : "text-ink-soft")}>
          {REMINDER_LABELS[type]}
        </p>
        {enabled && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={handleTimeBlur}
              className={cn(EDITORIAL_INPUT_CLS, "w-28")}
              aria-label="Reminder time"
            />
            <div className="flex gap-1" aria-label="Days of week">
              {DAY_ABBR.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  aria-pressed={Boolean(days & (1 << i))}
                  aria-label={DAY_FULL[i]}
                  className={cn(
                    "size-6 text-[10px] font-mono border transition-colors",
                    days & (1 << i)
                      ? "bg-persimmon text-paper border-persimmon"
                      : "text-ink-soft border-rule hover:border-ink",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type NotifAPI = {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
};

function getNotifAPI(): NotifAPI | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { Notification?: NotifAPI };
  return w.Notification ?? null;
}

const RemindersSettings = () => {
  const { reminders } = useAppState();
  const [permState, setPermState] = useState<NotificationPermission>(
    () => getNotifAPI()?.permission ?? "denied",
  );

  const notifSupported = getNotifAPI() !== null;

  const requestPermission = async () => {
    const notif = getNotifAPI();
    if (!notif) return;
    const result = await notif.requestPermission();
    setPermState(result);
  };

  return (
    <div>
      {notifSupported && permState !== "granted" && (
        <div className="mb-4 p-3 border border-rule flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            {permState === "denied"
              ? "Notifications blocked - enable them in your browser settings."
              : "Allow notifications to receive reminders while the app is open."}
          </p>
          {permState !== "denied" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={requestPermission}
              className="text-xs text-persimmon hover:text-persimmon/80 rounded-none shrink-0 h-auto py-1"
            >
              Allow
            </Button>
          )}
        </div>
      )}
      <div className="divide-y divide-rule">
        {REMINDER_TYPES.map((type) => (
          <ReminderRow key={type} type={type} existing={reminders.find((r) => r.type === type)} />
        ))}
      </div>
    </div>
  );
};

RemindersSettings.displayName = "RemindersSettings";
export default RemindersSettings;

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppState";

export interface FastingTimerState {
  elapsedSec: number;
  targetSec: number;
  progress: number; // 0-1
  isComplete: boolean;
  formattedElapsed: string;
  formattedRemaining: string;
}

function formatHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function useFastingTimer(): FastingTimerState & {
  startFasting: (hours: number) => Promise<void>;
  endFasting: (completed: boolean) => Promise<void>;
} {
  const { activeFastingSession, startFasting, endFasting } = useAppState();
  const [elapsedSec, setElapsedSec] = useState(0);
  const notifiedRef = useRef(false);

  const targetSec = (activeFastingSession?.targetHours ?? 0) * 3600;

  useEffect(() => {
    if (!activeFastingSession) {
      notifiedRef.current = false;
      return;
    }

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(activeFastingSession.startTime).getTime()) / 1000,
      );
      setElapsedSec(Math.max(0, elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeFastingSession]);

  // Browser notification when fast completes
  useEffect(() => {
    if (elapsedSec >= targetSec && targetSec > 0 && !notifiedRef.current) {
      notifiedRef.current = true;
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Fast complete!", {
          body: `You completed your ${activeFastingSession?.targetHours}h fast. Tap to confirm.`,
          icon: "/favicon.ico",
        });
      }
    }
  }, [elapsedSec, targetSec, activeFastingSession]);

  const handleStart = useCallback(
    async (hours: number) => {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      await startFasting(hours);
    },
    [startFasting],
  );

  const progress = targetSec > 0 ? Math.min(1, elapsedSec / targetSec) : 0;
  const remaining = Math.max(0, targetSec - elapsedSec);

  return {
    elapsedSec,
    targetSec,
    progress,
    isComplete: targetSec > 0 && elapsedSec >= targetSec,
    formattedElapsed: formatHMS(elapsedSec),
    formattedRemaining: formatHMS(remaining),
    startFasting: handleStart,
    endFasting,
  };
}

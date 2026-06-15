import { toast } from "sonner";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FASTING_PRESETS } from "@/types";
import { MoonPhase } from "@/components/icons/almanac/MoonPhase";
import { useFastingTimer } from "../hooks/useFastingTimer";
import { useAppState } from "../state/AppState";

const RING_R = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

interface RingProps {
  progress: number;
  isComplete: boolean;
  animate: boolean;
}

function FastingRing({ progress, isComplete, animate }: RingProps) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  return (
    <svg viewBox="0 0 100 100" className="size-24" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-rule"
      />
      <circle
        cx="50"
        cy="50"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={animate ? dashOffset : RING_CIRCUMFERENCE * (1 - progress)}
        transform="rotate(-90 50 50)"
        className={cn(
          "transition-[stroke-dashoffset] duration-1000 ease-linear",
          isComplete ? "text-persimmon" : "text-ink",
        )}
      />
    </svg>
  );
}

const FastingTimer = () => {
  const {
    elapsedSec,
    targetSec,
    progress,
    isComplete,
    formattedElapsed,
    startFasting,
    endFasting,
  } = useFastingTimer();
  const { activeFastingSession } = useAppState();
  const shouldReduceMotion = useReducedMotion();

  const isActive = !!activeFastingSession;

  const handleStart = async (hours: number) => {
    await startFasting(hours);
    toast.success(`Started ${hours}h fast`);
  };

  const handleEnd = async () => {
    await endFasting(isComplete);
    toast(isComplete ? "Fast complete - well done!" : "Fast ended early");
  };

  return (
    <div className="overflow-hidden">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mb-4 truncate">
        Fasting
      </h3>

      {isActive ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className={cn(isComplete && !shouldReduceMotion && "animate-pulse")}>
              <FastingRing
                progress={progress}
                isComplete={isComplete}
                animate={!shouldReduceMotion}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <MoonPhase
                progress={progress}
                className={cn("size-10", isComplete ? "text-persimmon" : "text-ink")}
              />
              <span
                className={cn(
                  "font-mono text-[9px] tabular-nums leading-none",
                  isComplete ? "text-persimmon" : "text-ink-soft",
                )}
              >
                {isComplete ? "Done!" : formattedElapsed}
              </span>
            </div>
          </div>

          <div className="text-center overflow-hidden">
            <p className="font-mono text-[10px] text-ink-soft truncate">
              {activeFastingSession.targetHours}h fast
            </p>
            {elapsedSec > 0 && !isComplete && (
              <p className="font-mono text-[9px] text-ink-soft/60 mt-0.5 truncate">
                {Math.round(progress * 100)}% complete
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleEnd}
            className={cn(
              "font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-1.5 w-full",
              isComplete
                ? "bg-persimmon text-paper hover:bg-persimmon/90"
                : "border border-rule text-ink-soft hover:text-ink hover:border-ink bg-transparent",
            )}
          >
            {isComplete ? "Confirm complete" : "End fast"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 overflow-hidden">
          <p className="font-mono text-[9px] text-ink-soft/60 mb-3 truncate">
            Select a protocol to start
          </p>
          <div className="grid grid-cols-3 gap-1">
            {FASTING_PRESETS.map((preset) => (
              <button
                key={preset.hours}
                type="button"
                onClick={() => handleStart(preset.hours)}
                className="border border-rule py-1 px-0.5 font-mono text-[9px] text-ink-soft hover:border-ink hover:text-ink transition-colors truncate"
              >
                <span className="block font-semibold text-ink text-[9px] truncate">
                  {preset.label}
                </span>
                <span className="block text-[8px] truncate">{preset.hours}h</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isActive && targetSec === 0 && (
        <p className="font-mono text-[9px] text-ink-soft/50 mt-3">
          Timer persists if you close the tab.
        </p>
      )}
    </div>
  );
};

export default FastingTimer;

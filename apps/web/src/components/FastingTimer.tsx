import { toast } from "sonner";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FASTING_PRESETS } from "@/types";
import { MoonPhase } from "@/components/icons/almanac/MoonPhase";
import { useFastingTimer } from "../hooks/useFastingTimer";
import { useAppState } from "../state/AppState";

const MOON_R = 40;

interface MoonDiskProps {
  progress: number;
}

function MoonDisk({ progress }: MoonDiskProps) {
  return (
    <svg viewBox="0 0 100 100" className="size-24" aria-hidden="true" data-moon-disk="true">
      <defs>
        <clipPath id="moon-clip">
          <ellipse
            cx={50}
            cy={50}
            rx={progress * MOON_R}
            ry={MOON_R}
            data-moon-clip-ellipse="true"
          />
        </clipPath>
      </defs>
      {/* Dark base disk */}
      <circle
        cx={50}
        cy={50}
        r={MOON_R}
        fill="oklch(88% 0.008 60)"
        className="dark:[fill:oklch(18%_0.01_60)]"
      />
      {/* Illuminated face - persimmon tint, clipped to ellipse */}
      <circle
        cx={50}
        cy={50}
        r={MOON_R}
        fill="oklch(72% 0.16 38 / 0.9)"
        clipPath="url(#moon-clip)"
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
          <div className="flex flex-col items-center">
            <div className={cn("relative", isComplete && !shouldReduceMotion && "animate-pulse")}>
              <MoonDisk progress={progress} />
              <div className="absolute inset-0 flex items-center justify-center">
                <MoonPhase
                  progress={progress}
                  className={cn("size-6", isComplete ? "text-persimmon" : "text-ink")}
                />
              </div>
            </div>
            <span
              className={cn(
                "font-mono text-[9px] tabular-nums leading-none mt-2",
                isComplete ? "text-persimmon" : "text-ink-soft",
              )}
            >
              {isComplete ? "Done!" : formattedElapsed}
            </span>
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
                className="border border-rule py-1 px-0.5 font-mono text-[9px] text-ink-soft hover:border-ink hover:text-ink transition-colors truncate active:scale-[0.97]"
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

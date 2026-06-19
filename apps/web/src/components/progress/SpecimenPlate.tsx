import type { Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

interface SpecimenPlateProps {
  achievement: Achievement;
  plateNum: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function SpecimenPlate({
  achievement,
  plateNum,
  isUnlocked,
  unlockedAt,
}: SpecimenPlateProps) {
  const dateLabel =
    unlockedAt !== undefined
      ? new Date(unlockedAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : undefined;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-5 text-center bg-paper",
        !isUnlocked && "opacity-[0.18]",
      )}
    >
      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-ink-soft/60">
        Plate {plateNum}
      </span>

      <div className="relative size-16">
        <svg
          viewBox="0 0 96 96"
          fill="none"
          className="absolute inset-0 size-full text-ink-soft"
          aria-hidden="true"
        >
          <circle
            cx="48"
            cy="48"
            r="42"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.6"
          />
          <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="48" cy="48" r="30" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        </svg>

        {isUnlocked ? (
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl select-none"
            aria-hidden="true"
          >
            {achievement.icon}
          </span>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-5 border border-dashed border-ink/30 flex items-center justify-center">
              <span className="text-sm grayscale" aria-hidden="true">
                {achievement.icon}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="font-display text-xs font-semibold text-ink leading-snug">
        {achievement.title}
      </p>

      {isUnlocked && dateLabel !== undefined && (
        <p className="font-mono text-[8px] text-persimmon">{dateLabel}</p>
      )}
    </div>
  );
}

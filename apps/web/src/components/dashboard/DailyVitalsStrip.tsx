import type { FC, ReactNode } from "react";
import { Droplets, Flame, Footprints, Timer } from "lucide-react";
import { DAILY_STEP_GOAL } from "@/types";

interface VitalChipProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function VitalChip({ icon, label, value }: VitalChipProps) {
  return (
    <div className="flex items-center gap-2.5 border border-rule bg-paper-raised px-3 py-2.5 shrink-0 snap-start">
      <span className="text-ink-soft/60 shrink-0">{icon}</span>
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft/60 leading-none mb-0.5">
          {label}
        </p>
        <p className="font-mono text-[11px] text-ink tabular-nums leading-none">{value}</p>
      </div>
    </div>
  );
}

interface Props {
  totalWaterMl: number;
  waterGoalMl: number;
  totalSteps: number;
  totalBurned: number;
  fastingTargetHours?: number;
  fastingRemaining?: string;
  fastingComplete?: boolean;
}

export const DailyVitalsStrip: FC<Props> = ({
  totalWaterMl,
  waterGoalMl,
  totalSteps,
  totalBurned,
  fastingTargetHours,
  fastingRemaining,
  fastingComplete,
}) => (
  <div
    className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 snap-x"
    role="list"
    aria-label="Daily vitals"
  >
    <div role="listitem">
      <VitalChip
        icon={<Droplets className="size-3.5" aria-hidden="true" />}
        label="Water"
        value={`${totalWaterMl.toLocaleString()} / ${waterGoalMl.toLocaleString()} ml`}
      />
    </div>
    <div role="listitem">
      <VitalChip
        icon={<Footprints className="size-3.5" aria-hidden="true" />}
        label="Steps"
        value={`${totalSteps.toLocaleString()} / ${DAILY_STEP_GOAL.toLocaleString()}`}
      />
    </div>
    {totalBurned > 0 && (
      <div role="listitem">
        <VitalChip
          icon={<Flame className="size-3.5" aria-hidden="true" />}
          label="Burned"
          value={`${totalBurned.toLocaleString()} kcal`}
        />
      </div>
    )}
    {fastingTargetHours !== undefined && fastingRemaining !== undefined && (
      <div role="listitem">
        <VitalChip
          icon={<Timer className="size-3.5" aria-hidden="true" />}
          label={`${fastingTargetHours}h fast`}
          value={fastingComplete === true ? "Complete!" : fastingRemaining}
        />
      </div>
    )}
  </div>
);

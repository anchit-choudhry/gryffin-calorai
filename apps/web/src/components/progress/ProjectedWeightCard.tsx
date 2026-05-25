import { useMemo } from "react";
import { Target } from "lucide-react";
import type { TdeeProfile } from "@/db/dbService";
import { GOAL_LABELS, GOAL_OFFSETS, kgToLb } from "@/types";
import { projectedDateForWeightChange } from "@/lib/tdee";

interface ProjectedWeightCardProps {
  tdeeProfile: TdeeProfile;
  weightUnit?: "kg" | "lb";
}

function formatProjectedDate(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86400000);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (diffDays <= 7) return `${dateStr} (this week)`;
  if (diffDays <= 30) return `${dateStr} (${Math.round(diffDays / 7)} weeks)`;
  if (diffDays <= 365) return `${dateStr} (~${Math.round(diffDays / 30)} months)`;
  return `${dateStr} (~${(diffDays / 365).toFixed(1)} years)`;
}

const ProjectedWeightCard = ({ tdeeProfile, weightUnit = "kg" }: ProjectedWeightCardProps) => {
  const { goal, weightKg, targetWeightKg } = tdeeProfile;
  const dailyOffsetKcal = Math.abs(GOAL_OFFSETS[goal]);
  const weeklyRateKg = Math.round(((dailyOffsetKcal * 7) / 7700) * 100) / 100;
  const weeklyRateDisplay =
    weightUnit === "lb" ? Math.round(kgToLb(weeklyRateKg) * 100) / 100 : weeklyRateKg;

  const projection = useMemo(() => {
    if (goal === "maintain" || targetWeightKg === undefined) return null;
    return projectedDateForWeightChange(weightKg, targetWeightKg, dailyOffsetKcal);
  }, [goal, weightKg, targetWeightKg, dailyOffsetKcal]);

  const currentDisplay =
    weightUnit === "lb" ? Math.round(kgToLb(weightKg) * 10) / 10 : Math.round(weightKg * 10) / 10;
  const targetDisplay =
    targetWeightKg !== undefined
      ? weightUnit === "lb"
        ? Math.round(kgToLb(targetWeightKg) * 10) / 10
        : Math.round(targetWeightKg * 10) / 10
      : null;

  const diffKg = targetWeightKg !== undefined ? targetWeightKg - weightKg : null;
  const diffDisplay =
    diffKg !== null
      ? weightUnit === "lb"
        ? Math.round(kgToLb(Math.abs(diffKg)) * 10) / 10
        : Math.round(Math.abs(diffKg) * 10) / 10
      : null;

  return (
    <div className="border border-rule p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Target className="w-4 h-4 text-persimmon shrink-0" />
        <h3 className="font-sans text-sm font-semibold text-ink">Weight Projection</h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink-soft border border-rule px-2 py-0.5">
          {GOAL_LABELS[goal]}
        </span>
      </div>

      {goal === "maintain" ? (
        <p className="font-sans text-sm text-ink-soft">
          You're set to maintain your current weight of{" "}
          <span className="font-semibold text-ink">
            {currentDisplay} {weightUnit}
          </span>
          . No projection needed.
        </p>
      ) : (
        <div className="divide-y divide-rule border border-rule">
          <div className="flex justify-between px-4 py-3">
            <span className="font-sans text-sm text-ink-soft">Current weight</span>
            <span className="font-mono text-sm text-ink">
              {currentDisplay} {weightUnit}
            </span>
          </div>

          {targetDisplay !== null ? (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">Target weight</span>
              <span className="font-mono text-sm text-ink">
                {targetDisplay} {weightUnit}
              </span>
            </div>
          ) : (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">Target weight</span>
              <span className="font-mono text-sm text-ink-soft italic">
                Set in Settings - Profile
              </span>
            </div>
          )}

          <div className="flex justify-between px-4 py-3">
            <span className="font-sans text-sm text-ink-soft">
              Pace ({goal === "lose" ? "deficit" : "surplus"})
            </span>
            <span className="font-mono text-sm text-ink">
              ~{weeklyRateDisplay} {weightUnit}/week
            </span>
          </div>

          {diffDisplay !== null && projection && (
            <div className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">
                {diffDisplay} {weightUnit} to go
              </span>
              <span className="font-mono text-sm font-semibold text-persimmon">
                {formatProjectedDate(projection)}
              </span>
            </div>
          )}

          {diffDisplay !== null && !projection && targetWeightKg !== undefined && (
            <div className="px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">
                Target matches current weight - update your goal.
              </span>
            </div>
          )}
        </div>
      )}

      {goal !== "maintain" && targetWeightKg === undefined && (
        <p className="font-sans text-xs text-ink-soft">
          Add a target weight in Settings - Profile to see your projected goal date.
        </p>
      )}
    </div>
  );
};

export default ProjectedWeightCard;

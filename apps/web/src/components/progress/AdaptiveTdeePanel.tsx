import { useMemo } from "react";
import { Brain, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useAppState } from "@/state/AppState";
import type { AdaptiveTdeeResult } from "@/lib/adaptiveTdee";
import { computeAdaptiveTdee, detectPlateau } from "@/lib/adaptiveTdee";
import { computeTDEE, mifflinStJeorBMR } from "@/lib/tdee";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence - need more data",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-ink-soft",
};

interface AdaptiveTdeePanelProps {
  foodLogs: readonly { calories: number; dateLogged: string }[];
}

export function AdaptiveTdeePanel({ foodLogs }: AdaptiveTdeePanelProps) {
  const bodyMeasurements = useAppState((s) => s.bodyMeasurements);
  const adaptiveTdeeEnabled = useAppState((s) => s.adaptiveTdeeEnabled);
  const setAdaptiveTdeeEnabled = useAppState((s) => s.setAdaptiveTdeeEnabled);
  const tdeeProfile = useAppState((s) => s.tdeeProfile);

  const result: AdaptiveTdeeResult | undefined = useMemo(
    () => computeAdaptiveTdee(bodyMeasurements, foodLogs, 21),
    [bodyMeasurements, foodLogs],
  );

  const plateau = useMemo(() => detectPlateau(bodyMeasurements), [bodyMeasurements]);

  const formulaTdee = useMemo(() => {
    if (!tdeeProfile) return null;
    const bmr = mifflinStJeorBMR(
      tdeeProfile.sex,
      tdeeProfile.weightKg,
      tdeeProfile.heightCm,
      tdeeProfile.age,
    );
    return Math.round(computeTDEE(bmr, tdeeProfile.activityLevel));
  }, [tdeeProfile]);

  const tdeeGap = result && formulaTdee ? result.observedTdee - formulaTdee : null;

  return (
    <section aria-labelledby="adaptive-tdee-heading" className="border border-rule">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="size-3.5 text-persimmon" aria-hidden="true" />
          <h3 id="adaptive-tdee-heading" className={cn(LABEL_MONO_CLS, "text-ink")}>
            Adaptive TDEE
          </h3>
        </div>
        <button
          type="button"
          aria-label={
            adaptiveTdeeEnabled ? "Collapse adaptive TDEE panel" : "Expand adaptive TDEE panel"
          }
          onClick={() => setAdaptiveTdeeEnabled(!adaptiveTdeeEnabled)}
          className="text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {adaptiveTdeeEnabled ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {adaptiveTdeeEnabled && (
        <div className="p-4">
          {!result ? (
            <div className="flex items-start gap-3 text-ink-soft">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-sans text-sm">
                  Needs at least 2 weight measurements and 7 days of food logs.
                </p>
                <p className="font-mono text-[10px] mt-1 uppercase tracking-wider text-ink-soft/60">
                  Log weight above in Body Measurements to unlock
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-rule border border-rule">
              <div className="p-3">
                <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>
                  Observed TDEE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-2xl tabular-nums text-ink">
                    {result.observedTdee.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">kcal</span>
                </div>
                <p
                  className={cn(
                    "font-mono text-[10px] mt-0.5",
                    CONFIDENCE_COLOR[result.confidence],
                  )}
                >
                  {CONFIDENCE_LABEL[result.confidence]}
                </p>
              </div>

              <div className="p-3">
                <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>Avg intake</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-2xl tabular-nums text-ink">
                    {result.avgIntake.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">kcal/d</span>
                </div>
                <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
                  {result.daySpan}-day window
                </p>
              </div>

              <div className="p-3">
                <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>
                  Weight change
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className={cn(
                      "font-display text-2xl tabular-nums",
                      result.weightChangeKg > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : result.weightChangeKg < 0
                          ? "text-red-500"
                          : "text-ink",
                    )}
                  >
                    {result.weightChangeKg > 0 ? "+" : ""}
                    {result.weightChangeKg}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">kg</span>
                </div>
                <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
                  {result.dataPoints} measurements
                </p>
              </div>

              {tdeeGap !== null && (
                <div className="p-3">
                  <span className={cn(LABEL_MONO_CLS, "text-[10px] text-ink-soft")}>
                    vs formula
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={cn(
                        "font-display text-2xl tabular-nums",
                        Math.abs(tdeeGap) < 100 ? "text-ink" : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {tdeeGap > 0 ? "+" : ""}
                      {tdeeGap}
                    </span>
                    <span className="font-mono text-xs text-ink-soft">kcal</span>
                  </div>
                  <p className="font-mono text-[10px] text-ink-soft/60 mt-0.5">
                    formula: {formulaTdee?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {plateau.isPlateauing && (
            <div className="mt-3 flex items-start gap-3 border border-amber-700/40 bg-amber-950/20 px-4 py-3">
              <Info className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
              <div>
                <p className={cn(LABEL_MONO_CLS, "text-amber-500")}>Weight plateau detected</p>
                <p className="font-mono text-[10px] text-ink-soft mt-0.5">
                  {plateau.weightChangeKg} kg change over {plateau.daySpan} days - consider
                  adjusting calories by 100-200 kcal
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

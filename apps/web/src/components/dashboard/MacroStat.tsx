import type { FC } from "react";
import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { motionTokens } from "@/lib/motionVariants";

interface Props {
  label: string;
  value: number;
  unit?: string;
  target?: number;
}

const MacroStat: FC<Props> = ({ label, value, unit, target }) => {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());
  const progressRatio = target !== undefined ? Math.min(1, value / (target || 1)) : 0;

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration: motionTokens.durLayout,
      ease: motionTokens.easeOutExpo,
    });
    return () => controls.stop();
  }, [value, shouldReduceMotion, count]);

  return (
    <div className="flex-1 border-l border-rule first:border-l-0 px-4 py-3">
      <p className="text-xs text-ink-soft font-sans">{label}</p>
      <p className="font-display text-2xl font-light tabular-nums mt-1 text-ink">
        <motion.span>{displayCount}</motion.span>
        {unit && target === undefined && (
          <span className="font-mono text-[10px] tracking-widest text-ink-soft/60 ml-1">
            {unit}
          </span>
        )}
        {target !== undefined && (
          <span className="font-mono text-[10px] tracking-widest text-ink-soft/40 ml-1">
            / {target}
            {unit}
          </span>
        )}
      </p>
      {target !== undefined && (
        <div
          className="relative w-full h-[2px] bg-rule mt-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressRatio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} progress`}
        >
          <motion.div
            className="absolute inset-0 bg-persimmon origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progressRatio }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: motionTokens.durLayout, ease: "easeOut" }
            }
          />
        </div>
      )}
    </div>
  );
};

export default MacroStat;

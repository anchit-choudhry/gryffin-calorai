import type { FC } from "react";
import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { motionTokens } from "@/lib/motionVariants";

interface Props {
  label: string;
  value: number;
  unit?: string;
}

const MacroStat: FC<Props> = ({ label, value, unit }) => {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());

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
        {unit && (
          <span className="font-mono text-[10px] tracking-widest text-ink-soft/60 ml-1">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
};

export default MacroStat;

export { useReducedMotion } from "motion/react";
import { useReducedMotion } from "motion/react";

export const MAIN_CONTENT_ID = "main";

// ---- useMotionPreset ----------------------------------------------------------
// Returns named motion variant objects for the 4 key animated moments.
// Full-motion: spatial transforms + opacity. Reduced-motion: crossfade (opacity only).
// Usage: const v = useMotionPreset("pageTransition");
//        <motion.div variants={v} initial="hidden" animate="visible" exit="exit" />

export type MotionPresetName =
  | "pageTransition"
  | "dialogOpen"
  | "achievementStamp"
  | "sectionEntry";

type EaseArray = [number, number, number, number];

const OUT_EXPO: EaseArray = [0.16, 1, 0.3, 1];
const IN_OUT: EaseArray = [0.65, 0, 0.35, 1];

type MotionVariantMap = {
  hidden: Record<string, unknown>;
  visible: Record<string, unknown>;
  exit: Record<string, unknown>;
};

const CROSSFADE: MotionVariantMap = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

const FULL_PRESETS: Record<MotionPresetName, MotionVariantMap> = {
  pageTransition: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: OUT_EXPO } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: IN_OUT } },
  },
  dialogOpen: {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: OUT_EXPO } },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: IN_OUT } },
  },
  achievementStamp: {
    hidden: { opacity: 0, scale: 0.6 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: OUT_EXPO } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: IN_OUT } },
  },
  sectionEntry: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: OUT_EXPO } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: IN_OUT } },
  },
};

export function useMotionPreset(name: MotionPresetName): MotionVariantMap {
  const reduced = useReducedMotion();
  return reduced ? CROSSFADE : FULL_PRESETS[name];
}

export type AriaLiveValue = "off" | "polite" | "assertive";

export function liveRegionProps(politeness: AriaLiveValue = "polite") {
  return {
    "aria-live": politeness,
    "aria-atomic": true as const,
    role: "status" as const,
  } as const;
}

export function assertiveRegionProps() {
  return {
    "aria-live": "assertive" as const,
    "aria-atomic": true as const,
    role: "alert" as const,
  } as const;
}

export function visuallyHiddenProps() {
  return {
    className: "sr-only",
  } as const;
}

import { useReducedMotion } from "motion/react";

/** JS-side mirrors of the --dur-* / --ease-* CSS tokens in style.css */
export const motionTokens = {
  durInstant: 0.12,
  durState: 0.24,
  durLayout: 0.4,
  durEntrance: 0.6,
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeOutQuart: [0.25, 1, 0.5, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export const pageVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.durLayout, ease: motionTokens.easeOutExpo },
  },
};

export const entranceVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.durEntrance, ease: motionTokens.easeOutExpo },
  },
};

export const exitVariants = {
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: motionTokens.durLayout * 0.75, ease: motionTokens.easeInOut },
  },
};

export const coachmarkVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.durLayout, ease: motionTokens.easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: motionTokens.durState, ease: motionTokens.easeInOut },
  },
};

export const spotlightVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: motionTokens.durState, ease: motionTokens.easeOutQuart },
  },
  exit: {
    opacity: 0,
    transition: { duration: motionTokens.durState * 0.75, ease: motionTokens.easeInOut },
  },
};

/**
 * Returns section motion props, or {} when the user prefers reduced motion.
 * Use as spread: <motion.section {...useSectionMotion()} />
 */
export function useSectionMotion() {
  const reduced = useReducedMotion();
  if (reduced) return {};
  return { variants: sectionVariants };
}

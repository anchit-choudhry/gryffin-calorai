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
  easeSpring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const pageVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/** Hero section: scale-in from 98% + fade, giving the masthead a grounding entrance. */
export const heroVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: motionTokens.durEntrance, ease: motionTokens.easeOutExpo },
  },
};

/** Counter pop: number change triggers a spring scale punch. Use with `key={value}`. */
export const counterPopVariants = {
  initial: { scale: 0.7, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: motionTokens.durState, ease: motionTokens.easeSpring },
  },
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

// Crossfade-only variants for reduced-motion: opacity fade, no spatial transforms
const crossfadeSectionVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
};

/**
 * Returns section motion props with crossfade fallback for reduced-motion.
 * Use as spread: <motion.section {...useSectionMotion()} />
 * Intended for sections inside a staggered parent (no initial/animate needed).
 */
export function useSectionMotion() {
  const reduced = useReducedMotion();
  return { variants: reduced ? crossfadeSectionVariants : sectionVariants };
}

/**
 * Returns standalone section motion props with initial/animate.
 * Crossfade-only (opacity) when user prefers reduced motion.
 */
export function useStandaloneSection() {
  const reduced = useReducedMotion();
  return {
    variants: reduced ? crossfadeSectionVariants : sectionVariants,
    initial: "hidden" as const,
    animate: "show" as const,
  };
}

/**
 * Returns page-level motion props. Page variants stagger children — safe for reduced motion
 * since spatial transforms live in section children, not the page container itself.
 */
export function usePageMotion() {
  const reduced = useReducedMotion();
  if (reduced) return {};
  return { variants: pageVariants, initial: "hidden" as const, animate: "show" as const };
}

/**
 * Returns hero section variants. The masthead gets a scale-in entrance to anchor
 * the page visually before staggered children follow.
 */
export function useHeroSection() {
  const reduced = useReducedMotion();
  return {
    variants: reduced ? crossfadeSectionVariants : heroVariants,
  };
}

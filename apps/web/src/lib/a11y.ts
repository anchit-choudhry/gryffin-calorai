export { useReducedMotion } from "motion/react";

export const MAIN_CONTENT_ID = "main";

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

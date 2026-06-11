export type HapticPattern = "tap" | "success" | "error" | "milestone";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [10, 50, 10],
  error: [30, 50, 30, 50, 30],
  milestone: [10, 30, 10, 30, 100],
};

export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function triggerHaptic(pattern: HapticPattern): void {
  if (!isHapticsSupported()) return;
  navigator.vibrate(HAPTIC_PATTERNS[pattern]);
}

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAppState } from "@/state/AppState";
import { ACHIEVEMENTS } from "@/lib/achievements";

export function HarvestStamp() {
  const { pendingAchievementId, dismissAchievement } = useAppState();
  const reducedMotion = useReducedMotion();

  const achievement = ACHIEVEMENTS.find((a) => a.id === pendingAchievementId);

  const stampVariants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: { opacity: 0, scale: 0.6 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          },
        },
        exit: {
          opacity: 0,
          scale: 0.9,
          transition: {
            duration: 0.2,
            ease: [0.65, 0, 0.35, 1] as [number, number, number, number],
          },
        },
      };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {achievement && (
        <>
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[200] bg-ink/60 backdrop-blur-sm"
            onClick={dismissAchievement}
            aria-hidden="true"
          />
          <motion.div
            key="stamp"
            role="dialog"
            aria-modal="true"
            aria-labelledby="harvest-stamp-title"
            variants={stampVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto text-center px-8 max-w-xs w-full">
              {/* Circular stamp */}
              <div className="relative mx-auto mb-6 size-40">
                <svg
                  viewBox="0 0 160 160"
                  fill="none"
                  className="absolute inset-0 size-full text-persimmon"
                  aria-hidden="true"
                >
                  {/* outer dashed border ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="74"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                    opacity="0.6"
                  />
                  {/* inner solid ring */}
                  <circle cx="80" cy="80" r="66" stroke="currentColor" strokeWidth="2.5" />
                  {/* inner hairline ring */}
                  <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="0.5" />
                </svg>
                {/* Achievement icon */}
                <span
                  className="absolute inset-0 flex items-center justify-center text-5xl select-none"
                  aria-hidden="true"
                >
                  {achievement.icon}
                </span>
                {/* Shimmer overlay — CSS keyframe, respects prefers-reduced-motion via animation-duration */}
                <div
                  className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-paper/20 to-transparent animate-[shimmer_1.2s_ease-out_0.4s_1_forwards] opacity-0" />
                </div>
              </div>

              {/* Text */}
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-persimmon mb-2">
                Achievement Unlocked
              </p>
              <h2
                id="harvest-stamp-title"
                className="font-display text-2xl font-light text-ink mb-2 bg-paper px-4 py-1"
              >
                {achievement.title}
              </h2>
              <p className="font-mono text-xs text-ink-soft mb-6 bg-paper px-4 py-1">
                {achievement.description}
              </p>

              <button
                onClick={dismissAchievement}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft border border-rule px-6 py-3 hover:border-persimmon hover:text-persimmon transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

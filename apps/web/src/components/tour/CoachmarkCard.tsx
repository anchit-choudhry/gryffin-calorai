import type { FC } from "react";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { coachmarkVariants } from "@/lib/motionVariants";
import type { TourStep } from "./tourSteps";

interface CoachmarkCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  style: React.CSSProperties;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLast: boolean;
  isFirst: boolean;
  reducedMotion: boolean;
}

const CoachmarkCard: FC<CoachmarkCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  style,
  onNext,
  onPrev,
  onSkip,
  isLast,
  isFirst,
  reducedMotion,
}) => {
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nextBtnRef.current?.focus();
  }, [stepIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onNext();
    }
    if (e.key === "ArrowLeft" && !isFirst) {
      e.preventDefault();
      onPrev();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onSkip();
    }
  };

  const labelId = `tour-step-title-${stepIndex}`;
  const bodyId = `tour-step-body-${stepIndex}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={bodyId}
        variants={reducedMotion ? undefined : coachmarkVariants}
        initial={reducedMotion ? undefined : "hidden"}
        animate={reducedMotion ? undefined : "show"}
        exit={reducedMotion ? undefined : "exit"}
        style={style}
        className="fixed z-[61] w-72 border border-rule bg-paper shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-sans uppercase tracking-widest text-ink-soft">
                Step {stepIndex + 1} of {totalSteps}
              </span>
              <h2
                id={labelId}
                className="font-display text-lg font-semibold text-ink leading-tight"
              >
                {step.isFirst ? "Quick tour" : step.title}
              </h2>
            </div>
            <button
              onClick={onSkip}
              className="shrink-0 mt-0.5 size-[44px] flex items-center justify-center text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
              aria-label="Skip tour"
            >
              <X className="size-4" />
            </button>
          </div>

          <p id={bodyId} className="font-sans text-sm text-ink-soft leading-relaxed">
            {step.isFirst ? `${step.body} Take 90 seconds to see the highlights.` : step.body}
          </p>

          {/* aria-live region for screen-reader step announcements */}
          <div aria-live="polite" className="sr-only">
            Step {stepIndex + 1} of {totalSteps}: {step.title}. {step.body}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onSkip}
              className="font-sans text-xs text-ink-soft hover:text-ink underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1 px-2 py-2"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="flex items-center justify-center size-[44px] border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
              <button
                ref={nextBtnRef}
                onClick={onNext}
                className="flex items-center gap-1.5 px-4 h-[44px] bg-persimmon text-paper font-sans text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                aria-label={isLast ? "Finish tour" : "Next step"}
              >
                {isLast ? "Done" : "Next"}
                {!isLast && <ChevronRight className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

CoachmarkCard.displayName = "CoachmarkCard";

export default CoachmarkCard;

import type { FC } from "react";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { coachmarkVariants } from "@/lib/motionVariants";
import { toRoman } from "@/lib/utils";
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
        className="fixed z-[61] w-72 border border-rule bg-paper"
        onKeyDown={handleKeyDown}
      >
        {/* Journal running head - folio + close */}
        <div className="flex items-center justify-between border-b border-rule/50 px-4 py-1.5">
          <span className="font-serif text-[9px] italic text-ink-soft/50 tracking-tight">
            Field Journal
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-ink-soft/35">
            {toRoman(stepIndex + 1)}&nbsp;&middot;&nbsp;{toRoman(totalSteps)}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center size-[44px] -mr-2.5 text-ink-soft/50 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
            aria-label="Skip tour"
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Journal entry body */}
        <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
          <h2 id={labelId} className="font-serif text-[19px] font-normal text-ink leading-snug">
            {isFirst ? "Welcome to your field journal" : step.title}
          </h2>

          {/* Dotted leader rule under title - field journal annotation style */}
          <div className="border-b border-dotted border-rule/60" aria-hidden="true" />

          <p id={bodyId} className="font-sans text-sm text-ink-soft leading-relaxed">
            {isFirst ? `${step.body} Take 90 seconds to see the highlights.` : step.body}
          </p>

          {/* aria-live region for screen-reader step announcements */}
          <div aria-live="polite" className="sr-only">
            Step {stepIndex + 1} of {totalSteps}: {step.title}. {step.body}
          </div>
        </div>

        {/* Journal footer - page-turn navigation */}
        <div className="flex items-center justify-between border-t border-rule/50 px-4 py-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft/50 hover:text-ink-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1 py-2 pr-2"
          >
            Close
          </button>
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="flex items-center justify-center size-9 border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1 active:scale-[0.97]"
                aria-label="Previous step"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            )}
            <button
              ref={nextBtnRef}
              type="button"
              onClick={onNext}
              className="flex items-center gap-1 px-4 h-9 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-persimmon/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
              aria-label={isLast ? "Finish tour" : "Next step"}
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ChevronRight className="size-3" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

CoachmarkCard.displayName = "CoachmarkCard";

export default CoachmarkCard;

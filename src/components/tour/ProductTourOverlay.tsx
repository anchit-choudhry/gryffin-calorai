import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAppState } from "@/state/AppState";
import { TOUR_STEPS } from "./tourSteps";
import { useSpotlightRect } from "./useSpotlightRect";
import CoachmarkCard from "./CoachmarkCard";
import { spotlightVariants } from "@/lib/motionVariants";

const CARD_WIDTH = 288; // w-72
const CARD_HEIGHT = 200; // approximate
const CARD_OFFSET = 12;
const MOBILE_BOTTOM_NAV_HEIGHT = 64;
const MOBILE_BREAKPOINT = 640;

function computeCardStyle(
  rect: { top: number; left: number; width: number; height: number },
  placement: "below" | "above" | "auto",
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < MOBILE_BREAKPOINT;

  if (isMobile) {
    return {
      position: "fixed",
      bottom: MOBILE_BOTTOM_NAV_HEIGHT + 8,
      left: "50%",
      transform: "translateX(-50%)",
      width: Math.min(CARD_WIDTH, vw - 32),
    };
  }

  let top: number;
  const effectivePlacement =
    placement === "auto"
      ? rect.top + rect.height + CARD_OFFSET + CARD_HEIGHT > vh - 24
        ? "above"
        : "below"
      : placement;

  if (effectivePlacement === "above") {
    top = rect.top - CARD_HEIGHT - CARD_OFFSET;
    if (top < 8) top = rect.top + rect.height + CARD_OFFSET;
  } else {
    top = rect.top + rect.height + CARD_OFFSET;
    if (top + CARD_HEIGHT > vh - 8) top = rect.top - CARD_HEIGHT - CARD_OFFSET;
  }

  let left = rect.left;
  if (left + CARD_WIDTH > vw - 8) left = vw - CARD_WIDTH - 8;
  if (left < 8) left = 8;

  return { position: "fixed", top, left, width: CARD_WIDTH };
}

const ProductTourOverlay: FC = () => {
  const tourActive = useAppState((s) => s.tourActive);
  const tourStep = useAppState((s) => s.tourStep);
  const tourTotalSteps = useAppState((s) => s.tourTotalSteps);
  const nextTourStep = useAppState((s) => s.nextTourStep);
  const prevTourStep = useAppState((s) => s.prevTourStep);
  const endTour = useAppState((s) => s.endTour);
  const skipTour = useAppState((s) => s.skipTour);
  const reducedMotion = useReducedMotion() ?? false;

  const currentStep = TOUR_STEPS[tourStep];
  const spotlightRect = useSpotlightRect(
    tourActive && currentStep ? currentStep.targetId : null,
    tourActive,
  );

  // Navigate to the correct page when tour step changes
  useEffect(() => {
    if (!tourActive || !currentStep) return;
    const targetHash = `#${currentStep.page}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, [tourActive, currentStep]);

  // Trap focus: make <main> inert while tour is active, except for the target section
  useEffect(() => {
    if (!tourActive) return;
    const main = document.getElementById("main");
    if (!main) return;
    main.setAttribute("inert", "");
    const target = currentStep
      ? document.querySelector(`[data-tour-id="${currentStep.targetId}"]`)
      : null;
    const targetParent = target?.closest("section") ?? null;
    if (targetParent) targetParent.removeAttribute("inert");
    return () => {
      main.removeAttribute("inert");
    };
  }, [tourActive, currentStep, spotlightRect]);

  // Global Esc handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && tourActive) {
        e.preventDefault();
        void skipTour();
      }
    },
    [tourActive, skipTour],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleNext = useCallback(() => {
    if (tourStep === tourTotalSteps - 1) {
      void endTour();
    } else {
      nextTourStep();
    }
  }, [tourStep, tourTotalSteps, endTour, nextTourStep]);

  const handlePrev = useCallback(() => {
    prevTourStep();
  }, [prevTourStep]);

  const handleSkip = useCallback(() => {
    void skipTour();
  }, [skipTour]);

  if (!tourActive || !currentStep) return null;

  const cardStyle = computeCardStyle(spotlightRect, currentStep.placement ?? "auto");
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* SVG dim mask with cut-out spotlight */}
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-[60] pointer-events-none"
            variants={reducedMotion ? undefined : spotlightVariants}
            initial={reducedMotion ? undefined : "hidden"}
            animate={reducedMotion ? undefined : "show"}
            exit={reducedMotion ? undefined : "exit"}
          >
            <svg
              width={vw}
              height={vh}
              viewBox={`0 0 ${vw} ${vh}`}
              className="w-full h-full"
              style={{ position: "absolute", inset: 0 }}
            >
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect width={vw} height={vh} fill="white" />
                  <rect
                    x={spotlightRect.left}
                    y={spotlightRect.top}
                    width={spotlightRect.width}
                    height={spotlightRect.height}
                    rx="2"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width={vw}
                height={vh}
                fill="oklch(8% 0.005 250)"
                fillOpacity={0.62}
                mask="url(#tour-spotlight-mask)"
              />
            </svg>
          </motion.div>

          {/* Coachmark card */}
          <CoachmarkCard
            step={currentStep}
            stepIndex={tourStep}
            totalSteps={tourTotalSteps}
            style={cardStyle}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            isFirst={tourStep === 0}
            isLast={tourStep === tourTotalSteps - 1}
            reducedMotion={reducedMotion}
          />
        </>
      )}
    </AnimatePresence>
  );
};

ProductTourOverlay.displayName = "ProductTourOverlay";

export default ProductTourOverlay;

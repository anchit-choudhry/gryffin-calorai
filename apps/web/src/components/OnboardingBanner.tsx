import { useState } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

interface Props {
  onOpenModal: () => void;
}

const OnboardingBanner = ({ onOpenModal }: Props) => {
  const [dismissed, setDismissed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (dismissed) return null;

  return (
    <motion.div
      className="col-span-12 border border-l-4 border-persimmon bg-paper-raised px-6 py-4 flex items-center gap-4"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-semibold text-ink">Personalise your calorie goal</p>
        <p className="font-sans text-xs text-ink-soft mt-0.5">
          Set up your profile so your daily target reflects your body and goals.
        </p>
      </div>
      <Button
        onClick={onOpenModal}
        className="shrink-0 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-2 hover:bg-persimmon/90"
      >
        Set up goals
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
};

export default OnboardingBanner;

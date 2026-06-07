import { useCallback, useEffect, useRef } from "react";
import { Mic, Pencil, QrCode, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/a11y";
import { motionTokens } from "@/lib/motionVariants";
import { useAppState } from "@/state/AppState";

export type QuickAction = "write" | "scan" | "speak";

interface QuickAddModalProps {
  onAction: (action: QuickAction) => void;
}

const ACTIONS = [
  { id: "write" as const, label: "Log Food", sub: "Type a food name", Icon: Pencil },
  { id: "scan" as const, label: "Scan Barcode", sub: "Use your camera", Icon: QrCode },
  { id: "speak" as const, label: "Voice Log", sub: "Speak your meal", Icon: Mic },
] as const;

export function QuickAddModal({ onAction }: QuickAddModalProps) {
  const quickAddOpen = useAppState((s) => s.quickAddOpen);
  const closeQuickAdd = useAppState((s) => s.closeQuickAdd);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = useReducedMotion();

  // Sync Zustand open state → native dialog.showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !quickAddOpen || dialog.open) return;
    dialog.showModal();
  }, [quickAddOpen]);

  // Intercept native Escape (cancel) so Zustand drives the close sequence,
  // allowing the exit animation to complete before dialog.close() is called.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeQuickAdd();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [closeQuickAdd]);

  // Called by AnimatePresence after all exit animations finish — safe to close.
  const handleExitComplete = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const sheetVariants = {
    hidden: { y: reducedMotion ? 0 : "100%", opacity: reducedMotion ? 0 : 1 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.15 : 0.3,
        ease: motionTokens.easeOutExpo,
      },
    },
    exit: {
      y: reducedMotion ? 0 : "100%",
      opacity: reducedMotion ? 0 : 1,
      transition: {
        duration: 0.2,
        ease: motionTokens.easeInOut,
      },
    },
  };

  return (
    /*
     * <dialog> lives always in the DOM; showModal() places it in the top layer
     * for native focus-trapping and Escape handling.  open: Tailwind variants
     * override the UA's centered positioning so it acts as a full-viewport host.
     * [&::backdrop]:hidden hides the UA backdrop — we supply our own animated one.
     */
    <dialog
      ref={dialogRef}
      aria-label="Quick add"
      className="m-0 w-full max-w-none border-0 bg-transparent p-0 open:fixed open:inset-0 open:h-full open:overflow-hidden [&::backdrop]:hidden"
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {quickAddOpen && (
          <>
            <motion.div
              key="qa-backdrop"
              className="fixed inset-0 bg-ink/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeQuickAdd}
              aria-hidden="true"
            />
            <motion.div
              key="qa-sheet"
              className="fixed inset-x-0 bottom-0 border-t border-rule bg-paper pb-[calc(1.5rem+var(--safe-bottom,0px))]"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-center justify-between border-b border-rule px-5 pb-3 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Quick Add
                </span>
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  aria-label="Close quick add"
                  className="flex size-9 items-center justify-center text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-px grid grid-cols-3 gap-px bg-rule">
                {ACTIONS.map(({ id, label, sub, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onAction(id)}
                    className="flex flex-col items-center gap-2 bg-paper py-6 text-center transition-colors hover:bg-paper-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    <Icon className="size-6 text-persimmon" aria-hidden="true" />
                    <span className="font-sans text-sm font-semibold text-ink">{label}</span>
                    <span className="font-mono text-[10px] text-ink-soft">{sub}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}

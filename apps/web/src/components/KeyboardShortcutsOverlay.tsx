import type { FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppState } from "@/state/AppState";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  label: string;
  items: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Logging",
    items: [
      { keys: ["Cmd/Ctrl", "K"], description: "Open command palette" },
      { keys: ["L"], description: "Focus food logger" },
      { keys: ["W"], description: "Add 250 ml water" },
      { keys: ["S"], description: "Log steps" },
      { keys: ["B"], description: "Open barcode scanner" },
    ],
  },
  {
    label: "Navigation",
    items: [
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "r"], description: "Go to Recipes" },
      { keys: ["g", "p"], description: "Go to Progress" },
      { keys: ["/"], description: "Focus recipe search" },
    ],
  },
  {
    label: "Display",
    items: [
      { keys: ["D"], description: "Toggle dark mode" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
];

const KeyboardShortcutsOverlay: FC<Props> = ({ open, onClose }) => {
  const startTour = useAppState((s) => s.startTour);

  const handleReplayTour = () => {
    startTour();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-none border border-rule bg-paper">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold text-ink">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft/60 mb-1.5">
                {group.label}
              </p>
              <ul className="divide-y divide-rule/40">
                {group.items.map(({ keys, description }) => (
                  <li key={description} className="flex items-center justify-between py-2">
                    <span className="text-sm text-ink-soft">{description}</span>
                    <span className="flex items-center gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 border border-rule rounded text-xs font-mono bg-paper-muted text-ink"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border-t border-rule pt-3">
            <button
              type="button"
              onClick={handleReplayTour}
              className="w-full flex items-center justify-between text-sm text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
            >
              <span>Replay product tour</span>
              <span className="text-xs text-ink-soft/60">guided walkthrough</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

KeyboardShortcutsOverlay.displayName = "KeyboardShortcutsOverlay";

export default KeyboardShortcutsOverlay;

import { useEffect } from "react";

interface Handlers {
  onFocusLogger: () => void;
  onAddWater: () => void;
  onAddStep: () => void;
  onOpenBarcode: () => void;
  onFocusRecipeSearch: () => void;
  onToggleHelp: () => void;
  onToggleDark: () => void;
  onNavigate: (page: "dashboard" | "recipes" | "progress") => void;
  onOpenQuickAdd: () => void;
  onOpenCommandPalette: () => void;
}

export function useKeyboardShortcuts(handlers: Handlers) {
  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        // jsdom does not compute isContentEditable reliably; check the attribute directly for test fidelity.
        (target instanceof HTMLElement && target.contentEditable === "true");

      if (e.key === "g" && !inInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 800);
        return;
      }

      if (gPressed && !inInput) {
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        switch (e.key) {
          case "d":
            handlers.onNavigate("dashboard");
            return;
          case "r":
            handlers.onNavigate("recipes");
            return;
          case "p":
            handlers.onNavigate("progress");
            return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handlers.onOpenCommandPalette();
        return;
      }

      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "l":
          handlers.onFocusLogger();
          break;
        case "w":
          handlers.onAddWater();
          break;
        case "s":
          handlers.onAddStep();
          break;
        case "b":
          handlers.onOpenBarcode();
          break;
        case "/":
          handlers.onFocusRecipeSearch();
          break;
        case "?":
          handlers.onToggleHelp();
          break;
        case "d":
          handlers.onToggleDark();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [handlers]);
}

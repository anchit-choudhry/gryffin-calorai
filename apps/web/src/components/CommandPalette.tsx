import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BookOpen,
  Calendar,
  CalendarCheck,
  LayoutDashboard,
  Mic,
  Moon,
  Pencil,
  QrCode,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/a11y";
import { motionTokens } from "@/lib/motionVariants";
import { useAppState } from "@/state/AppState";
import { cn } from "@/lib/utils";
import { fuzzyMatchFoodName, ISODate, todayISO } from "@/types";
import type { FoodItem } from "@/db/dbService";

interface PaletteCommand {
  id: string;
  label: string;
  keywords: string;
  category: string;
  Icon: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

interface PaletteFood {
  id: string;
  label: string;
  sub: string;
  item: FoodItem;
  onSelect: () => void;
}

type PaletteEntry = PaletteCommand | PaletteFood;

function isFood(entry: PaletteEntry): entry is PaletteFood {
  return "item" in entry;
}

interface CommandPaletteProps {
  onNavigate: (hash: string) => void;
  onAction: (action: "write" | "scan" | "speak") => void;
  onToggleDark: () => void;
  onToggleHelp: () => void;
}

const EMPTY_FOOD: readonly FoodItem[] = [];

export function CommandPalette({
  onNavigate,
  onAction,
  onToggleDark,
  onToggleHelp,
}: CommandPaletteProps) {
  const commandPaletteOpen = useAppState((s) => s.commandPaletteOpen);
  const closeCommandPalette = useAppState((s) => s.closeCommandPalette);
  const selectedDate = useAppState((s) => s.selectedDate);
  const setSelectedDate = useAppState((s) => s.setSelectedDate);
  const allFoodItems = useAppState((s) => s.allFoodItems);
  const addFoodLog = useAppState((s) => s.addFoodLog);
  const userId = useAppState((s) => s.userId);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const close = useCallback(() => {
    closeCommandPalette();
    setQuery("");
    setActiveIndex(0);
  }, [closeCommandPalette]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !commandPaletteOpen || dialog.open) return;
    dialog.showModal();
    setQuery("");
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [commandPaletteOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [close]);

  const handleExitComplete = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const prevDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    void setSelectedDate(ISODate(d.toISOString().split("T")[0]!));
    close();
  }, [selectedDate, setSelectedDate, close]);

  const nextDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0]!;
    if (next > todayISO()) return;
    void setSelectedDate(ISODate(next));
    close();
  }, [selectedDate, setSelectedDate, close]);

  const goToToday = useCallback(() => {
    void setSelectedDate(todayISO());
    close();
  }, [setSelectedDate, close]);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: "nav-dashboard",
        label: "Dashboard",
        keywords: "home main diary g d",
        category: "Navigate",
        Icon: LayoutDashboard,
        shortcut: "G D",
        onSelect: () => {
          onNavigate("#dashboard");
          close();
        },
      },
      {
        id: "nav-recipes",
        label: "Recipes",
        keywords: "cookbook meals g r",
        category: "Navigate",
        Icon: BookOpen,
        shortcut: "G R",
        onSelect: () => {
          onNavigate("#recipes");
          close();
        },
      },
      {
        id: "nav-progress",
        label: "Progress",
        keywords: "charts stats trends g p",
        category: "Navigate",
        Icon: BarChart2,
        shortcut: "G P",
        onSelect: () => {
          onNavigate("#progress");
          close();
        },
      },
      {
        id: "nav-settings",
        label: "Settings",
        keywords: "preferences profile goal tdee",
        category: "Navigate",
        Icon: Settings,
        onSelect: () => {
          onNavigate("#settings");
          close();
        },
      },
      {
        id: "log-food",
        label: "Log Food",
        keywords: "type write add entry",
        category: "Log",
        Icon: Pencil,
        shortcut: "L",
        onSelect: () => {
          onAction("write");
          close();
        },
      },
      {
        id: "log-barcode",
        label: "Scan Barcode",
        keywords: "camera scan qr upc",
        category: "Log",
        Icon: QrCode,
        shortcut: "B",
        onSelect: () => {
          onAction("scan");
          close();
        },
      },
      {
        id: "log-voice",
        label: "Voice Log",
        keywords: "speak dictate mic audio",
        category: "Log",
        Icon: Mic,
        onSelect: () => {
          onAction("speak");
          close();
        },
      },
      {
        id: "date-prev",
        label: "Previous Day",
        keywords: "back yesterday past history",
        category: "Date",
        Icon: ArrowLeft,
        onSelect: prevDay,
      },
      {
        id: "date-next",
        label: "Next Day",
        keywords: "forward tomorrow future",
        category: "Date",
        Icon: ArrowRight,
        onSelect: nextDay,
      },
      {
        id: "date-today",
        label: "Go to Today",
        keywords: "now current return home",
        category: "Date",
        Icon: CalendarCheck,
        onSelect: goToToday,
      },
      {
        id: "view-dark",
        label: "Toggle Dark Mode",
        keywords: "theme light dark mode d",
        category: "View",
        Icon: Moon,
        shortcut: "D",
        onSelect: () => {
          onToggleDark();
          close();
        },
      },
      {
        id: "view-shortcuts",
        label: "Keyboard Shortcuts",
        keywords: "help keys shortcuts",
        category: "View",
        Icon: Sun,
        shortcut: "?",
        onSelect: () => {
          onToggleHelp();
          close();
        },
      },
      {
        id: "date-calendar",
        label: "Pick a Date",
        keywords: "calendar go to date past",
        category: "Date",
        Icon: Calendar,
        onSelect: () => close(),
      },
    ],
    [close, onNavigate, onAction, onToggleDark, onToggleHelp, prevDay, nextDay, goToToday],
  );

  const foodResults = useMemo<PaletteFood[]>(() => {
    if (!query || query.length < 2) return [];
    const matches = fuzzyMatchFoodName(query, allFoodItems ?? EMPTY_FOOD, 5);
    return matches.map((item) => ({
      id: `food-${item.id ?? item.name}`,
      label: item.name,
      sub: `${item.calories} kcal · ${item.mealType}`,
      item,
      onSelect: () => {
        if (!userId) return;
        void addFoodLog({ ...item, id: undefined } as Omit<FoodItem, "id">);
        close();
      },
    }));
  }, [query, allFoodItems, addFoodLog, userId, close]);

  const filteredCommands = useMemo<PaletteCommand[]>(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [query, commands]);

  const entries = useMemo<PaletteEntry[]>(() => {
    return [...foodResults, ...filteredCommands];
  }, [foodResults, filteredCommands]);

  const grouped = useMemo(() => {
    if (query && foodResults.length > 0) {
      const groups: Record<string, PaletteEntry[]> = { "Quick Log": foodResults };
      filteredCommands.forEach((c) => {
        groups[c.category] ??= [];
        groups[c.category]!.push(c);
      });
      return groups;
    }
    const groups: Record<string, PaletteEntry[]> = {};
    filteredCommands.forEach((c) => {
      groups[c.category] ??= [];
      groups[c.category]!.push(c);
    });
    return groups;
  }, [query, foodResults, filteredCommands]);

  const safeActiveIndex = Math.min(activeIndex, entries.length - 1);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, entries.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter": {
          e.preventDefault();
          const active = entries[safeActiveIndex];
          if (active) active.onSelect();
          break;
        }
      }
    },
    [entries, safeActiveIndex],
  );

  const paletteVariants = {
    hidden: { y: reducedMotion ? 0 : -16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: reducedMotion ? 0.15 : 0.2, ease: motionTokens.easeOutExpo },
    },
    exit: {
      y: reducedMotion ? 0 : -8,
      opacity: 0,
      transition: { duration: 0.15, ease: motionTokens.easeInOut },
    },
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      className="m-0 w-full max-w-none border-0 bg-transparent p-0 open:fixed open:inset-0 open:h-full open:overflow-hidden [&::backdrop]:hidden"
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {commandPaletteOpen && (
          <>
            <motion.div
              key="cp-backdrop"
              className="fixed inset-0 bg-ink/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={close}
              aria-hidden="true"
            />
            <div className="pointer-events-none fixed inset-0 flex items-start justify-center pt-[10vh]">
              <motion.div
                key="cp-panel"
                className="pointer-events-auto w-full max-w-xl rounded-none border border-rule bg-paper shadow-2xl"
                variants={paletteVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="combobox"
                aria-expanded="true"
                aria-haspopup="listbox"
                aria-controls={listId}
                aria-activedescendant={
                  entries[safeActiveIndex] ? `cp-item-${entries[safeActiveIndex]!.id}` : undefined
                }
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
                  <Search className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    role="searchbox"
                    aria-label="Search commands"
                    placeholder="Search commands, foods, navigate..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={onKeyDown}
                    className="flex-1 bg-transparent font-sans text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveIndex(0);
                        inputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <kbd className="shrink-0 rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div
                  id={listId}
                  role="listbox"
                  aria-label="Commands"
                  className="max-h-[60vh] overflow-y-auto py-1"
                >
                  {entries.length === 0 ? (
                    <p className="px-4 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                      No results
                    </p>
                  ) : (
                    Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-4 pb-1 pt-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft/60">
                            {category}
                          </span>
                        </div>
                        {items.map((entry) => {
                          const globalIdx = entries.indexOf(entry);
                          const isActive = globalIdx === safeActiveIndex;
                          return (
                            <div
                              key={entry.id}
                              id={`cp-item-${entry.id}`}
                              role="option"
                              aria-selected={isActive}
                              onClick={entry.onSelect}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                                isActive ? "bg-persimmon/10" : "hover:bg-paper-muted",
                              )}
                            >
                              {isFood(entry) ? (
                                <>
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-persimmon/10">
                                    <Pencil
                                      className="size-3.5 text-persimmon"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-sans text-sm font-medium text-ink">
                                      {entry.label}
                                    </p>
                                    <p className="font-mono text-[10px] text-ink-soft">
                                      {entry.sub}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <entry.Icon
                                    className="size-4 shrink-0 text-ink-soft"
                                    aria-hidden="true"
                                  />
                                  <span className="flex-1 font-sans text-sm text-ink">
                                    {entry.label}
                                  </span>
                                  {entry.shortcut && (
                                    <kbd className="shrink-0 rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                                      {entry.shortcut}
                                    </kbd>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 border-t border-rule px-4 py-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/50">
                    <kbd className="mr-1 rounded border border-rule/50 px-1 py-px font-mono text-[9px]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/50">
                    <kbd className="mr-1 rounded border border-rule/50 px-1 py-px font-mono text-[9px]">
                      ↵
                    </kbd>
                    select
                  </span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}

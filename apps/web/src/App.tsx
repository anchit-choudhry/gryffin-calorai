// src/App.tsx
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  LayoutDashboard,
  Mic,
  Moon,
  Pencil,
  Plus,
  QrCode,
  Settings as SettingsIcon,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAppState } from "./state/AppState";
import { initializeDB } from "./db/dbService";
import { UserId } from "./types";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  DashboardSkeleton,
  ProgressSkeleton,
  RecipesSkeleton,
  SettingsSkeleton,
} from "./components/ui/skeleton";
import KeyboardShortcutsOverlay from "./components/KeyboardShortcutsOverlay";
import ProductTourOverlay from "./components/tour/ProductTourOverlay";
import { HarvestStamp } from "./components/HarvestStamp";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { normalizeHash, type ValidHash } from "./lib/utils";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useReminders } from "./hooks/useReminders";
import { useSyncService } from "./hooks/useSyncService";
import { SyncStatusChip } from "./components/SyncStatusChip";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Progress = lazy(() => import("./pages/Progress"));
const Settings = lazy(() => import("./pages/Settings"));

const MOCK_USER_ID = UserId("1");
const BOTTOM_NAV_HASHES = ["#dashboard", "#recipes", "#progress"] as const;
type BottomNavHash = (typeof BOTTOM_NAV_HASHES)[number];

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (!stored) return window.matchMedia("(prefers-color-scheme: dark)").matches;
    try {
      const parsed = JSON.parse(stored);
      return typeof parsed === "boolean"
        ? parsed
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  });
  const [currentPath, setCurrentPath] = useState<ValidHash>(normalizeHash(window.location.hash));
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useLayoutEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const setupApp = async () => {
      await initializeDB();
      await useAppState.getState().fetchInitialData(MOCK_USER_ID);
      const state = useAppState.getState();
      if (state.init.status === "ready" && !state.init.user.hasCompletedOnboarding) {
        state.startTour();
      }
    };
    setupApp();

    const handleHashChange = () => {
      setCurrentPath(normalizeHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev: boolean) => {
      const isDark = !prev;
      localStorage.setItem("darkMode", JSON.stringify(isDark));
      return isDark;
    });
  }, []);

  const page = useMemo(() => {
    switch (currentPath) {
      case "#recipes":
        return (
          <Suspense fallback={<RecipesSkeleton />}>
            <Recipes />
          </Suspense>
        );
      case "#progress":
        return (
          <Suspense fallback={<ProgressSkeleton />}>
            <Progress />
          </Suspense>
        );
      case "#settings":
        return (
          <Suspense fallback={<SettingsSkeleton />}>
            <Settings />
          </Suspense>
        );
      case "#dashboard":
      default:
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        );
    }
  }, [currentPath]);

  const kbHandlers = useMemo(
    () => ({
      onFocusLogger: () => {
        const input = document.querySelector<HTMLInputElement>('#main input[name="name"]');
        input?.focus();
      },
      onAddWater: () => {
        const input = document.querySelector<HTMLInputElement>('#main input[name="amount"]');
        input?.focus();
      },
      onAddStep: () => {
        const input = document.querySelector<HTMLInputElement>('#main input[name="steps"]');
        input?.focus();
      },
      onOpenBarcode: () => {
        const btn = document.querySelector<HTMLButtonElement>('#main [aria-label*="arcode"]');
        btn?.click();
      },
      onFocusRecipeSearch: () => {
        window.location.hash = "#recipes";
        setCurrentPath(normalizeHash("#recipes"));
      },
      onToggleHelp: () => setShowShortcuts((v) => !v),
      onToggleDark: toggleDarkMode,
      onNavigate: (page: "dashboard" | "recipes" | "progress") => {
        window.location.hash = `#${page}`;
        setCurrentPath(normalizeHash(`#${page}`));
      },
    }),
    [toggleDarkMode],
  );

  useKeyboardShortcuts(kbHandlers);
  useReminders();
  useSyncService();

  const tablistRef = useRef<HTMLDivElement>(null);
  const onTablistKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const idx = BOTTOM_NAV_HASHES.indexOf(currentPath as BottomNavHash);
      const next =
        e.key === "ArrowRight"
          ? (idx + 1) % BOTTOM_NAV_HASHES.length
          : (idx - 1 + BOTTOM_NAV_HASHES.length) % BOTTOM_NAV_HASHES.length;
      const hash = BOTTOM_NAV_HASHES[next];
      if (!hash) return;
      tablistRef.current?.querySelectorAll<HTMLAnchorElement>("[role=tab]")[next]?.focus();
      window.location.hash = hash;
      setCurrentPath(hash);
    },
    [currentPath],
  );

  const navLink = (hash: string, label: string) => {
    const isActive = currentPath === hash;
    return (
      <a
        href={hash}
        className={`font-sans text-sm transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 ${
          isActive ? "text-ink font-semibold" : "text-ink-soft hover:text-ink"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper transition-colors duration-300">
        {/* Skip link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-persimmon focus:text-paper focus:text-sm focus:font-semibold focus:rounded"
        >
          Skip to main content
        </a>

        <nav className="bg-paper border-b border-rule sticky top-0 z-50">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14">
            <div className="flex justify-between h-14 items-center">
              <button
                className="flex items-center gap-3 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                onClick={() => (window.location.hash = "#dashboard")}
              >
                <div className="w-7 h-7 bg-persimmon flex items-center justify-center shrink-0">
                  <span className="font-display text-paper text-sm font-semibold leading-none">
                    G
                  </span>
                </div>
                <span className="font-display text-lg text-ink tracking-tight leading-none">
                  Gryffin Calorai
                </span>
              </button>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-6">
                  {navLink("#dashboard", "Dashboard")}
                  {navLink("#recipes", "Recipes")}
                  {navLink("#progress", "Progress")}
                  {navLink("#settings", "Settings")}
                </div>
                <SyncStatusChip />
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center size-11 border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main id="main" className="pb-[calc(4rem+var(--safe-bottom))] md:pb-0">
          <ErrorBoundary>{page}</ErrorBoundary>
        </main>

        {/* Mobile bottom navigation */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-rule"
          style={{ paddingBottom: "var(--safe-bottom)" }}
          aria-label="Main navigation"
        >
          <div className="relative">
            <div
              ref={tablistRef}
              className="flex items-center h-16"
              role="tablist"
              onKeyDown={onTablistKeyDown}
            >
              {(
                [
                  { hash: "#dashboard", label: "Dashboard", Icon: LayoutDashboard },
                  { hash: "#recipes", label: "Recipes", Icon: BookOpen },
                  { hash: "#progress", label: "Progress", Icon: TrendingUp },
                  { hash: "#settings", label: "Settings", Icon: SettingsIcon },
                ] as const
              ).map(({ hash, label, Icon }, idx) => {
                const isActive = currentPath === hash;
                return (
                  <>
                    {/* Coarse-pointer: insert center spacer for FAB between 2nd and 3rd item */}
                    {idx === 2 && (
                      <div
                        key="fab-spacer"
                        className="hidden [@media(pointer:coarse)]:block w-16 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <a
                      key={hash}
                      href={hash}
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset ${
                        isActive ? "text-persimmon" : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-persimmon" />
                      )}
                      <Icon className="size-5" />
                      <span className="text-[10px] font-sans">{label}</span>
                    </a>
                  </>
                );
              })}
            </div>

            {/* Quick-add FAB — coarse-pointer devices only (touch screens) */}
            <button
              onClick={() => setShowQuickAdd(true)}
              aria-label="Quick add"
              className="hidden [@media(pointer:coarse)]:flex items-center justify-center absolute left-1/2 -translate-x-1/2 -top-5 size-12 bg-persimmon text-paper border-2 border-paper rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </nav>
      </div>
      <KeyboardShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ProductTourOverlay />
      <HarvestStamp />
      <Toaster richColors />
      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAction={(action) => {
          setShowQuickAdd(false);
          window.location.hash = "#dashboard";
          setCurrentPath(normalizeHash("#dashboard"));
          requestAnimationFrame(() => {
            if (action === "write") {
              document.querySelector<HTMLInputElement>('#main input[name="name"]')?.focus();
            } else if (action === "scan") {
              document.querySelector<HTMLButtonElement>('#main [aria-label*="arcode"]')?.click();
            } else if (action === "speak") {
              document.querySelector<HTMLButtonElement>('#main [aria-label*="oice"]')?.click();
            }
          });
        }}
      />
    </TooltipProvider>
  );
}

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: "write" | "scan" | "speak") => void;
}

function QuickAddSheet({ open, onClose, onAction }: QuickAddSheetProps) {
  const reducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: reducedMotion ? 0 : "100%", opacity: reducedMotion ? 0 : 1 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.15 : 0.3,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    exit: {
      y: reducedMotion ? 0 : "100%",
      opacity: reducedMotion ? 0 : 1,
      transition: { duration: 0.2, ease: [0.65, 0, 0.35, 1] as [number, number, number, number] },
    },
  };

  const actions = [
    { id: "write" as const, label: "Log Food", sub: "Type a food name", Icon: Pencil },
    { id: "scan" as const, label: "Scan Barcode", sub: "Use your camera", Icon: QrCode },
    { id: "speak" as const, label: "Voice Log", sub: "Speak your meal", Icon: Mic },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="qa-backdrop"
            className="fixed inset-0 z-[60] bg-ink/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="qa-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Quick add"
            className="fixed bottom-0 left-0 right-0 z-[61] bg-paper border-t border-rule"
            style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom, 0px))" }}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-rule">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Quick Add
              </span>
              <button
                onClick={onClose}
                aria-label="Close quick add"
                className="flex items-center justify-center size-9 text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-px bg-rule mt-px">
              {actions.map(({ id, label, sub, Icon }) => (
                <button
                  key={id}
                  onClick={() => onAction(id)}
                  className="flex flex-col items-center gap-2 py-6 bg-paper text-center hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <Icon className="size-6 text-persimmon" />
                  <span className="font-sans text-sm font-semibold text-ink">{label}</span>
                  <span className="font-mono text-[10px] text-ink-soft">{sub}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default App;

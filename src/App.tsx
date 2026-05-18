// src/App.tsx
import { lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BookOpen, LayoutDashboard, Moon, Sun, TrendingUp } from "lucide-react";
import { useAppState } from "./state/AppState";
import { initializeDB } from "./db/dbService";
import { UserId } from "./types";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardSkeleton } from "./components/ui/skeleton";
import KeyboardShortcutsOverlay from "./components/KeyboardShortcutsOverlay";
import ProductTourOverlay from "./components/tour/ProductTourOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { normalizeHash, type ValidHash } from "./lib/utils";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Progress = lazy(() => import("./pages/Progress"));

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

  useLayoutEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useLayoutEffect(() => {
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

  const toggleDarkMode = useMemo(
    () => () => {
      setDarkMode((prev: boolean) => {
        const isDark = !prev;
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", JSON.stringify(isDark));
        return isDark;
      });
    },
    [],
  );

  const renderPage = () => {
    switch (currentPath) {
      case "#recipes":
        return <Recipes />;
      case "#progress":
        return <Progress />;
      case "#dashboard":
      default:
        return <Dashboard />;
    }
  };

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
                </div>
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
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>{renderPage()}</Suspense>
          </ErrorBoundary>
        </main>

        {/* Mobile bottom navigation */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-rule"
          style={{ paddingBottom: "var(--safe-bottom)" }}
          aria-label="Main navigation"
        >
          <div
            ref={tablistRef}
            className="flex justify-around items-center h-16"
            role="tablist"
            onKeyDown={onTablistKeyDown}
          >
            {(
              [
                { hash: "#dashboard", label: "Dashboard", Icon: LayoutDashboard },
                { hash: "#recipes", label: "Recipes", Icon: BookOpen },
                { hash: "#progress", label: "Progress", Icon: TrendingUp },
              ] as const
            ).map(({ hash, label, Icon }) => {
              const isActive = currentPath === hash;
              return (
                <a
                  key={hash}
                  href={hash}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={`relative flex flex-col items-center justify-center gap-1 px-4 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-inset ${
                    isActive ? "text-persimmon" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-persimmon" />
                  )}
                  <Icon className="size-5" />
                  <span className="text-[10px] font-sans">{label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
      <KeyboardShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ProductTourOverlay />
      <Toaster richColors />
    </TooltipProvider>
  );
}

export default App;

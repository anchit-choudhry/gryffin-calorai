// src/App.tsx
import {
  Fragment,
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
  Keyboard,
  LayoutDashboard,
  Settings as SettingsIcon,
  TrendingUp,
} from "lucide-react";
import { MoonPhase, SeasonalOrnament, SunRay } from "./components/icons/almanac";
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
import PageLoading from "./components/PageLoading";
import KeyboardShortcutsOverlay from "./components/KeyboardShortcutsOverlay";
import ProductTourOverlay from "./components/tour/ProductTourOverlay";
import { HarvestStamp } from "./components/HarvestStamp";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast, Toaster } from "sonner";
import { normalizeHash, type ValidHash } from "./lib/utils";
import { decodeSharePayload, importSharedRecipe } from "./lib/recipeShare";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useReminders } from "./hooks/useReminders";
import { useSyncService } from "./hooks/useSyncService";
import { SyncStatusChip } from "./components/SyncStatusChip";
import { QuickAddModal } from "./components/QuickAddModal";
import { QuickAddFab } from "./components/QuickAddFab";
import { CommandPalette } from "./components/CommandPalette";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Progress = lazy(() => import("./pages/Progress"));
const Settings = lazy(() => import("./pages/Settings"));
const PrintPage = lazy(() => import("./pages/PrintPage").then((m) => ({ default: m.PrintPage })));

const MOCK_USER_ID = UserId("1");
const BOTTOM_NAV_HASHES = ["#dashboard", "#recipes", "#progress"] as const;

interface NavLinkProps {
  hash: string;
  label: string;
  isActive: boolean;
}

function NavLink({ hash, label, isActive }: NavLinkProps) {
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
}
type BottomNavHash = (typeof BOTTOM_NAV_HASHES)[number];

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("darkMode");
    if (!stored) return systemDark;
    try {
      const parsed = JSON.parse(stored);
      return typeof parsed === "boolean" ? parsed : systemDark;
    } catch {
      return systemDark;
    }
  });
  const [currentPath, setCurrentPath] = useState<ValidHash>(normalizeHash(window.location.hash));
  const [showShortcuts, setShowShortcuts] = useState(false);
  const openQuickAdd = useAppState((s) => s.openQuickAdd);
  const closeQuickAdd = useAppState((s) => s.closeQuickAdd);
  const openCommandPalette = useAppState((s) => s.openCommandPalette);
  const density = useAppState((s) => s.density);
  const accentTheme = useAppState((s) => s.accentTheme);
  const edition = useAppState((s) => s.edition);
  const broadsheet = useAppState((s) => s.broadsheet);

  useLayoutEffect(() => {
    if (darkMode || edition === "lamplight") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, edition]);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("compact", "spacious");
    if (density === "compact") {
      document.documentElement.classList.add("compact");
    } else if (density === "spacious") {
      document.documentElement.classList.add("spacious");
    }
  }, [density]);

  useLayoutEffect(() => {
    document.documentElement.classList.remove(
      "accent-sage",
      "accent-indigo",
      "accent-amber",
      "accent-rose",
    );
    if (accentTheme !== "persimmon") {
      document.documentElement.classList.add(`accent-${accentTheme}`);
    }
  }, [accentTheme]);

  useLayoutEffect(() => {
    document.documentElement.classList.remove(
      "edition-sepia",
      "edition-lamplight",
      "edition-large-print",
    );
    if (edition !== "standard") {
      document.documentElement.classList.add(`edition-${edition}`);
    }
  }, [edition]);

  useLayoutEffect(() => {
    if (broadsheet) {
      document.documentElement.classList.add("broadsheet");
    } else {
      document.documentElement.classList.remove("broadsheet");
    }
  }, [broadsheet]);

  useEffect(() => {
    const setupApp = async () => {
      await initializeDB();
      await useAppState.getState().fetchInitialData(MOCK_USER_ID);
      const state = useAppState.getState();
      if (state.init.status === "ready" && !state.init.user.hasCompletedOnboarding) {
        state.startTour();
      }

      const rawHash = window.location.hash;
      const qMark = rawHash.indexOf("?");
      if (qMark !== -1) {
        const basePart = rawHash.slice(0, qMark);
        const queryStr = rawHash.slice(qMark + 1);
        const params = new URLSearchParams(queryStr);
        if (basePart === "#recipes" || basePart === "#/recipes") {
          const shareEncoded = params.get("share");
          if (shareEncoded) {
            const state = useAppState.getState();
            if (state.userId) {
              const payload = decodeSharePayload(shareEncoded);
              if (payload) {
                try {
                  await importSharedRecipe(payload, state.userId);
                  await state.fetchRecipes(state.userId);
                  toast.success(`Recipe "${payload.name}" imported`);
                } catch {
                  toast.error("Failed to import shared recipe");
                }
              } else {
                toast.error("Invalid or expired recipe link");
              }
            }
            window.location.hash = "#recipes";
          }
        } else if (basePart === "#log" || basePart === "#/log") {
          const water = params.get("water");
          const steps = params.get("steps");
          const sharedTitle = params.get("title") ?? params.get("text");
          if (water !== null) {
            const ml = parseInt(water, 10);
            if (!isNaN(ml) && ml > 0) {
              await useAppState.getState().addWaterLog(ml);
              toast.success(`Logged ${ml} ml water`);
            }
          } else if (steps !== null) {
            const count = parseInt(steps, 10);
            if (!isNaN(count) && count > 0) {
              await useAppState.getState().addStepLog(count);
              toast.success(`Logged ${count.toLocaleString()} steps`);
            }
          } else if (sharedTitle) {
            toast(`Shared: "${sharedTitle}" - add it via the food log`, {
              duration: 6000,
            });
          }
          window.location.hash = "#dashboard";
        }
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

  const navigate = useCallback((hash: ValidHash) => {
    window.location.hash = hash;
    setCurrentPath(hash);
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
      case "#print":
        return (
          <Suspense fallback={<PageLoading message="Preparing print preview..." />}>
            <PrintPage />
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
      onFocusRecipeSearch: () => navigate(normalizeHash("#recipes")),
      onToggleHelp: () => setShowShortcuts((v) => !v),
      onToggleDark: toggleDarkMode,
      onNavigate: (page: "dashboard" | "recipes" | "progress") =>
        navigate(normalizeHash(`#${page}`)),
      onOpenQuickAdd: openQuickAdd,
      onOpenCommandPalette: openCommandPalette,
    }),
    [toggleDarkMode, openQuickAdd, openCommandPalette, navigate],
  );

  useKeyboardShortcuts(kbHandlers);
  useReminders();
  useSyncService();

  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);
  const handleAction = useCallback(
    (_action: "write" | "scan" | "speak") => {
      closeQuickAdd();
      navigate(normalizeHash("#dashboard"));
    },
    [closeQuickAdd, navigate],
  );

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
      navigate(hash);
    },
    [currentPath, navigate],
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper transition-colors duration-300">
        {/* Paper-grain texture overlay — fixed, pointer-events:none, behind all content */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* Skip link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-persimmon focus:text-paper focus:text-sm focus:font-semibold focus:rounded"
        >
          Skip to main content
        </a>

        <nav className="bg-paper border-b border-rule sticky top-0 z-50">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14">
            {/* Running head - serif folio above nav links */}
            <div className="hidden md:flex items-center justify-between border-b border-rule/40 py-1 gap-4">
              <div className="flex items-center gap-1.5 shrink-0">
                <SeasonalOrnament
                  date={new Date()}
                  className="h-3 w-auto text-ink-soft/50 opacity-50"
                />
                <span className="font-serif text-[11px] italic text-ink-soft/60 tracking-tight">
                  Field Journal
                </span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink-soft/35 truncate">
                {(
                  {
                    "#dashboard": "Daily Record",
                    "#recipes": "Recipe Compendium",
                    "#progress": "Progress Charts",
                    "#settings": "Preferences",
                  } as Record<string, string>
                )[currentPath] ?? "Field Journal"}{" "}
                &middot;{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="shrink-0 flex items-center justify-center size-5 text-ink-soft/50 hover:text-ink-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <SunRay className="size-3.5" /> : <MoonPhase className="size-3.5" />}
              </button>
            </div>
            <div className="flex justify-between h-12 items-center">
              <button
                type="button"
                className="flex items-center gap-3 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                onClick={() => (window.location.hash = "#dashboard")}
              >
                <div className="w-6 h-6 bg-persimmon flex items-center justify-center shrink-0">
                  <span className="font-display text-paper text-xs font-semibold leading-none">
                    G
                  </span>
                </div>
                <span className="font-display text-base text-ink tracking-tight leading-none">
                  Gryffin Calorai
                </span>
              </button>
              <div className="flex items-center gap-5">
                <div className="hidden md:flex items-center gap-5">
                  <NavLink
                    hash="#dashboard"
                    label="Dashboard"
                    isActive={currentPath === "#dashboard"}
                  />
                  <NavLink hash="#recipes" label="Recipes" isActive={currentPath === "#recipes"} />
                  <NavLink
                    hash="#progress"
                    label="Progress"
                    isActive={currentPath === "#progress"}
                  />
                  <NavLink
                    hash="#settings"
                    label="Settings"
                    isActive={currentPath === "#settings"}
                  />
                </div>
                <SyncStatusChip />
                <button
                  type="button"
                  onClick={() => setShowShortcuts((v) => !v)}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                  aria-label="Show keyboard shortcuts"
                  aria-haspopup="dialog"
                >
                  <Keyboard className="size-3.5" aria-hidden="true" />
                  <kbd className="font-mono text-[10px]">?</kbd>
                </button>
                {/* Dark mode toggle is in the running head on md+ */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="md:hidden flex items-center justify-center size-9 border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <SunRay className="size-4" /> : <MoonPhase className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main id="main" className="pb-[calc(4rem+var(--safe-bottom))] md:pb-0">
          <ErrorBoundary>{page}</ErrorBoundary>
          <footer
            aria-hidden="true"
            className="hidden md:flex items-center justify-center py-5 border-t border-rule/20"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink-soft/30">
              Gryffin Calorai · Field Journal · 2026
            </p>
          </footer>
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
                  <Fragment key={hash}>
                    {/* Center spacer keeps FAB clear of nav tabs on all pointer types */}
                    {idx === 2 && <div className="w-16 shrink-0" aria-hidden="true" />}
                    <a
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
                  </Fragment>
                );
              })}
            </div>

            <QuickAddFab />
          </div>
        </nav>
      </div>
      <KeyboardShortcutsOverlay open={showShortcuts} onClose={closeShortcuts} />
      <ProductTourOverlay />
      <HarvestStamp />
      <Toaster />
      <QuickAddModal onAction={handleAction} />
      <CommandPalette
        onNavigate={(hash) => navigate(normalizeHash(hash))}
        onAction={(action) => {
          openQuickAdd();
          handleAction(action);
        }}
        onToggleDark={toggleDarkMode}
        onToggleHelp={() => setShowShortcuts((v) => !v)}
      />
    </TooltipProvider>
  );
}

export default App;

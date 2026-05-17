// src/App.tsx
import { lazy, Suspense, useLayoutEffect, useState } from "react";
import { BookOpen, LayoutDashboard, Moon, Sun, TrendingUp } from "lucide-react";
import { useAppState } from "./state/AppState";
import { initializeDB } from "./db/dbService";
import { UserId } from "./types";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageLoading from "./components/PageLoading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { normalizeHash, type ValidHash } from "./lib/utils";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Progress = lazy(() => import("./pages/Progress"));

const MOCK_USER_ID = UserId("1");

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
    };
    setupApp();

    const handleHashChange = () => {
      setCurrentPath(normalizeHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleDarkMode = () => {
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
  };

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

  const navLink = (hash: string, label: string) => {
    const isActive = currentPath === hash;
    return (
      <a
        href={hash}
        className={`font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
          isActive ? "text-persimmon" : "text-ink-soft hover:text-ink"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper transition-colors duration-300">
        <nav className="bg-paper border-b border-rule sticky top-0 z-50">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14">
            <div className="flex justify-between h-14 items-center">
              <button
                className="flex items-center gap-3 cursor-pointer"
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
              <div className="flex items-center gap-7">
                <div className="hidden md:flex items-center gap-7">
                  {navLink("#dashboard", "Dashboard")}
                  {navLink("#recipes", "Recipes")}
                  {navLink("#progress", "Progress")}
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="border border-rule p-1.5 text-ink-soft hover:text-ink hover:border-ink transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="pb-16 md:pb-0">
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>{renderPage()}</Suspense>
          </ErrorBoundary>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-rule">
          <div className="flex justify-around items-center h-16">
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
                  className={`relative flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                    isActive ? "text-persimmon" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-persimmon" />
                  )}
                  <Icon className="size-5" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em]">{label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
      <Toaster richColors />
    </TooltipProvider>
  );
}

export default App;

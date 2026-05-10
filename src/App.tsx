// src/App.tsx
import { lazy, Suspense, useLayoutEffect, useState } from "react";
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
                {navLink("#dashboard", "Dashboard")}
                {navLink("#recipes", "Recipes")}
                {navLink("#progress", "Progress")}
                <button
                  onClick={toggleDarkMode}
                  className="border border-rule px-2.5 py-1 font-mono text-[11px] text-ink-soft hover:text-ink hover:border-ink transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>{renderPage()}</Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Toaster richColors />
    </TooltipProvider>
  );
}

export default App;

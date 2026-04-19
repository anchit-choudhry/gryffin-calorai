// src/App.tsx
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import Progress from "./pages/Progress";
import { useAppState } from "./state/AppState";
import { initializeDB } from "./db/dbService";

/**
 * @component App
 * @description Root application component.
 * Manages global hash-based routing, dark/light theme state, and
 * initialization of core services (database, global state).
 */
function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.hash || "#dashboard");
  const MOCK_USER_ID = "1";

  useEffect(() => {
    /**
     * @function setupApp
     * @description Initializes the Dexie database and fetches initial data into the Zustand store.
     */
    const setupApp = async () => {
      await initializeDB();
      await useAppState.getState().fetchInitialData(MOCK_USER_ID);
    };
    setupApp();

    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#dashboard");
    };

    // Initialize dark mode based on system preference or saved state
    const stored = localStorage.getItem("darkMode");
    const isDark = stored
      ? JSON.parse(stored)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Update DOM classes directly based on determined theme
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update React state AFTER DOM manipulation to avoid synchronous state update warning
    setDarkMode(isDark);

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  /**
   * @function toggleDarkMode
   * @description Toggles between light and dark themes. Updates the 'dark' class on the document root
   * and persists preference in localStorage.
   */
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
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

  /**
   * @function renderPage
   * @description Switcher for current view based on URL hash.
   */
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => (window.location.hash = "#dashboard")}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Gryffin Calorai
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="#dashboard"
                className={`text-sm font-medium transition-colors ${currentPath === "#dashboard" || currentPath === "" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
              >
                Dashboard
              </a>
              <a
                href="#recipes"
                className={`text-sm font-medium transition-colors ${currentPath === "#recipes" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
              >
                Recipes
              </a>
              <a
                href="#progress"
                className={`text-sm font-medium transition-colors ${currentPath === "#progress" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
              >
                Progress
              </a>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">{renderPage()}</main>
    </div>
  );
}

export default App;

import type { ReactNode } from "react";
import { lazy, Suspense, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { pageVariants, useSectionMotion } from "../lib/motionVariants";
import SectionHeader from "../components/dashboard/SectionHeader";
import GoalSettings from "../components/settings/GoalSettings";
import { CustomMacroGoalsPanel } from "../components/settings/CustomMacroGoalsPanel";
import DataExportPanel from "../components/DataExportPanel";
import { CsvImportPanel } from "../components/settings/CsvImportPanel";
import { AppleHealthImportPanel } from "../components/settings/AppleHealthImportPanel";
import { PrivacyPanel } from "../components/settings/PrivacyPanel";
import DietProfileEditor from "../components/DietProfileEditor";
import RemindersSettings from "../components/RemindersSettings";
import { CloudSyncPanel } from "../components/CloudSyncPanel";
import { AiLoggingPanel } from "../components/settings/AiLoggingPanel";
import { useAppState } from "../state/AppState";
import type { AccentTheme, Density, Edition } from "../state/slices/uiSlice";
import { cn } from "../lib/utils";

const TdeeProfilePanel = lazy(() => import("../components/settings/TdeeProfilePanel"));

const APP_VERSION = "0.21.0";

const DENSITY_OPTIONS: { value: Density; label: string; description: string }[] = [
  { value: "comfortable", label: "Comfortable", description: "Standard spacing" },
  { value: "compact", label: "Compact", description: "Tighter layout" },
  { value: "spacious", label: "Spacious", description: "More breathing room" },
];

interface AccentOption {
  value: AccentTheme;
  label: string;
  hue: number;
}

const EDITION_OPTIONS: { value: Edition; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "Default field journal" },
  { value: "sepia", label: "Sepia", description: "Aged parchment tones" },
  { value: "lamplight", label: "Lamplight", description: "Warm dark reading mode" },
  { value: "large-print", label: "Large Print", description: "Scaled type for readability" },
];

const ACCENT_OPTIONS: AccentOption[] = [
  { value: "persimmon", label: "Persimmon", hue: 38 },
  { value: "sage", label: "Sage", hue: 145 },
  { value: "indigo", label: "Indigo", hue: 270 },
  { value: "amber", label: "Amber", hue: 75 },
  { value: "rose", label: "Rose", hue: 5 },
];

interface SettingsSection {
  id: string;
  group: string;
  title: string;
  keywords: string[];
  colSpan: string;
  content: ReactNode;
}

function useSettingsSections(): SettingsSection[] {
  const density = useAppState((s) => s.density);
  const setDensity = useAppState((s) => s.setDensity);
  const hapticsEnabled = useAppState((s) => s.hapticsEnabled);
  const setHapticsEnabled = useAppState((s) => s.setHapticsEnabled);
  const accentTheme = useAppState((s) => s.accentTheme);
  const setAccentTheme = useAppState((s) => s.setAccentTheme);
  const edition = useAppState((s) => s.edition);
  const setEdition = useAppState((s) => s.setEdition);
  const broadsheet = useAppState((s) => s.broadsheet);
  const setBroadsheet = useAppState((s) => s.setBroadsheet);

  return [
    {
      id: "profile",
      group: "Identity",
      title: "Profile",
      keywords: ["profile", "tdee", "height", "weight", "age", "sex", "activity"],
      colSpan: "col-span-12 lg:col-span-8",
      content: (
        <Suspense
          fallback={<div className="h-32 animate-pulse bg-paper-muted border border-rule" />}
        >
          <TdeeProfilePanel />
        </Suspense>
      ),
    },
    {
      id: "goals",
      group: "Identity",
      title: "Goals",
      keywords: ["goals", "calorie", "target", "lose", "gain", "maintain"],
      colSpan: "col-span-12 lg:col-span-4",
      content: <GoalSettings />,
    },
    {
      id: "diet",
      group: "Logging",
      title: "Diet",
      keywords: ["diet", "preset", "vegan", "vegetarian", "keto", "restriction"],
      colSpan: "col-span-12 lg:col-span-8",
      content: <DietProfileEditor />,
    },
    {
      id: "macro-goals",
      group: "Logging",
      title: "Macro Goals",
      keywords: ["macros", "protein", "carbs", "fat", "custom", "goal", "target", "override"],
      colSpan: "col-span-12 lg:col-span-4",
      content: <CustomMacroGoalsPanel />,
    },
    {
      id: "ai-logging",
      group: "Logging",
      title: "AI Logging",
      keywords: ["ai", "photo", "recognition", "model", "identify", "vision", "text"],
      colSpan: "col-span-12 lg:col-span-4",
      content: <AiLoggingPanel />,
    },
    {
      id: "reminders",
      group: "Logging",
      title: "Reminders",
      keywords: ["reminders", "notifications", "alerts", "schedule"],
      colSpan: "col-span-12 lg:col-span-8",
      content: <RemindersSettings />,
    },
    {
      id: "display",
      group: "Display",
      title: "Display",
      keywords: [
        "display",
        "density",
        "layout",
        "broadsheet",
        "theme",
        "accent",
        "haptics",
        "vibration",
        "color",
      ],
      colSpan: "col-span-12 lg:col-span-8",
      content: (
        <div className="space-y-8">
          {/* Layout density */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Layout density
            </p>
            <div role="radiogroup" aria-label="Layout density" className="flex gap-2">
              {DENSITY_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={density === value}
                  onClick={() => setDensity(value)}
                  className={cn(
                    "flex-1 border px-3 py-2.5 text-left transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 active:scale-[0.97]",
                    density === value
                      ? "border-persimmon bg-persimmon-soft text-ink"
                      : "border-rule bg-paper-muted text-ink-soft hover:text-ink hover:border-ink",
                  )}
                >
                  <span className="block font-sans text-sm font-medium">{label}</span>
                  <span className="block font-mono text-[10px] text-ink-soft mt-0.5">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent theme */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Accent color
            </p>
            <div role="radiogroup" aria-label="Accent color theme" className="flex gap-2 flex-wrap">
              {ACCENT_OPTIONS.map(({ value, label, hue }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={accentTheme === value}
                  aria-label={label}
                  onClick={() => setAccentTheme(value)}
                  className={cn(
                    "flex items-center gap-2 border px-3 py-2 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 active:scale-[0.97]",
                    accentTheme === value
                      ? "border-persimmon bg-persimmon-soft text-ink"
                      : "border-rule bg-paper-muted text-ink-soft hover:text-ink hover:border-ink",
                  )}
                >
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ background: `oklch(0.62 0.17 ${hue})` }}
                    aria-hidden="true"
                  />
                  <span className="font-sans text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Edition */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Edition
            </p>
            <div role="radiogroup" aria-label="Journal edition" className="grid grid-cols-2 gap-2">
              {EDITION_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={edition === value}
                  onClick={() => setEdition(value)}
                  className={cn(
                    "border px-3 py-2.5 text-left transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 active:scale-[0.97]",
                    edition === value
                      ? "border-persimmon bg-persimmon-soft text-ink"
                      : "border-rule bg-paper-muted text-ink-soft hover:text-ink hover:border-ink",
                  )}
                >
                  <span className="block font-sans text-sm font-medium">{label}</span>
                  <span className="block font-mono text-[10px] text-ink-soft mt-0.5">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard layout */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Dashboard layout
            </p>
            <div role="radiogroup" aria-label="Dashboard layout" className="flex gap-2">
              {(
                [
                  { value: false, label: "Standard", description: "Single-column flow" },
                  { value: true, label: "Broadsheet", description: "Two-column newspaper grid" },
                ] as const
              ).map(({ value, label, description }) => (
                <button
                  key={String(value)}
                  type="button"
                  role="radio"
                  aria-checked={broadsheet === value}
                  aria-label={label}
                  onClick={() => setBroadsheet(value)}
                  className={cn(
                    "flex-1 border px-3 py-2.5 text-left transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 active:scale-[0.97]",
                    broadsheet === value
                      ? "border-persimmon bg-persimmon-soft text-ink"
                      : "border-rule bg-paper-muted text-ink-soft hover:text-ink hover:border-ink",
                  )}
                >
                  <span className="block font-sans text-sm font-medium">{label}</span>
                  <span className="block font-mono text-[10px] text-ink-soft mt-0.5">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Haptic feedback */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm text-ink">Haptic feedback</p>
              <p className="font-mono text-[10px] text-ink-soft mt-0.5">
                Vibration on log and milestone events
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hapticsEnabled}
              aria-label="Haptic feedback"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2",
                hapticsEnabled ? "bg-persimmon" : "bg-paper-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-paper shadow-sm transition-transform duration-200",
                  hapticsEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "cloud-sync",
      group: "Data & Sync",
      title: "Cloud Sync",
      keywords: ["sync", "cloud", "backup", "account", "login"],
      colSpan: "col-span-12 lg:col-span-8",
      content: <CloudSyncPanel />,
    },
    {
      id: "data",
      group: "Data & Sync",
      title: "Data",
      keywords: ["data", "export", "import", "backup", "restore", "download"],
      colSpan: "col-span-12 lg:col-span-8",
      content: <DataExportPanel />,
    },
    {
      id: "csv-import",
      group: "Data & Sync",
      title: "CSV Import",
      keywords: ["import", "csv", "myfitnesspal", "mfp", "cronometer", "loseit", "migrate"],
      colSpan: "col-span-12 lg:col-span-6",
      content: <CsvImportPanel />,
    },
    {
      id: "apple-health-import",
      group: "Data & Sync",
      title: "Apple Health Import",
      keywords: ["import", "apple", "health", "healthkit", "weight", "steps", "zip"],
      colSpan: "col-span-12 lg:col-span-6",
      content: <AppleHealthImportPanel />,
    },
    {
      id: "privacy",
      group: "Data & Sync",
      title: "Privacy",
      keywords: ["privacy", "data", "delete", "clear", "local", "storage", "gdpr", "wipe"],
      colSpan: "col-span-12 lg:col-span-8",
      content: <PrivacyPanel />,
    },
    {
      id: "about",
      group: "About",
      title: "About",
      keywords: ["about", "version", "github", "app"],
      colSpan: "col-span-12 lg:col-span-4",
      content: (
        <div className="space-y-4">
          <p className="font-serif text-2xl font-light text-ink tracking-tight">Gryffin Calorai</p>
          <div className="border border-rule/40 p-4 space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-soft/60 mb-3">
              Field Journal - Colophon
            </p>
            {(
              [
                ["Edition", `v${APP_VERSION}`],
                ["Storage", "Local - IndexedDB"],
                ["Year", "2026"],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-end gap-1">
                <span className="font-mono text-[10px] text-ink-soft shrink-0">{label}</span>
                <span
                  className="flex-1 self-end border-b border-dotted border-rule/40 mb-[2px] min-w-[8px]"
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] text-ink shrink-0">{value}</span>
              </div>
            ))}
          </div>
          <a
            href="https://github.com/anchit-choudhry/gryffin-calorai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-persimmon hover:text-persimmon/80 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      ),
    },
  ];
}

const Settings = () => {
  const shouldReduceMotion = useReducedMotion();
  const sv = useSectionMotion();
  const [searchQuery, setSearchQuery] = useState("");

  const sections = useSettingsSections();

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.keywords.some((k) => k.includes(searchQuery.toLowerCase())),
      )
    : sections;

  const visibleGroups = [...new Set(filteredSections.map((s) => s.group))];

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        variants={shouldReduceMotion ? undefined : pageVariants}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "show"}
      >
        {/* Page header */}
        <motion.header className="col-span-12 border-b border-rule pb-8" {...sv}>
          <h1 className="font-display text-4xl font-light text-ink">Settings</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mt-2">
            Identity - Logging - Display - Data & Sync - About
          </p>
          {/* In-page search */}
          <div className="relative mt-4 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft"
              aria-hidden="true"
            />
            <input
              type="search"
              role="searchbox"
              placeholder="Filter settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 font-mono text-xs bg-paper-muted border border-rule rounded-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-persimmon focus:ring-offset-2"
              aria-label="Filter settings"
            />
          </div>
        </motion.header>

        {visibleGroups.map((group) => (
          <div key={group} className="col-span-12 contents">
            {/* Group label */}
            <motion.div className="col-span-12 flex items-center gap-3 pt-2" {...sv}>
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink-soft/60">
                {group}
              </span>
              <span className="flex-1 h-px bg-rule/40" />
            </motion.div>

            {filteredSections
              .filter((s) => s.group === group)
              .map((section) => (
                <motion.section
                  key={section.id}
                  className={section.colSpan}
                  {...sv}
                  data-settings-section={section.id}
                >
                  <SectionHeader title={section.title} accent={section.id === "profile"} />
                  <div className="mt-6">{section.content}</div>
                </motion.section>
              ))}
          </div>
        ))}
      </motion.main>
    </div>
  );
};

export default Settings;

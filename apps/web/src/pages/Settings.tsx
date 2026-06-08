import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, useSectionMotion } from "../lib/motionVariants";
import SectionHeader from "../components/dashboard/SectionHeader";
import GoalSettings from "../components/settings/GoalSettings";
import DataExportPanel from "../components/DataExportPanel";
import DietProfileEditor from "../components/DietProfileEditor";
import RemindersSettings from "../components/RemindersSettings";
import { CloudSyncPanel } from "../components/CloudSyncPanel";
import { useAppState } from "../state/AppState";
import type { Density } from "../state/slices/uiSlice";
import { cn } from "../lib/utils";

const TdeeProfilePanel = lazy(() => import("../components/settings/TdeeProfilePanel"));

const APP_VERSION = "0.9.0";

const DENSITY_OPTIONS: { value: Density; label: string; description: string }[] = [
  { value: "comfortable", label: "Comfortable", description: "Standard spacing" },
  { value: "compact", label: "Compact", description: "Tighter layout" },
];

const Settings = () => {
  const shouldReduceMotion = useReducedMotion();
  const sv = useSectionMotion();
  const density = useAppState((s) => s.density);
  const setDensity = useAppState((s) => s.setDensity);

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
            Profile · Diet · Goals · Display · Reminders · Data · About
          </p>
        </motion.header>

        {/* Section 1 - Profile (TDEE) */}
        <motion.section className="col-span-12 lg:col-span-8" {...sv}>
          <SectionHeader title="Profile" accent />
          <div className="mt-6">
            <Suspense
              fallback={<div className="h-32 animate-pulse bg-paper-muted border border-rule" />}
            >
              <TdeeProfilePanel />
            </Suspense>
          </div>
        </motion.section>

        {/* Section 2 - Diet */}
        <motion.section className="col-span-12 lg:col-span-8" {...sv}>
          <SectionHeader title="Diet" />
          <div className="mt-6">
            <DietProfileEditor />
          </div>
        </motion.section>

        {/* Section 3 - Goals */}
        <motion.section className="col-span-12 lg:col-span-4" {...sv}>
          <SectionHeader title="Goals" />
          <div className="mt-6">
            <GoalSettings />
          </div>
        </motion.section>

        {/* Section - Display */}
        <motion.section className="col-span-12 lg:col-span-4" {...sv}>
          <SectionHeader title="Display" />
          <div className="mt-6 space-y-3">
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
                    "flex-1 border px-3 py-2.5 text-left transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2",
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
        </motion.section>

        {/* Section - Reminders */}
        <motion.section className="col-span-12 lg:col-span-8" {...sv}>
          <SectionHeader title="Reminders" />
          <div className="mt-6">
            <RemindersSettings />
          </div>
        </motion.section>

        {/* Section - Cloud Sync */}
        <motion.section className="col-span-12 lg:col-span-8" {...sv}>
          <SectionHeader title="Cloud Sync" />
          <div className="mt-6">
            <CloudSyncPanel />
          </div>
        </motion.section>

        {/* Section - Data */}
        <motion.section className="col-span-12 lg:col-span-8" {...sv}>
          <SectionHeader title="Data" />
          <div className="mt-6">
            <DataExportPanel />
          </div>
        </motion.section>

        {/* Section 4 - About */}
        <motion.section className="col-span-12 lg:col-span-4" {...sv}>
          <SectionHeader title="About" />
          <div className="mt-6 space-y-2">
            <p className="font-mono text-[10px] text-ink-soft">
              Version <span className="text-ink">{APP_VERSION}</span>
            </p>
            <p className="font-mono text-[10px] text-ink-soft">
              Offline-first nutrition tracker. No accounts, no cloud, your data stays local.
            </p>
            <a
              href="https://github.com/anchit-choudhry/gryffin-calorai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-persimmon hover:text-persimmon/80 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Settings;

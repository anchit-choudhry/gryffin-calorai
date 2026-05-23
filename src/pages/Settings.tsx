import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, useSectionMotion } from "../lib/motionVariants";
import SectionHeader from "../components/dashboard/SectionHeader";
import GoalSettings from "../components/settings/GoalSettings";
import DataExportPanel from "../components/DataExportPanel";

const TdeeProfilePanel = lazy(() => import("../components/settings/TdeeProfilePanel"));

const APP_VERSION = "0.3.0";

const Settings = () => {
  const shouldReduceMotion = useReducedMotion();
  const sv = useSectionMotion();

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
            Profile · Goals · Data · About
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

        {/* Section 2 - Goals */}
        <motion.section className="col-span-12 lg:col-span-4" {...sv}>
          <SectionHeader title="Goals" />
          <div className="mt-6">
            <GoalSettings />
          </div>
        </motion.section>

        {/* Section 3 - Data */}
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
              href="https://github.com/anchitchoudhry/gryffin-calorai"
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

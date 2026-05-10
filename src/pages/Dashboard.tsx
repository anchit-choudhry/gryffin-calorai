import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import FoodLogger from "../components/FoodLogger";
import PageLoading from "../components/PageLoading";
import VoiceFoodLogger from "../components/VoiceFoodLogger";
import WeeklySummary from "../components/WeeklySummary";
import WaterTracker from "../components/WaterTracker";
import StreakCard from "../components/StreakCard";
import { useAppState } from "../state/AppState";
import { todayISO } from "../types";
import type { FoodItem } from "../db/dbService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardHero from "../components/dashboard/DashboardHero";
import SectionHeader from "../components/dashboard/SectionHeader";
import EditorialFrame from "../components/dashboard/EditorialFrame";
import LogEntry from "../components/dashboard/LogEntry";
import { pageVariants, sectionVariants } from "../lib/motionVariants";

const BarcodeScanner = lazy(() => import("../components/BarcodeScanner"));

const Dashboard = () => {
  const { init, dailyLogs, deleteFoodLog, favoriteFoods, toggleFavorite, addFoodLog, userId } =
    useAppState();
  const [editingLog, setEditingLog] = useState<FoodItem | null>(null);
  const [barcodeFood, setBarcodeFood] = useState<{ name: string } | null>(null);
  const [voiceFood, setVoiceFood] = useState<{ name: string } | null>(null);

  const shouldReduceMotion = useReducedMotion();

  const { totalCalories, totalProtein, totalCarbs, totalFat } = useMemo(
    () => ({
      totalCalories: dailyLogs.reduce((sum, log) => sum + log.calories, 0),
      totalProtein: dailyLogs.reduce((sum, log) => sum + (log.protein ?? 0), 0),
      totalCarbs: dailyLogs.reduce((sum, log) => sum + (log.carbs ?? 0), 0),
      totalFat: dailyLogs.reduce((sum, log) => sum + (log.fat ?? 0), 0),
    }),
    [dailyLogs],
  );

  const closeEditLog = useCallback(() => setEditingLog(null), []);
  const closeBarcodeFood = useCallback(() => setBarcodeFood(null), []);
  const closeVoiceFood = useCallback(() => setVoiceFood(null), []);

  const sv = shouldReduceMotion ? {} : { variants: sectionVariants };
  const hasFavorites = favoriteFoods.length > 0;

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      {/* Edit Log Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && closeEditLog()}>
        <DialogContent className="sm:max-w-xl rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-ink">Edit Meal Entry</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <FoodLogger initialFood={editingLog} onCancel={closeEditLog} onSuccess={closeEditLog} />
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Food Dialog */}
      <Dialog open={!!barcodeFood} onOpenChange={(open) => !open && closeBarcodeFood()}>
        <DialogContent className="sm:max-w-xl rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-ink">
              Barcode: {barcodeFood?.name}
            </DialogTitle>
          </DialogHeader>
          {barcodeFood && (
            <FoodLogger prefillName={barcodeFood.name} onSuccess={closeBarcodeFood} />
          )}
        </DialogContent>
      </Dialog>

      {/* Voice Food Dialog */}
      <Dialog open={!!voiceFood} onOpenChange={(open) => !open && closeVoiceFood()}>
        <DialogContent className="sm:max-w-xl rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-ink">
              Voice Match: {voiceFood?.name}
            </DialogTitle>
          </DialogHeader>
          {voiceFood && (
            <FoodLogger
              prefillName={voiceFood.name}
              onCancel={closeVoiceFood}
              onSuccess={closeVoiceFood}
            />
          )}
        </DialogContent>
      </Dialog>

      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        variants={shouldReduceMotion ? undefined : pageVariants}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "show"}
      >
        {/* Section A — Masthead / Hero */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6" {...sv}>
          <DashboardHero
            totalCalories={totalCalories}
            totals={{ protein: totalProtein, carbs: totalCarbs, fat: totalFat }}
          />
        </motion.section>

        {/* Section B — Week in Review */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="01" title="The Week in Review" />
          <div className="col-span-12 lg:col-span-6 border border-rule p-6">
            <WeeklySummary />
          </div>
          <div className="col-span-6 lg:col-span-3 border border-rule p-5">
            <StreakCard />
          </div>
          <div className="col-span-6 lg:col-span-3 border border-rule p-5">
            <WaterTracker />
          </div>
        </motion.section>

        {/* Section C — From the Pantry */}
        {hasFavorites && (
          <motion.section className="col-span-12" {...sv}>
            <SectionHeader kicker="02" title="From the Pantry" />
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
              {favoriteFoods.map((fav) => (
                <button
                  key={fav.id}
                  onClick={async () => {
                    if (userId) {
                      await addFoodLog({
                        userId,
                        name: fav.name,
                        calories: fav.calories,
                        servingSize: fav.servingSize,
                        protein: fav.protein,
                        carbs: fav.carbs,
                        fat: fav.fat,
                        dateLogged: todayISO(),
                        isFavorite: false,
                        mealType: fav.mealType,
                      });
                    }
                  }}
                  className="shrink-0 border border-ink rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-ink hover:text-paper transition-colors snap-start"
                >
                  {fav.name} · {fav.calories} kcal
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Section D — Add to Today's Log */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader
            className="col-span-12"
            kicker={hasFavorites ? "03" : "02"}
            title="Add to Today's Log"
          />
          <div className="col-span-12 lg:col-span-6">
            <EditorialFrame label="01 · Write">
              <FoodLogger />
            </EditorialFrame>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <EditorialFrame label="02 · Scan">
              <Suspense fallback={<PageLoading message="Loading scanner..." />}>
                <BarcodeScanner
                  onBarcodeDetected={(barcode) => setBarcodeFood({ name: barcode })}
                />
              </Suspense>
            </EditorialFrame>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <EditorialFrame label="03 · Speak">
              <VoiceFoodLogger onTranscriptMatched={(name) => setVoiceFood({ name })} />
            </EditorialFrame>
          </div>
        </motion.section>

        {/* Section E — Today's Log */}
        <motion.section className="col-span-12" {...sv}>
          <SectionHeader
            kicker={hasFavorites ? "04" : "03"}
            title="Today's Log"
            subtitle={`${dailyLogs.length} ${dailyLogs.length === 1 ? "entry" : "entries"}`}
          />
          {init.status === "loading" ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mt-6">
              Loading...
            </p>
          ) : init.status === "error" ? (
            <p className="text-destructive mt-6 font-mono text-sm">{init.message}</p>
          ) : dailyLogs.length > 0 ? (
            <ul className="divide-y divide-rule border-y border-rule mt-4">
              <AnimatePresence initial={false}>
                {dailyLogs.map((log) => (
                  <LogEntry
                    key={log.id!}
                    log={log}
                    onEdit={setEditingLog}
                    onDelete={deleteFoodLog}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="font-display italic text-ink-soft text-lg mt-6">
              Nothing logged yet today.
            </p>
          )}
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Dashboard;

import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import FoodLogger from "../components/FoodLogger";
import PageLoading from "../components/PageLoading";
import VoiceFoodLogger from "../components/VoiceFoodLogger";
import WeeklySummary from "../components/WeeklySummary";
import WaterTracker from "../components/WaterTracker";
import StepTracker from "../components/StepTracker";
import StreakCard from "../components/StreakCard";
import { useAppState } from "../state/AppState";
import { todayISO } from "@/types";
import type { FoodItem } from "../db/dbService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardHero from "../components/dashboard/DashboardHero";
import SectionHeader from "../components/dashboard/SectionHeader";
import EditorialFrame from "../components/dashboard/EditorialFrame";
import LogEntry from "../components/dashboard/LogEntry";
import { motionTokens, pageVariants, useSectionMotion } from "../lib/motionVariants";
import { groupLogsByMeal } from "../lib/utils";

const BarcodeScanner = lazy(() => import("../components/BarcodeScanner"));

const Dashboard = () => {
  const {
    init,
    dailyLogs,
    deleteFoodLog,
    favoriteFoods,
    toggleFavorite,
    addFoodLog,
    userId,
    allFoodItems,
  } = useAppState();

  const handleDeleteWithUndo = useCallback(
    async (id: Parameters<typeof deleteFoodLog>[0]) => {
      const item = dailyLogs.find((l) => l.id === id);
      await deleteFoodLog(id);
      if (item && userId) {
        toast("Entry removed", {
          action: {
            label: "Undo",
            onClick: () => addFoodLog(item),
          },
        });
      }
    },
    [dailyLogs, deleteFoodLog, addFoodLog, userId],
  );
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

  const groupedLogs = useMemo(() => groupLogsByMeal(dailyLogs), [dailyLogs]);
  const recentFoods = useMemo(() => allFoodItems.slice(0, 8), [allFoodItems]);

  const closeEditLog = useCallback(() => setEditingLog(null), []);
  const closeBarcodeFood = useCallback(() => setBarcodeFood(null), []);
  const closeVoiceFood = useCallback(() => setVoiceFood(null), []);

  const sv = useSectionMotion();
  const hasFavorites = favoriteFoods.length > 0;
  const hasRecentFoods = recentFoods.length > 0;

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      {/* Edit Log Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && closeEditLog()}>
        <DialogContent className="sm:max-w-xl rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold text-ink">
              Edit Meal Entry
            </DialogTitle>
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
            <DialogTitle className="font-sans text-xl font-semibold text-ink">
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
            <DialogTitle className="font-sans text-xl font-semibold text-ink">
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
        <motion.section
          data-tour-id="dashboard-hero"
          className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6 hero-wash"
          {...sv}
        >
          <DashboardHero
            totalCalories={totalCalories}
            totals={{ protein: totalProtein, carbs: totalCarbs, fat: totalFat }}
          />
        </motion.section>

        {/* Section B — Week in Review */}
        <motion.section
          data-tour-id="dashboard-week"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader className="col-span-12" title="The Week in Review" />
          <div className="col-span-12 lg:col-span-6 border border-rule p-6">
            <WeeklySummary />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 border border-rule p-5 bg-paper-raised">
            <StreakCard />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 border border-rule p-5 bg-paper-raised">
            <WaterTracker />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 border border-rule p-5 bg-paper-raised">
            <StepTracker />
          </div>
        </motion.section>

        {/* Section C — Recently Logged */}
        {hasRecentFoods && (
          <motion.section className="col-span-12" {...sv}>
            <SectionHeader title="Recently Logged" />
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
              {recentFoods.map((item) => (
                <button
                  key={item.id ?? item.name}
                  onClick={async () => {
                    if (userId) {
                      await addFoodLog({
                        userId,
                        name: item.name,
                        calories: item.calories,
                        servingSize: item.servingSize,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                        dateLogged: todayISO(),
                        isFavorite: false,
                        mealType: item.mealType,
                      });
                    }
                  }}
                  className="shrink-0 border border-rule px-4 py-2 text-sm text-ink-soft hover:bg-paper-muted hover:text-ink hover:border-ink transition-colors snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                >
                  {item.name} · {item.calories} kcal
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Section D — From the Pantry */}
        {hasFavorites && (
          <motion.section className="col-span-12" {...sv}>
            <SectionHeader title="From the Pantry" />
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
                  className="shrink-0 border-b-2 border-ink px-4 py-2 text-sm text-ink hover:bg-ink hover:text-paper transition-colors snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                >
                  {fav.name} · {fav.calories} kcal
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Section E — Add to Today's Log */}
        <motion.section
          data-tour-id="dashboard-add"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader className="col-span-12" title="Add to Today's Log" accent />
          <div className="col-span-12 lg:col-span-6">
            <EditorialFrame label="Write">
              <FoodLogger />
            </EditorialFrame>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <EditorialFrame label="Scan">
              <Suspense fallback={<PageLoading message="Loading scanner..." />}>
                <BarcodeScanner
                  onBarcodeDetected={(barcode) => setBarcodeFood({ name: barcode })}
                />
              </Suspense>
            </EditorialFrame>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <EditorialFrame label="Speak">
              <VoiceFoodLogger onTranscriptMatched={(name) => setVoiceFood({ name })} />
            </EditorialFrame>
          </div>
        </motion.section>

        {/* Section F — Today's Log */}
        <motion.section data-tour-id="dashboard-log" className="col-span-12" {...sv}>
          <SectionHeader
            title="Today's Log"
            subtitle={`${dailyLogs.length} ${dailyLogs.length === 1 ? "entry" : "entries"}`}
            accent
          />
          {init.status === "loading" ? (
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-baseline gap-4 py-4 border-b border-rule/40"
                >
                  <div className="h-2 bg-paper-muted rounded w-16 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-paper-muted rounded w-3/4" />
                    <div className="h-2 bg-paper-muted rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-paper-muted rounded w-12 shrink-0" />
                </div>
              ))}
            </div>
          ) : init.status === "error" ? (
            <p className="text-destructive mt-6 font-mono text-sm">{init.message}</p>
          ) : dailyLogs.length > 0 ? (
            <div className="space-y-6 mt-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {groupedLogs.map((group) => {
                  const groupTotal = group.items.reduce((sum, log) => sum + log.calories, 0);
                  return (
                    <motion.div
                      key={group.meal}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{
                        duration: motionTokens.durInstant,
                        ease: motionTokens.easeOutExpo,
                      }}
                    >
                      <div className="flex items-baseline gap-4 mb-3 pb-2 border-b border-rule/50">
                        <span className="text-sm font-semibold text-ink-soft">{group.meal}</span>
                        <span className="ml-auto text-xs text-persimmon tabular-nums">
                          {groupTotal.toLocaleString()} kcal
                        </span>
                      </div>
                      <ul className="space-y-0 divide-y divide-rule/50 @container">
                        <AnimatePresence initial={false}>
                          {group.items.map((log) => (
                            <LogEntry
                              key={log.id!}
                              log={log}
                              onEdit={setEditingLog}
                              onDelete={handleDeleteWithUndo}
                              onToggleFavorite={toggleFavorite}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="mt-6 border-y border-rule/40 py-8 flex items-center gap-6">
              <p className="font-sans text-base text-ink-soft">Nothing logged yet today.</p>
              <span className="text-xs text-ink-soft/50 ml-auto">Use the logger above</span>
            </div>
          )}
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Dashboard;

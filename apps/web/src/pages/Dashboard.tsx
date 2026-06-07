import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import FoodLogger from "../components/FoodLogger";
import PageLoading from "../components/PageLoading";
import VoiceFoodLogger from "../components/VoiceFoodLogger";
import PhotoFoodLogger from "../components/PhotoFoodLogger";
import WeeklySummary from "../components/WeeklySummary";
import WaterTracker from "../components/WaterTracker";
import StepTracker from "../components/StepTracker";
import StreakCard from "../components/StreakCard";
import ActivityTracker from "../components/ActivityTracker";
import ActivityLogger from "../components/ActivityLogger";
import FastingTimer from "../components/FastingTimer";
import OnboardingBanner from "../components/OnboardingBanner";
import OnboardingModal from "../components/OnboardingModal";
import { useAppState } from "../state/AppState";
import type { MealType } from "@/types";
import { DAILY_WATER_GOAL_ML, MEAL_TYPES, todayISO } from "@/types";
import type { FoodItem } from "../db/dbService";
import { addFoodPhoto } from "../db/dbService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardHero from "../components/dashboard/DashboardHero";
import SectionHeader from "../components/dashboard/SectionHeader";
import EditorialFrame from "../components/dashboard/EditorialFrame";
import LogEntry from "../components/dashboard/LogEntry";
import { DailyVitalsStrip } from "../components/dashboard/DailyVitalsStrip";
import { PhotoStrip } from "../components/dashboard/PhotoStrip";
import RecurringMeals from "../components/RecurringMeals";
import MealTemplates from "../components/MealTemplates";
import { motionTokens, pageVariants, useSectionMotion } from "../lib/motionVariants";
import { cn, groupLogsByMeal } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";
import { EmptyPlate } from "../components/illustrations";
import { Button } from "@/components/ui/button";
import { useFastingTimer } from "../hooks/useFastingTimer";

const BarcodeScanner = lazy(() => import("../components/BarcodeScanner"));

type DashboardView = "today" | "week";

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
    tdeeProfile,
    dailyWaterLogs,
    dailyStepLogs,
    dailyActivityLogs,
    activeFastingSession,
    waterGoalMl,
    openQuickAdd,
  } = useAppState();

  const [activeView, setActiveView] = useState<DashboardView>("today");
  const [showTrackers, setShowTrackers] = useState(false);
  const [logFilter, setLogFilter] = useState<MealType | "All">("All");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const showBanner = init.status === "ready" && !init.user.hasCompletedOnboarding && !tdeeProfile;
  const openOnboarding = useCallback(() => setOnboardingOpen(true), []);
  const closeOnboarding = useCallback(() => setOnboardingOpen(false), []);

  const { formattedRemaining: fastingRemaining, isComplete: fastingComplete } = useFastingTimer();

  const handleDeleteWithUndo = useCallback(
    async (id: Parameters<typeof deleteFoodLog>[0]) => {
      const item = dailyLogs.find((l) => l.id === id);
      await deleteFoodLog(id);
      if (item && userId) {
        toast("Entry removed", {
          action: { label: "Undo", onClick: () => addFoodLog(item) },
        });
      }
    },
    [dailyLogs, deleteFoodLog, addFoodLog, userId],
  );

  const [editingLog, setEditingLog] = useState<FoodItem | null>(null);
  const [barcodeFood, setBarcodeFood] = useState<{ name: string } | null>(null);
  const [voiceFood, setVoiceFood] = useState<{ name: string } | null>(null);
  const [photoStripKey, setPhotoStripKey] = useState(0);

  const handlePhotoReady = useCallback(
    async (imageData: string, thumbnailData: string, mimeType: string) => {
      if (!userId) return;
      await addFoodPhoto({
        userId,
        imageData,
        thumbnailData,
        mimeType,
        createdAt: new Date().toISOString(),
      });
      setPhotoStripKey((k) => k + 1);
    },
    [userId],
  );

  const shouldReduceMotion = useReducedMotion();

  const { totalCalories, totalProtein, totalCarbs, totalFat } = useMemo(
    () =>
      dailyLogs.reduce(
        (acc, log) => ({
          totalCalories: acc.totalCalories + log.calories,
          totalProtein: acc.totalProtein + (log.protein ?? 0),
          totalCarbs: acc.totalCarbs + (log.carbs ?? 0),
          totalFat: acc.totalFat + (log.fat ?? 0),
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
      ),
    [dailyLogs],
  );

  const filteredLogs = useMemo(
    () => (logFilter === "All" ? dailyLogs : dailyLogs.filter((l) => l.mealType === logFilter)),
    [dailyLogs, logFilter],
  );
  const groupedLogs = useMemo(() => groupLogsByMeal(filteredLogs), [filteredLogs]);
  const recentFoods = useMemo(() => allFoodItems.slice(0, 8), [allFoodItems]);

  const totalWaterMl = useMemo(
    () => dailyWaterLogs.reduce((s, l) => s + l.amount, 0),
    [dailyWaterLogs],
  );
  const totalSteps = useMemo(() => dailyStepLogs.reduce((s, l) => s + l.steps, 0), [dailyStepLogs]);
  const totalBurned = useMemo(
    () => dailyActivityLogs.reduce((s, l) => s + l.caloriesBurned, 0),
    [dailyActivityLogs],
  );

  const closeEditLog = useCallback(() => setEditingLog(null), []);
  const closeBarcodeFood = useCallback(() => setBarcodeFood(null), []);
  const closeVoiceFood = useCallback(() => setVoiceFood(null), []);

  const handleQuickAdd = useCallback(
    async (item: FoodItem) => {
      if (!userId) return;
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
    },
    [userId, addFoodLog],
  );

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

      <OnboardingModal open={onboardingOpen} onClose={closeOnboarding} />

      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        variants={shouldReduceMotion ? undefined : pageVariants}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "show"}
      >
        {/* Onboarding banner */}
        {showBanner && (
          <AnimatePresence>
            <OnboardingBanner onOpenModal={openOnboarding} />
          </AnimatePresence>
        )}

        {/* Section A: Masthead / Hero */}
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

        {/* View tab strip */}
        <div className="col-span-12 -mt-8 border-b border-rule flex gap-0">
          {(["today", "week"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={cn(
                "px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors border-b-2 -mb-px",
                activeView === view
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {view === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>

        {activeView === "today" && (
          <>
            {/* Section: Today's Diary (primary content) */}
            <motion.section data-tour-id="dashboard-log" className="col-span-12" {...sv}>
              <div className="flex items-end gap-4 flex-wrap mb-4">
                <SectionHeader
                  kicker="Diary"
                  title="Today's Log"
                  subtitle={`${dailyLogs.length} ${dailyLogs.length === 1 ? "entry" : "entries"}`}
                />
                <div className="flex gap-1 ml-auto flex-wrap items-center">
                  {(["All", ...MEAL_TYPES] as const).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setLogFilter(label as MealType | "All")}
                      className={cn(
                        "px-2 py-0.5 text-xs font-mono border transition-colors",
                        logFilter === label
                          ? "border-ink bg-ink text-paper"
                          : "border-rule text-ink-soft hover:border-ink hover:text-ink",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="persimmon"
                    size="sm"
                    onClick={openQuickAdd}
                    className="ml-2 h-auto rounded-none py-1 px-3 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    Log Food
                  </Button>
                </div>
              </div>

              {userId && <PhotoStrip key={photoStripKey} userId={userId} date={todayISO()} />}

              {init.status === "loading" ? (
                <div className="space-y-4">
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
                <p className="mt-6 font-mono text-sm text-destructive">{init.message}</p>
              ) : dailyLogs.length > 0 ? (
                <div className="space-y-6">
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
                            <span className="text-sm font-semibold text-ink-soft">
                              {group.meal}
                            </span>
                            <span className="ml-auto text-xs tabular-nums text-persimmon">
                              {groupTotal.toLocaleString()} kcal
                            </span>
                          </div>
                          <ul className="divide-y divide-rule/50 @container">
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
                <div className="border border-rule/40">
                  <EmptyState
                    illustration={<EmptyPlate className="w-full h-full" />}
                    eyebrow="Today's Log"
                    heading="Nothing logged yet"
                    body="Start tracking your meals to see your calorie and macro breakdown."
                    variant="illustrated"
                    action={{ label: "+ Log First Meal", onClick: openQuickAdd }}
                  />
                </div>
              )}
            </motion.section>

            {/* Section: Daily Vitals (compact strip + expandable full trackers) */}
            <motion.section className="col-span-12" {...sv}>
              <div className="flex items-center gap-4 mb-3">
                <SectionHeader kicker="Today" title="Daily Vitals" />
                <button
                  type="button"
                  onClick={() => setShowTrackers((v) => !v)}
                  aria-expanded={showTrackers}
                  className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
                >
                  {showTrackers ? "Hide Trackers" : "Show Trackers"}
                </button>
              </div>
              <DailyVitalsStrip
                totalWaterMl={totalWaterMl}
                waterGoalMl={waterGoalMl ?? DAILY_WATER_GOAL_ML}
                totalSteps={totalSteps}
                totalBurned={totalBurned}
                fastingTargetHours={activeFastingSession?.targetHours}
                fastingRemaining={activeFastingSession ? fastingRemaining : undefined}
                fastingComplete={activeFastingSession ? fastingComplete : undefined}
              />
              <AnimatePresence>
                {showTrackers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 grid grid-cols-12 gap-4">
                      <div
                        data-tour-id="dashboard-fasting"
                        className="col-span-12 border border-rule p-5 bg-paper-raised sm:col-span-6 lg:col-span-4"
                      >
                        <FastingTimer />
                      </div>
                      <div className="col-span-12 border border-rule p-5 bg-paper-raised sm:col-span-6 lg:col-span-4">
                        <WaterTracker />
                      </div>
                      <div className="col-span-12 border border-rule p-5 bg-paper-raised sm:col-span-6 lg:col-span-4">
                        <StepTracker />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Section: Add to Today's Log */}
            <motion.section
              data-tour-id="dashboard-add"
              className="col-span-12 grid grid-cols-12 gap-6"
              {...sv}
            >
              <SectionHeader className="col-span-12" kicker="Log" title="Add to Today's Log" />
              <div className="col-span-12 lg:col-span-6">
                <EditorialFrame label="Write">
                  <FoodLogger />
                </EditorialFrame>
              </div>
              <div className="col-span-12 md:col-span-4 lg:col-span-2">
                <EditorialFrame label="Scan">
                  <Suspense fallback={<PageLoading message="Loading scanner..." />}>
                    <BarcodeScanner
                      onBarcodeDetected={(barcode) => setBarcodeFood({ name: barcode })}
                    />
                  </Suspense>
                </EditorialFrame>
              </div>
              <div className="col-span-12 md:col-span-4 lg:col-span-2">
                <EditorialFrame label="Speak">
                  <VoiceFoodLogger onTranscriptMatched={(name) => setVoiceFood({ name })} />
                </EditorialFrame>
              </div>
              <div className="col-span-12 md:col-span-4 lg:col-span-2">
                <EditorialFrame label="Photo">
                  <PhotoFoodLogger
                    onPhotoReady={(img, thumb, mime) => void handlePhotoReady(img, thumb, mime)}
                  />
                </EditorialFrame>
              </div>
            </motion.section>

            {/* Section: Recently Logged */}
            {hasRecentFoods && (
              <motion.section className="col-span-12" {...sv}>
                <SectionHeader kicker="Quick add" title="Recently Logged" />
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
                  {recentFoods.map((item) => (
                    <button
                      key={item.id ?? item.name}
                      type="button"
                      onClick={() => void handleQuickAdd(item)}
                      className="shrink-0 snap-start border border-rule px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:bg-paper-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                    >
                      {item.name} · {item.calories} kcal
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Section: From the Pantry (favorites) */}
            {hasFavorites && (
              <motion.section className="col-span-12" {...sv}>
                <SectionHeader kicker="Favourites" title="From the Pantry" />
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
                  {favoriteFoods.map((fav) => (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => void handleQuickAdd(fav)}
                      className="shrink-0 snap-start border-b-2 border-ink px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                    >
                      {fav.name} · {fav.calories} kcal
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Section: Recurring Meals & Templates */}
            <div className="col-span-12 flex flex-col gap-6 lg:flex-row">
              <motion.section className="flex-1" {...sv}>
                <RecurringMeals />
              </motion.section>
              <motion.section className="flex-[2]" {...sv}>
                <MealTemplates />
              </motion.section>
            </div>
          </>
        )}

        {activeView === "week" && (
          <>
            {/* Section: Week in Review */}
            <motion.section
              data-tour-id="dashboard-week"
              className="col-span-12 grid grid-cols-12 gap-6"
              {...sv}
            >
              <SectionHeader
                className="col-span-12"
                kicker="Weekly overview"
                title="The Week in Review"
              />
              <div className="col-span-12 border border-rule p-6 lg:col-span-7">
                <WeeklySummary />
              </div>
              <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
                <div className="border border-rule bg-paper-raised p-5">
                  <StreakCard />
                </div>
                <div
                  data-tour-id="dashboard-activity-tile"
                  className="flex-1 border border-rule bg-paper-raised p-5"
                >
                  <ActivityTracker />
                </div>
              </div>
            </motion.section>

            {/* Section: Log Activity */}
            <motion.section
              data-tour-id="dashboard-activity"
              className="col-span-12 grid grid-cols-12 gap-6"
              {...sv}
            >
              <SectionHeader className="col-span-12" kicker="Activity" title="Log Activity" />
              <div className="col-span-12 lg:col-span-6">
                <ActivityLogger />
              </div>
            </motion.section>
          </>
        )}
      </motion.main>
    </div>
  );
};

export default Dashboard;

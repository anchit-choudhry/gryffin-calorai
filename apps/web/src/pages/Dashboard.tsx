import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Info, Plus } from "lucide-react";
import { toast } from "sonner";
import FoodLogger from "../components/FoodLogger";
import PageLoading from "../components/PageLoading";
import WeeklySummary from "../components/WeeklySummary";
import WaterTracker from "../components/WaterTracker";
import StepTracker from "../components/StepTracker";
import StreakCard from "../components/StreakCard";
import ActivityTracker from "../components/ActivityTracker";
import ActivityLogger from "../components/ActivityLogger";
import FastingTimer from "../components/FastingTimer";
import OnboardingBanner from "../components/OnboardingBanner";
import OnboardingModal from "../components/OnboardingModal";
import { WeeklyHarvestModal } from "../components/WeeklyHarvestModal";
import { InsightCard } from "../components/dashboard/InsightCard";
import { useAppState } from "../state/AppState";
import type { MealType } from "@/types";
import { DAILY_WATER_GOAL_ML, MEAL_TYPES, todayISO } from "@/types";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import { detectPlateau } from "@/lib/adaptiveTdee";
import { useStreaks } from "@/hooks/useStreaks";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
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
import {
  motionTokens,
  pageVariants,
  useHeroSection,
  useSectionMotion,
} from "../lib/motionVariants";
import { cn, groupLogsByMeal } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";
import { MealPatternSuggestions } from "../components/dashboard/MealPatternSuggestions";
import { EmptyPlate } from "../components/illustrations";
import { FoodSpecimenSheet } from "../components/FoodSpecimenSheet";
import { Button } from "@/components/ui/button";
import { useFastingTimer } from "../hooks/useFastingTimer";
import { useWeeklyHarvestTrigger } from "../hooks/useWeeklyHarvestTrigger";
import { lookupBarcode, offProductToFoodItem } from "../lib/offProductApi";

const BarcodeScanner = lazy(() => import("../components/BarcodeScanner"));
const VoiceFoodLogger = lazy(() => import("../components/VoiceFoodLogger"));
const PhotoFoodLogger = lazy(() => import("../components/PhotoFoodLogger"));
const AlmanacPanel = lazy(() =>
  import("../components/dashboard/AlmanacPanel").then((m) => ({
    default: m.AlmanacPanel,
  })),
);

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
    bodyMeasurements,
    openQuickAdd,
    copyYesterdayLogs,
    captureOpen,
    openCapture,
    closeCapture,
  } = useAppState();

  const [activeView, setActiveView] = useState<DashboardView>("today");
  const [showTrackers, setShowTrackers] = useState(false);
  const [logFilter, setLogFilter] = useState<MealType | "All">("All");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [harvestForceOpen, setHarvestForceOpen] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiSelectMealType, setMultiSelectMealType] = useState<MealType>("Breakfast");
  const { shouldOpenThisSession, markSeen } = useWeeklyHarvestTrigger();
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
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

  const handleAddFoodLog = useCallback(
    async (item: Parameters<typeof addFoodLog>[0]) => {
      const id = await addFoodLog(item);
      if (id !== undefined) {
        const key = String(id);
        setNewlyAddedIds((prev) => new Set([...prev, key]));
        setTimeout(() => {
          setNewlyAddedIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 1000);
      }
    },
    [addFoodLog],
  );

  const [editingLog, setEditingLog] = useState<FoodItem | null>(null);
  const [specimenFood, setSpecimenFood] = useState<FoodItem | null>(null);
  const [barcodeFood, setBarcodeFood] = useState<{ name: string; prefill?: FoodItem } | null>(null);
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

  const toggleChipSelection = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleMultiLog = useCallback(async () => {
    if (!userId || selectedIds.size === 0) return;
    const toLog = recentFoods.filter((item) => selectedIds.has(String(item.id ?? item.name)));
    await Promise.all(
      toLog.map((item) =>
        handleAddFoodLog({
          userId,
          name: item.name,
          calories: item.calories,
          servingSize: item.servingSize,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          dateLogged: todayISO(),
          isFavorite: false,
          mealType: multiSelectMealType,
        }),
      ),
    );
    setSelectedIds(new Set());
    setIsMultiSelect(false);
  }, [userId, selectedIds, recentFoods, handleAddFoodLog, multiSelectMealType]);

  const cancelMultiSelect = useCallback(() => {
    setSelectedIds(new Set());
    setIsMultiSelect(false);
  }, []);

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

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      const toastId = toast.loading("Looking up barcode...");
      try {
        const product = await lookupBarcode(barcode);
        if (product) {
          setBarcodeFood({
            name: product.productName ?? barcode,
            prefill: offProductToFoodItem(product),
          });
        } else {
          setBarcodeFood({ name: barcode });
        }
      } catch {
        setBarcodeFood({ name: barcode });
      } finally {
        toast.dismiss(toastId);
      }
    },
    [setBarcodeFood],
  );

  const handleQuickAdd = useCallback(
    async (item: FoodItem) => {
      if (!userId) return;
      await handleAddFoodLog({
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
    [userId, handleAddFoodLog],
  );

  const { currentStreak } = useStreaks();
  const { daysOnTarget } = useWeeklySummary();

  const harvestOpen =
    harvestForceOpen || (init.status === "ready" && shouldOpenThisSession && daysOnTarget > 0);

  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;

  const plateau = useMemo(() => detectPlateau(bodyMeasurements), [bodyMeasurements]);

  const allInsights = useDashboardInsights({
    currentStreak,
    totalCaloriesToday: totalCalories,
    calorieGoal,
    totalProteinToday: totalProtein,
    dailyLogCount: dailyLogs.length,
    daysOnTargetThisWeek: daysOnTarget,
    isPlateauing: plateau.isPlateauing,
    plateauDaySpan: plateau.daySpan,
  });
  const visibleInsights = allInsights.filter((ins) => !dismissedInsights.includes(ins.id));

  const dismissInsight = useCallback(
    (id: string) => setDismissedInsights((prev) => [...prev, id]),
    [],
  );

  const sv = useSectionMotion();
  const hero = useHeroSection();
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
              {barcodeFood?.prefill ? barcodeFood.name : `Barcode: ${barcodeFood?.name}`}
            </DialogTitle>
          </DialogHeader>
          {barcodeFood &&
            (barcodeFood.prefill ? (
              <FoodLogger initialFood={barcodeFood.prefill} onSuccess={closeBarcodeFood} />
            ) : (
              <FoodLogger prefillName={barcodeFood.name} onSuccess={closeBarcodeFood} />
            ))}
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
      {specimenFood !== null && (
        <FoodSpecimenSheet
          food={specimenFood}
          allLogs={allFoodItems}
          onClose={() => setSpecimenFood(null)}
        />
      )}
      <WeeklyHarvestModal
        open={harvestOpen}
        onClose={() => {
          markSeen();
          setHarvestForceOpen(false);
        }}
      />

      <motion.main
        className="dashboard-grid mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        variants={shouldReduceMotion ? undefined : pageVariants}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "show"}
      >
        {/* Masthead: banner + hero + view tab strip */}
        <div className="dashboard-masthead">
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
            {...hero}
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
        </div>

        {activeView === "today" && (
          <>
            {/* Lead column: vitals + diary + add + recent + favorites + recurring */}
            <div className="dashboard-lead">
              {/* Section: Daily Vitals (compact strip + expandable full trackers) */}
              <motion.section className="col-span-12" {...sv}>
                <div className="flex items-center gap-4 mb-3">
                  <SectionHeader kicker="Today" title="Daily Vitals" />
                  <button
                    type="button"
                    onClick={() => setShowTrackers((v) => !v)}
                    aria-expanded={showTrackers}
                    className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
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

              {/* Insight cards */}
              {visibleInsights.length > 0 && (
                <motion.div className="col-span-12 flex flex-col gap-2 sm:flex-row" {...sv}>
                  {visibleInsights.map((ins) => (
                    <div key={ins.id} className="flex-1">
                      <InsightCard insight={ins} onDismiss={dismissInsight} />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Meal pattern suggestions */}
              <motion.div className="col-span-12" {...sv}>
                <MealPatternSuggestions />
              </motion.div>

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
                      variant="outline"
                      size="sm"
                      onClick={() => void copyYesterdayLogs()}
                      className="ml-2 h-auto rounded-none py-1 px-3 font-mono text-[10px] uppercase tracking-[0.2em] border-rule text-ink-soft hover:text-ink"
                    >
                      Copy Yesterday
                    </Button>
                    <Button
                      type="button"
                      variant="persimmon"
                      size="sm"
                      onClick={openQuickAdd}
                      className="h-auto rounded-none py-1 px-3 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5"
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
                                    isNew={newlyAddedIds.has(String(log.id))}
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
                      eyebrow="Today's Ledger"
                      heading="No entries recorded"
                      body="Open today's record with your first meal. Your daily harvest begins here."
                      variant="illustrated"
                      action={{ label: "Begin Today's Record", onClick: openQuickAdd }}
                    />
                  </div>
                )}
              </motion.section>

              {/* Section: Add to Today's Log (collapsed capture disclosure) */}
              <motion.section data-tour-id="dashboard-add" className="col-span-12" {...sv}>
                <div className="flex items-center gap-4 border-b border-rule pb-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
                    Log
                  </span>
                  <button
                    type="button"
                    onClick={captureOpen ? closeCapture : openCapture}
                    aria-expanded={captureOpen}
                    aria-controls="capture-panel"
                    className={cn(
                      "flex items-center gap-2 font-serif text-xl font-medium text-ink transition-colors",
                      "hover:text-persimmon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1",
                    )}
                  >
                    Add to Today&apos;s Log
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        captureOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <AnimatePresence>
                  {captureOpen && (
                    <motion.div
                      id="capture-panel"
                      key="capture"
                      initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      className="mt-4 grid grid-cols-12 gap-4"
                    >
                      <div className="col-span-12 lg:col-span-6">
                        <EditorialFrame label="Write">
                          <FoodLogger onSuccess={closeCapture} />
                        </EditorialFrame>
                      </div>
                      <div className="col-span-12 sm:col-span-4 lg:col-span-2">
                        <EditorialFrame label="Scan">
                          <Suspense fallback={<PageLoading />}>
                            <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
                          </Suspense>
                        </EditorialFrame>
                      </div>
                      <div className="col-span-12 sm:col-span-4 lg:col-span-2">
                        <EditorialFrame label="Speak">
                          <Suspense fallback={<PageLoading />}>
                            <VoiceFoodLogger
                              onTranscriptMatched={(name) => setVoiceFood({ name })}
                            />
                          </Suspense>
                        </EditorialFrame>
                      </div>
                      <div className="col-span-12 sm:col-span-4 lg:col-span-2">
                        <EditorialFrame label="Photo">
                          <Suspense fallback={<PageLoading />}>
                            <PhotoFoodLogger onPhotoReady={handlePhotoReady} />
                          </Suspense>
                        </EditorialFrame>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* Section: Recently Logged */}
              {hasRecentFoods && (
                <motion.section className="col-span-12" {...sv}>
                  <div className="flex items-center gap-3">
                    <SectionHeader kicker="Quick add" title="Recently Logged" />
                    {!isMultiSelect ? (
                      <button
                        type="button"
                        onClick={() => setIsMultiSelect(true)}
                        className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                      >
                        Select
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={cancelMultiSelect}
                        className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
                    {recentFoods.map((item) => {
                      const key = String(item.id ?? item.name);
                      const isSelected = selectedIds.has(key);
                      return isMultiSelect ? (
                        <button
                          key={key}
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={item.name}
                          onClick={() => toggleChipSelection(key)}
                          className={cn(
                            "shrink-0 snap-start border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1",
                            isSelected
                              ? "border-persimmon bg-persimmon-soft text-ink"
                              : "border-rule text-ink-soft hover:border-ink hover:bg-paper-muted hover:text-ink",
                          )}
                        >
                          {item.name} · {item.calories} kcal
                        </button>
                      ) : (
                        <button
                          key={key}
                          type="button"
                          onClick={() => void handleQuickAdd(item)}
                          className="shrink-0 snap-start border border-rule px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:bg-paper-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                        >
                          {item.name} · {item.calories} kcal
                        </button>
                      );
                    })}
                  </div>
                  {isMultiSelect && (
                    <div className="mt-3 flex items-center gap-3">
                      <select
                        aria-label="Meal type"
                        value={multiSelectMealType}
                        onChange={(e) => setMultiSelectMealType(e.target.value as MealType)}
                        className="font-mono text-[10px] uppercase tracking-[0.2em] border border-rule bg-paper px-2 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-persimmon focus:ring-offset-1"
                      >
                        {MEAL_TYPES.map((mt) => (
                          <option key={mt} value={mt}>
                            {mt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={selectedIds.size === 0}
                        onClick={() => void handleMultiLog()}
                        className="font-mono text-[10px] uppercase tracking-[0.2em] border border-rule px-3 py-1.5 text-ink transition-colors hover:border-persimmon hover:text-persimmon disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                      >
                        Log {selectedIds.size} items
                      </button>
                    </div>
                  )}
                </motion.section>
              )}

              {/* Section: From the Pantry (favorites) */}
              {hasFavorites && (
                <motion.section className="col-span-12" {...sv}>
                  <SectionHeader kicker="Favourites" title="From the Pantry" />
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 mt-4 snap-x">
                    {favoriteFoods.map((fav) => (
                      <div key={fav.id} className="shrink-0 snap-start flex border-b-2 border-ink">
                        <button
                          type="button"
                          onClick={() => void handleQuickAdd(fav)}
                          className="px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                        >
                          {fav.name} · {fav.calories} kcal
                        </button>
                        <button
                          type="button"
                          aria-label={`View specimen sheet for ${fav.name}`}
                          onClick={() => setSpecimenFood(fav)}
                          className="px-2 py-2 text-ink-soft border-l border-rule/40 transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                        >
                          <Info className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
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
            </div>

            {/* Sidebar column: almanac panel */}
            <div className="dashboard-sidebar">
              {/* E5 Almanac Panel */}
              <Suspense fallback={null}>
                <AlmanacPanel />
              </Suspense>
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
              <div className="col-span-12 flex items-end gap-4">
                <SectionHeader kicker="Weekly overview" title="The Week in Review" />
                <button
                  type="button"
                  onClick={() => {
                    markSeen();
                    setHarvestForceOpen(true);
                  }}
                  className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  Review Week
                </button>
              </div>
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

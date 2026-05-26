import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClipboardList } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMealTemplates } from "@/hooks/useMealTemplates";
import type { MealPlanId, MealTemplateId } from "@/types";
import { ISODate } from "@/types";
import { useStandaloneSection } from "@/lib/motionVariants";
import { EDITORIAL_INPUT_CLS } from "@/lib/utils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MealTemplates() {
  const {
    form,
    onSubmit,
    mealTemplates,
    mealPlans,
    dailyLogs,
    deleteMealTemplate,
    saveTemplateFromTodayLogs,
    logAllFoodsFromTemplate,
    copyFoodsFromDate,
    saveMealPlan,
    deleteMealPlan,
    applyWeekPlan,
  } = useMealTemplates();

  const [todayTemplateName, setTodayTemplateName] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDays, setPlanDays] = useState<(number | null)[]>(Array(7).fill(null));
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const standaloneSection = useStandaloneSection();
  const shouldReduceMotion = useReducedMotion();

  const handleSaveToday = () => {
    if (todayTemplateName.trim()) {
      void saveTemplateFromTodayLogs(todayTemplateName.trim());
      setTodayTemplateName("");
    }
  };

  const handleCopyYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    void copyFoodsFromDate(ISODate(dateStr));
  };

  const handleSavePlan = () => {
    if (!planName.trim()) return;
    void saveMealPlan({
      name: planName.trim(),
      days: planDays.map((templateId, i) => ({
        dayIndex: i,
        templateId: templateId as MealTemplateId | null,
      })),
    });
    setPlanName("");
    setPlanDays(Array(7).fill(null));
  };

  return (
    <section data-testid="meal-templates-section">
      <motion.section {...standaloneSection} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={14} className="text-ink-soft" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Meal Templates
          </h2>
        </div>
        <div className="space-y-2">
          {dailyLogs.length > 0 && (
            <div className="flex gap-2">
              <Input
                className={EDITORIAL_INPUT_CLS}
                placeholder="Template name"
                value={todayTemplateName}
                onChange={(e) => setTodayTemplateName(e.target.value)}
              />
              <Button type="button" onClick={handleSaveToday} className="font-mono text-xs">
                Save Today
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyYesterday}
            className="font-mono text-xs rounded-none border-rule"
          >
            Copy Yesterday
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => void onSubmit(e)} className="flex gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      className={EDITORIAL_INPUT_CLS}
                      placeholder="New template name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="font-mono text-xs">
              Create
            </Button>
          </form>
        </Form>

        <AnimatePresence>
          {mealTemplates.length === 0 ? (
            <p className="text-xs text-ink-soft font-mono">No saved templates</p>
          ) : (
            <ul className="space-y-2">
              {mealTemplates.map((t) => (
                <motion.div
                  key={t.id}
                  className="flex items-center justify-between border border-rule p-3"
                >
                  <div>
                    <p className="text-sm text-ink font-mono">{t.name}</p>
                    <p className="text-xs text-ink-soft font-mono">
                      {t.foods.length} {t.foods.length === 1 ? "food" : "foods"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void logAllFoodsFromTemplate(t.id as MealTemplateId)}
                      className="font-mono text-xs rounded-none"
                    >
                      Log All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      aria-label="Delete template"
                      onClick={() => void deleteMealTemplate(t.id as MealTemplateId)}
                      className="font-mono text-xs rounded-none"
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </ul>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Weekly Plan
          </h2>

          {mealPlans.length === 0 ? (
            <p className="text-xs text-ink-soft font-mono">No meal plans</p>
          ) : (
            <ul className="space-y-2">
              {mealPlans.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-rule px-3 py-2"
                >
                  <p className="text-sm text-ink font-mono">{p.name}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void applyWeekPlan(p.id as MealPlanId)}
                      className="font-mono text-xs rounded-none"
                    >
                      Apply Plan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      aria-label="Delete plan"
                      onClick={() => void deleteMealPlan(p.id as MealPlanId)}
                      className="font-mono text-xs rounded-none"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setCreatePlanOpen((v) => !v)}
            className="font-mono text-xs text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
          >
            {createPlanOpen ? "- Hide" : "+ Create Week Plan"}
          </button>
          <AnimatePresence initial={false}>
            {createPlanOpen && (
              <motion.div
                key="create-plan"
                initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2 border border-rule p-3 mt-2">
                  <Input
                    className={EDITORIAL_INPUT_CLS}
                    placeholder="Plan name"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                  <div className="space-y-0.5">
                    {DAY_NAMES.map((day, i) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="w-8 text-xs text-ink-soft font-mono">{day}</span>
                        <select
                          className="flex-1 rounded-none border border-rule bg-paper text-ink px-2 py-1 text-xs font-mono focus-visible:outline-none focus:ring-2 focus:ring-persimmon focus:ring-offset-1"
                          value={planDays[i] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : Number(e.target.value);
                            setPlanDays((prev) => prev.map((d, idx) => (idx === i ? val : d)));
                          }}
                          aria-label={`Template for ${day}`}
                        >
                          <option value="">-- No template --</option>
                          {mealTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    disabled={!planName.trim()}
                    onClick={handleSavePlan}
                    className="font-mono text-xs"
                  >
                    Save Plan
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </section>
  );
}

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMealTemplates } from "@/hooks/useMealTemplates";
import type { MealPlanId, MealTemplateId } from "@/types";
import { ISODate } from "@/types";
import { sectionVariants } from "@/lib/motionVariants";
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
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Meal Templates</h2>

          {dailyLogs.length > 0 && (
            <div className="flex gap-2">
              <Input
                className={EDITORIAL_INPUT_CLS}
                placeholder="Template name"
                value={todayTemplateName}
                onChange={(e) => setTodayTemplateName(e.target.value)}
              />
              <Button type="button" onClick={handleSaveToday}>
                Save Today
              </Button>
            </div>
          )}

          <Button type="button" variant="outline" onClick={handleCopyYesterday}>
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
            <Button type="submit">Create</Button>
          </form>
        </Form>

        <AnimatePresence>
          {mealTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved templates</p>
          ) : (
            <ul className="space-y-2">
              {mealTemplates.map((t) => (
                <motion.div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.foods.length} {t.foods.length === 1 ? "food" : "foods"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void logAllFoodsFromTemplate(t.id as MealTemplateId)}
                    >
                      Log All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      aria-label="Delete template"
                      onClick={() => void deleteMealTemplate(t.id as MealTemplateId)}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </ul>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Weekly Plan</h2>

          {mealPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meal plans</p>
          ) : (
            <ul className="space-y-2">
              {mealPlans.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <p className="font-medium">{p.name}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void applyWeekPlan(p.id as MealPlanId)}
                    >
                      Apply Plan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      aria-label="Delete plan"
                      onClick={() => void deleteMealPlan(p.id as MealPlanId)}
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {createPlanOpen ? "- Hide" : "+ Create Week Plan"}
          </button>
          {createPlanOpen && (
            <div className="space-y-2 rounded-md border p-3">
              <Input
                className={EDITORIAL_INPUT_CLS}
                placeholder="Plan name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <div className="space-y-0.5">
                {DAY_NAMES.map((day, i) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-8 text-xs text-muted-foreground">{day}</span>
                    <select
                      className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
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
              <Button type="button" disabled={!planName.trim()} onClick={handleSavePlan}>
                Save Plan
              </Button>
            </div>
          )}
        </div>
      </motion.section>
    </section>
  );
}

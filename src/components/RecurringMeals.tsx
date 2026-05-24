import { useState, useCallback, useEffect } from "react";
import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Trash2, Plus, Clock, RepeatIcon } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppState } from "@/state/AppState";
import { useRecurringMealForm, DAY_NAMES } from "@/hooks/useRecurringMealForm";
import { EDITORIAL_INPUT_CLS, cn } from "@/lib/utils";
import { MEAL_TYPES } from "@/types";
import type { RecurringMeal } from "@/db/dbService";
import { motionTokens } from "@/lib/motionVariants";

const RecurringMeals: FC = () => {
  const {
    recurringMeals,
    deleteRecurringMeal,
    checkAndPromptRecurringMeals,
    userId,
    allFoodItems,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { form, onSubmit } = useRecurringMealForm(close);

  // Prompt on mount if recurring meals exist for today
  useEffect(() => {
    checkAndPromptRecurringMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (meal: RecurringMeal) => {
    if (!meal.id) return;
    await deleteRecurringMeal(meal.id);
    toast("Recurring meal removed", { description: meal.name });
  };

  const dayMaskValue = form.watch("dayMask") as number;

  const toggleDay = (index: number) => {
    const bit = 1 << index;
    form.setValue("dayMask", (dayMaskValue ?? 0) ^ bit, { shouldDirty: true });
  };

  const addFoodFromRecent = () => {
    const recent = allFoodItems[0];
    if (!recent) return;
    const current = form.getValues("foods") ?? [];
    form.setValue("foods", [
      ...current,
      {
        name: recent.name,
        calories: recent.calories,
        servingSize: recent.servingSize,
        protein: recent.protein,
        carbs: recent.carbs,
        fat: recent.fat,
        mealType: form.getValues("mealType"),
      },
    ]);
  };

  if (!userId) return null;

  return (
    <div data-tour-id="dashboard-recurring">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RepeatIcon size={14} className="text-ink-soft" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Recurring Meals
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="font-mono text-xs rounded-none border border-rule h-7 px-2 hover:bg-paper-muted"
        >
          <Plus size={12} className="mr-1" />
          Add
        </Button>
      </div>

      {recurringMeals.length === 0 ? (
        <p className="text-xs text-ink-soft font-mono">No recurring meals set up yet.</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {recurringMeals.map((meal) => {
              const activeDays = DAY_NAMES.filter((_, i) => meal.dayMask & (1 << i));
              return (
                <motion.li
                  key={meal.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: motionTokens.durInstant, ease: motionTokens.easeOutExpo }}
                  className="flex items-start gap-3 border-b border-rule/40 pb-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-mono truncate">{meal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-ink-soft shrink-0" />
                      <span className="text-[10px] text-ink-soft font-mono">
                        {meal.scheduledTime} · {meal.mealType}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {activeDays.map((d) => (
                        <span
                          key={d}
                          className="text-[9px] font-mono uppercase tracking-wider border border-rule/60 px-1 text-ink-soft"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(meal)}
                    className="shrink-0 text-ink-soft hover:text-destructive transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
                    aria-label={`Delete ${meal.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-lg rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold text-ink">
              New Recurring Meal
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5 mt-2">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                      Meal Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Morning Oats"
                        className={EDITORIAL_INPUT_CLS}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Days of week */}
              <FormField
                control={form.control}
                name="dayMask"
                render={() => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                      Days
                    </FormLabel>
                    <div className="flex gap-1 mt-1">
                      {DAY_NAMES.map((day, i) => {
                        const active = !!(dayMaskValue & (1 << i));
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(i)}
                            className={cn(
                              "w-8 h-8 text-[10px] font-mono border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon",
                              active
                                ? "border-ink bg-ink text-paper"
                                : "border-rule text-ink-soft hover:border-ink",
                            )}
                          >
                            {day[0]}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meal type + time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                        Meal Type
                      </FormLabel>
                      <FormControl>
                        <select {...field} className={cn(EDITORIAL_INPUT_CLS, "w-full")}>
                          {MEAL_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                        Time
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="time" className={EDITORIAL_INPUT_CLS} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Foods */}
              <FormField
                control={form.control}
                name="foods"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                        Foods ({form.watch("foods")?.length ?? 0})
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addFoodFromRecent}
                        disabled={allFoodItems.length === 0}
                        className="font-mono text-[10px] rounded-none h-6 px-2 border border-rule/60 hover:bg-paper-muted"
                      >
                        + Add recent
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(form.watch("foods") ?? []).map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs font-mono border-b border-rule/30 py-1"
                        >
                          <span className="text-ink truncate">{f.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-ink-soft tabular-nums">{f.calories} kcal</span>
                            <button
                              type="button"
                              onClick={() => {
                                const foods = form.getValues("foods");
                                form.setValue(
                                  "foods",
                                  foods.filter((_, j) => j !== i),
                                );
                              }}
                              className="text-ink-soft hover:text-destructive transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  className="font-mono text-xs rounded-none border border-rule flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="font-mono text-xs uppercase tracking-widest rounded-none flex-1"
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringMeals;

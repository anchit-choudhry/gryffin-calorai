import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { type MealTemplateFormValues, MealTemplateSchema } from "@/forms/schemas";
import { useAppState } from "@/state/AppState";

export function useMealTemplates() {
  const {
    mealTemplates,
    mealPlans,
    dailyLogs,
    addMealTemplate,
    deleteMealTemplate,
    saveTemplateFromTodayLogs,
    logAllFoodsFromTemplate,
    copyFoodsFromDate,
    saveMealPlan,
    deleteMealPlan,
    applyWeekPlan,
  } = useAppState();

  const form = useForm<MealTemplateFormValues>({
    resolver: zodResolver(MealTemplateSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault?.();
    await form.handleSubmit(async (data) => {
      await addMealTemplate({ name: data.name, foods: [] });
      form.reset({ name: "" });
    })(e);
  };

  return {
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
  };
}

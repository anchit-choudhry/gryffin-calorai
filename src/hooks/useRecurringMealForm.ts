import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecurringMealSchema, type RecurringMealFormValues } from "@/forms/schemas";
import { useAppState } from "@/state/AppState";
import { DAY_NAMES } from "@/types";

export { DAY_NAMES };

export function useRecurringMealForm(onSuccess?: () => void) {
  const { addRecurringMeal, allFoodItems } = useAppState();

  const form = useForm<RecurringMealFormValues>({
    resolver: zodResolver(RecurringMealSchema),
    defaultValues: {
      name: "",
      dayMask: 0b1111111, // every day
      mealType: "Breakfast",
      scheduledTime: "08:00",
      foods: [],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await addRecurringMeal({
      name: data.name,
      dayMask: data.dayMask,
      mealType: data.mealType,
      scheduledTime: data.scheduledTime,
      foods: data.foods,
    });
    form.reset();
    onSuccess?.();
  });

  return { form, onSubmit, allFoodItems };
}

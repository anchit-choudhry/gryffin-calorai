import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { FoodItem } from "../db/dbService";
import { useAppState } from "../state/AppState";
import { DEFAULT_MEAL_TYPE, todayISO } from "../types";
import { FoodFormSchema, type FoodFormValues } from "../forms/schemas";

export function calculateTotalCalories(caloriesPerServing: number, servingSize: number): number {
  return Math.round(caloriesPerServing * servingSize);
}

export function useFoodForm(initialFood?: FoodItem): {
  form: ReturnType<typeof useForm<FoodFormValues>>;
  isLoading: boolean;
  isEditMode: boolean;
  submitFoodLog: () => Promise<boolean>;
  resetForm: () => void;
} {
  const { userId, addFoodLog, updateFoodLog } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!initialFood?.id;

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(FoodFormSchema),
    defaultValues: {
      name: initialFood?.name ?? "",
      calories: initialFood?.calories ?? 0,
      servingSize: initialFood?.servingSize ?? 1,
      protein: initialFood?.protein ?? 0,
      carbs: initialFood?.carbs ?? 0,
      fat: initialFood?.fat ?? 0,
      mealType: initialFood?.mealType ?? DEFAULT_MEAL_TYPE,
    },
  });

  const submitFoodLog = async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not initialized. Please refresh the page.");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      form.handleSubmit(
        async (data) => {
          setIsLoading(true);
          try {
            const totalCalories = calculateTotalCalories(data.calories, data.servingSize);

            if (isEditMode) {
              await updateFoodLog(initialFood!.id!, {
                name: data.name,
                calories: totalCalories,
                servingSize: data.servingSize,
                protein: data.protein,
                carbs: data.carbs,
                fat: data.fat,
                mealType: data.mealType,
              });
              toast.success(`Updated ${data.name}!`);
            } else {
              await addFoodLog({
                userId,
                name: data.name,
                calories: totalCalories,
                servingSize: data.servingSize,
                protein: data.protein,
                carbs: data.carbs,
                fat: data.fat,
                dateLogged: todayISO(),
                isFavorite: false,
                mealType: data.mealType,
              });
              toast.success(`Successfully logged ${data.name}! Macros updated.`);
            }

            resetForm();
            resolve(true);
          } catch (error) {
            console.error("Error logging food:", error);
            toast.error("Failed to save food log. Check console for details.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => resolve(false),
      )();
    });
  };

  const resetForm = () => {
    form.reset({
      name: "",
      calories: 0,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealType: DEFAULT_MEAL_TYPE,
    });
  };

  return { form, isLoading, isEditMode, submitFoodLog, resetForm };
}

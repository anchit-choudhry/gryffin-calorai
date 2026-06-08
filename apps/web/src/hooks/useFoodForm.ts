import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { FoodItem } from "../db/dbService";
import { useAppState } from "../state/AppState";
import { DEFAULT_MEAL_TYPE } from "../types";
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
  prefillFromFood: (food: FoodItem) => void;
  applyPortionMultiplier: (factor: number) => void;
} {
  const { userId, addFoodLog, updateFoodLog, selectedDate } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!initialFood?.id;

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(FoodFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: initialFood?.name ?? "",
      calories: initialFood?.calories ?? 0,
      servingSize: initialFood?.servingSize ?? 1,
      protein: initialFood?.protein,
      carbs: initialFood?.carbs,
      fat: initialFood?.fat,
      mealType: initialFood?.mealType ?? DEFAULT_MEAL_TYPE,
      nutritionData: initialFood?.nutritionData,
    },
  });

  const submitFoodLog = async (): Promise<boolean> => {
    if (!userId) {
      toast.error("Not ready - please refresh");
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
                nutritionData: data.nutritionData,
              });
              toast.success(`${data.name} updated`);
            } else {
              await addFoodLog({
                userId,
                name: data.name,
                calories: totalCalories,
                servingSize: data.servingSize,
                protein: data.protein,
                carbs: data.carbs,
                fat: data.fat,
                dateLogged: selectedDate,
                isFavorite: false,
                mealType: data.mealType,
                nutritionData: data.nutritionData,
              });
              toast.success(`${data.name} logged`);
            }

            resetForm();
            resolve(true);
          } catch (error) {
            if (import.meta.env.DEV) console.error("Error logging food:", error);
            toast.error("Failed to save entry");
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
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      mealType: DEFAULT_MEAL_TYPE,
      nutritionData: undefined,
    });
  };

  const prefillFromFood = (food: FoodItem) => {
    form.reset({
      name: food.name,
      calories: food.calories,
      servingSize: food.servingSize,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      mealType: food.mealType ?? DEFAULT_MEAL_TYPE,
      nutritionData: food.nutritionData,
    });
  };

  const applyPortionMultiplier = (factor: number) => {
    form.setValue("servingSize", factor, { shouldValidate: true });
  };

  return {
    form,
    isLoading,
    isEditMode,
    submitFoodLog,
    resetForm,
    prefillFromFood,
    applyPortionMultiplier,
  };
}

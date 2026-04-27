import { useState } from "react";
import type { FoodItem } from "../db/dbService";
import { useAppState } from "../state/AppState";
import { DEFAULT_MEAL_TYPE, type MealType, todayISO } from "../types";

export function calculateTotalCalories(caloriesPerServing: number, servingSize: number): number {
  return Math.round(caloriesPerServing * servingSize);
}

export function useFoodForm(initialFood?: FoodItem) {
  const { userId, addFoodLog, updateFoodLog } = useAppState();
  const [name, setName] = useState(initialFood?.name ?? "");
  const [calories, setCalories] = useState(initialFood?.calories ?? 0);
  const [servingSize, setServingSize] = useState(initialFood?.servingSize ?? 1);
  const [protein, setProtein] = useState(initialFood?.protein ?? 0);
  const [carbs, setCarbs] = useState(initialFood?.carbs ?? 0);
  const [fat, setFat] = useState(initialFood?.fat ?? 0);
  const [mealType, setMealType] = useState<MealType>(initialFood?.mealType ?? DEFAULT_MEAL_TYPE);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitFoodLog = async (): Promise<boolean> => {
    if (
      name.trim().length < 1 ||
      name.trim().length > 100 ||
      calories < 0 ||
      calories > 10000 ||
      servingSize < 1 ||
      servingSize > 100 ||
      protein < 0 ||
      protein > 500 ||
      carbs < 0 ||
      carbs > 500 ||
      fat < 0 ||
      fat > 500
    ) {
      setMessage(
        "Please enter a valid name, calories per serving (0-10000), serving size (1-100), and protein/carbs/fat (0-500g).",
      );
      return false;
    }

    if (!userId) {
      setMessage("User not initialized. Please refresh the page.");
      return false;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const totalCalories = calculateTotalCalories(Number(calories), Number(servingSize));
      const isEditMode = !!initialFood?.id;

      if (isEditMode) {
        await updateFoodLog(initialFood!.id!, {
          name,
          calories: totalCalories,
          servingSize: Number(servingSize),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
          mealType,
        });
        setMessage(`Updated ${name}!`);
      } else {
        await addFoodLog({
          userId,
          name,
          calories: totalCalories,
          servingSize: Number(servingSize),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
          dateLogged: todayISO(),
          isFavorite: false,
          mealType,
        });
        setMessage(`Successfully logged ${name}! Macros updated.`);
      }

      resetForm();
      return true;
    } catch (error) {
      console.error("Error logging food:", error);
      setMessage("Failed to save food log. Check console for details.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCalories(0);
    setServingSize(1);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setMealType(DEFAULT_MEAL_TYPE);
  };

  return {
    name,
    setName,
    calories,
    setCalories,
    servingSize,
    setServingSize,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    mealType,
    setMealType,
    isLoading,
    message,
    submitFoodLog,
    resetForm,
  };
}

import { useState } from "react";
import { useAppState } from "../state/AppState";
import { todayISO } from "../types";

export function useFoodForm() {
  const { userId, addFoodLog } = useAppState();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [servingSize, setServingSize] = useState(1);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
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
        "Please enter a valid name, calories (0-10000), serving size (1-100), and protein/carbs/fat (0-500g).",
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
      await addFoodLog({
        userId,
        name,
        calories: Number(calories),
        servingSize: Number(servingSize),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        dateLogged: todayISO(),
      });

      setMessage(`Successfully logged ${name}! Macros updated.`);
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
    isLoading,
    message,
    submitFoodLog,
    resetForm,
  };
}

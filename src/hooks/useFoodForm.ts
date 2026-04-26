import { useState } from "react";
import { useAppState } from "../state/AppState";
import { todayISO } from "../types";

export function useFoodForm() {
  const { userId, addFoodLog } = useAppState();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [servingSize, setServingSize] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitFoodLog = async (): Promise<boolean> => {
    if (
      name.trim().length < 1 ||
      name.trim().length > 100 ||
      calories < 0 ||
      calories > 10000 ||
      servingSize < 1 ||
      servingSize > 100
    ) {
      setMessage("Please enter a valid name, calories (0-10000), and serving size (1-100).");
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
        dateLogged: todayISO(),
      });

      setMessage(`Successfully logged ${name}! Calories updated.`);
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
  };

  return {
    name,
    setName,
    calories,
    setCalories,
    servingSize,
    setServingSize,
    isLoading,
    message,
    submitFoodLog,
    resetForm,
  };
}

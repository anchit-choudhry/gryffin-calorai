import { useState } from "react";
import { saveRecipe } from "../db/dbService";
import type { FoodItemId, UserId } from "../types";
import { FoodItemId as makeFoodItemId } from "../types";

interface Ingredient {
  id: string;
  foodItemId: FoodItemId;
  quantity: number;
  serving: number;
}

export function useRecipeForm(userId: UserId | null) {
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const updateIngredient = (id: string, field: keyof Omit<Ingredient, "id">, value: number) => {
    setIngredients(ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)));
  };

  const saveRecipeForm = async (): Promise<boolean> => {
    if (!recipeName || !description || ingredients.length === 0) {
      setMessage("Please provide a name, description, and at least one ingredient.");
      return false;
    }

    if (!userId) {
      setMessage("User not initialized. Please refresh the page.");
      return false;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const totalCalories = ingredients.reduce((acc) => acc + 100, 0);

      await saveRecipe({
        name: recipeName,
        description,
        ingredients: ingredients.map(({ foodItemId, quantity, serving }) => ({
          foodItemId,
          quantity,
          serving,
        })),
        totalCalories,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
        userId,
      });

      setMessage(`Recipe "${recipeName}" saved successfully!`);
      resetForm();
      return true;
    } catch (error) {
      console.error("Error saving recipe:", error);
      setMessage("Failed to save recipe. Check console for details.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRecipeName("");
    setDescription("");
    setIngredients([]);
  };

  return {
    recipeName,
    setRecipeName,
    description,
    setDescription,
    ingredients,
    addIngredient,
    removeIngredient,
    updateIngredient,
    message,
    isLoading,
    saveRecipeForm,
    resetForm,
  };
}

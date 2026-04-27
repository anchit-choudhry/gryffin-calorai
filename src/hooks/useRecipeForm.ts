import { useState } from "react";
import { type FoodItem, saveRecipe } from "../db/dbService";
import type { FoodItemId, UserId } from "../types";
import { FoodItemId as makeFoodItemId } from "../types";

interface FormIngredient {
  id: string;
  foodItemId: FoodItemId;
  foodItemName: string;
  calories: number;
  quantity: number;
  serving: number;
}

export function useRecipeForm(userId: UserId | null, allFoodItems: FoodItem[]) {
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<FormIngredient[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: crypto.randomUUID(),
        foodItemId: makeFoodItemId(0),
        foodItemName: "",
        calories: 0,
        quantity: 1,
        serving: 1,
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const updateIngredient = (
    id: string,
    field: keyof Omit<FormIngredient, "id">,
    value: number | string,
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: typeof value === "number" ? value : value } : ing,
      ),
    );
  };

  const selectIngredientFoodItem = (ingredientId: string, foodItem: FoodItem) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === ingredientId
          ? {
              ...ing,
              foodItemId: foodItem.id!,
              foodItemName: foodItem.name,
              calories: foodItem.calories,
            }
          : ing,
      ),
    );
  };

  const saveRecipeForm = async (): Promise<boolean> => {
    if (
      !recipeName ||
      !description ||
      ingredients.length === 0 ||
      recipeName.trim().length < 1 ||
      recipeName.trim().length > 100 ||
      description.trim().length < 1 ||
      description.trim().length > 500
    ) {
      setMessage(
        "Recipe name (1-100 chars) and description (1-500 chars) are required, plus at least one ingredient.",
      );
      return false;
    }

    if (ingredients.some((ing) => ing.foodItemId === makeFoodItemId(0))) {
      setMessage("All ingredients must be linked to a food item.");
      return false;
    }

    if (!userId) {
      setMessage("User not initialized. Please refresh the page.");
      return false;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const totalCalories = ingredients.reduce(
        (acc, ing) => acc + ing.calories * ing.quantity * ing.serving,
        0,
      );

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
    selectIngredientFoodItem,
    allFoodItems,
    message,
    isLoading,
    saveRecipeForm,
    resetForm,
  };
}

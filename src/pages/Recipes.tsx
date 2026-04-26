// src/pages/Recipes.tsx
import React from "react";
import { useAppState } from "../state/AppState";
import { useRecipeForm } from "../hooks/useRecipeForm";

const Recipes: React.FC = () => {
  const { userId } = useAppState();
  const {
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
  } = useRecipeForm(userId);

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRecipeForm();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold border-b dark:border-gray-700 pb-2 dark:text-gray-100">
        Recipe Manager
      </h2>

      <div className="p-6 border dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
        <h3 className="text-xl font-semibold mb-4 dark:text-gray-200">Create New Recipe</h3>
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipe Name
            </label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
              placeholder="e.g., High Protein Breakfast"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border dark:bg-gray-700 dark:text-white"
              placeholder="Briefly describe the meal's purpose."
              required
            />
          </div>

          <div className="border dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3">
            <h4 className="font-medium dark:text-gray-200">Ingredients</h4>
            {ingredients.map((ing) => (
              <div
                key={ing.id}
                className="flex space-x-2 items-center bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700"
              >
                <input
                  type="number"
                  placeholder="Food Item ID"
                  value={ing.foodItemId}
                  onChange={(e) =>
                    updateIngredient(ing.id, "foodItemId", parseInt(e.target.value) || 1)
                  }
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={(e) =>
                    updateIngredient(ing.id, "quantity", parseInt(e.target.value) || 1)
                  }
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Serving Size"
                  value={ing.serving}
                  onChange={(e) =>
                    updateIngredient(ing.id, "serving", parseInt(e.target.value) || 1)
                  }
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(ing.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
            >
              + Add Ingredient
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white transition ${isLoading ? "bg-gray-400 dark:bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
          >
            {isLoading ? "Saving..." : "Save Recipe"}
          </button>
        </form>
      </div>

      {message && (
        <p
          className={`p-3 rounded ${message.includes("successfully") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Recipes;

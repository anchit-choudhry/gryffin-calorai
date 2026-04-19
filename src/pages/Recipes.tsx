// src/pages/Recipes.tsx
import React, { useState } from "react";

const Recipes: React.FC = () => {
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<
    Array<{ foodItemId: number; quantity: number; serving: number }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddIngredient = () => {
    // In a real app, we'd fetch foodItem names/details here.
    setIngredients([...ingredients, { foodItemId: 1, quantity: 1, serving: 1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName || !description || ingredients.length === 0) {
      setMessage("Please provide a name, description, and at least one ingredient.");
      return;
    }

    // Calculate total calories (Mock calculation for MVP)
    const totalCalories = ingredients.reduce((acc) => acc + 100, 0); // Mock calculation

    // TODO: Call the database service to save the recipe
    console.log("Saving Recipe:", { name: recipeName, description, ingredients, totalCalories });

    setMessage(`Recipe "${recipeName}" saved successfully! Total Calories: ${totalCalories}.`);

    // Reset form
    setRecipeName("");
    setDescription("");
    setIngredients([]);
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
            {ingredients.map((ing, index) => (
              <div
                key={index}
                className="flex space-x-2 items-center bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700"
              >
                <input
                  type="number"
                  placeholder="Food Item ID"
                  defaultValue={ing.foodItemId}
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  defaultValue={ing.quantity}
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Serving Size"
                  defaultValue={ing.serving}
                  className="w-1/3 border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
            >
              + Add Ingredient
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 transition"
          >
            Save Recipe
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

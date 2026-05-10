import { type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAppState } from "../state/AppState";
import { useRecipeForm } from "../hooks/useRecipeForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SectionHeader from "../components/dashboard/SectionHeader";
import { pageVariants, sectionVariants } from "../lib/motionVariants";

const Recipes = () => {
  const { userId, allFoodItems, recipes, deleteRecipe, fetchRecipes } = useAppState();
  const { form, fields, append, remove, isLoading, saveRecipeForm } = useRecipeForm(userId);
  const shouldReduceMotion = useReducedMotion();
  const watchedIngredients = form.watch("ingredients");

  const handleSaveRecipe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await saveRecipeForm();
    if (success && userId) {
      await fetchRecipes(userId);
    }
  };

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: pageVariants, initial: "hidden", animate: "show" };
  const sv = shouldReduceMotion ? {} : { variants: sectionVariants };

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        {...motionProps}
      >
        {/* Section A — Recipe Manager */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="01" title="Recipe Manager" />
          <div className="col-span-12 border border-rule p-6">
            <Form {...form}>
              <form onSubmit={handleSaveRecipe} className="space-y-6">
                <FormField
                  control={form.control}
                  name="recipeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                        Recipe Name
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          className="mt-2 block w-full border border-rule p-3 bg-paper text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-persimmon"
                          placeholder="e.g., High Protein Breakfast"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                        Description
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          className="mt-2 block w-full border border-rule p-3 bg-paper text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-persimmon"
                          placeholder="Briefly describe the meal's purpose."
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="border border-rule p-5 space-y-4">
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                    Ingredients
                  </h4>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-2 items-center border border-rule p-3 bg-paper-muted"
                    >
                      <div className="relative flex-1">
                        <input
                          type="text"
                          list={`food-items-${field.id}`}
                          placeholder="Search food item..."
                          value={watchedIngredients?.[index]?.foodItemName ?? ""}
                          onChange={(e) => {
                            const name = e.target.value;
                            form.setValue(`ingredients.${index}.foodItemName`, name);
                            const match = allFoodItems.find(
                              (fi) => fi.name.toLowerCase() === name.toLowerCase(),
                            );
                            if (match && match.id != null) {
                              form.setValue(`ingredients.${index}.foodItemId`, match.id);
                              form.setValue(`ingredients.${index}.foodItemName`, match.name);
                              form.setValue(`ingredients.${index}.calories`, match.calories);
                            }
                          }}
                          className="w-full border border-rule p-2 bg-paper text-ink placeholder-ink-soft text-sm focus:outline-none focus:ring-2 focus:ring-persimmon"
                        />
                        <datalist id={`food-items-${field.id}`}>
                          {allFoodItems.map((fi) => (
                            <option key={fi.id} value={fi.name} />
                          ))}
                        </datalist>
                      </div>
                      <input
                        type="number"
                        placeholder="Quantity"
                        aria-label="Ingredient quantity"
                        {...form.register(`ingredients.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        className="w-20 border border-rule p-2 bg-paper text-ink placeholder-ink-soft text-sm focus:outline-none focus:ring-2 focus:ring-persimmon"
                      />
                      <input
                        type="number"
                        placeholder="Serving"
                        aria-label="Ingredient serving size"
                        {...form.register(`ingredients.${index}.serving`, {
                          valueAsNumber: true,
                        })}
                        className="w-20 border border-rule p-2 bg-paper text-ink placeholder-ink-soft text-sm focus:outline-none focus:ring-2 focus:ring-persimmon"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80 font-mono text-[10px] uppercase tracking-wider transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        foodItemId: 0,
                        foodItemName: "",
                        calories: 0,
                        quantity: 1,
                        serving: 1,
                      })
                    }
                    className="font-mono text-[11px] uppercase tracking-wider text-persimmon hover:text-persimmon/80 transition"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition ${
                    isLoading
                      ? "bg-ink-soft cursor-not-allowed"
                      : "bg-persimmon hover:bg-persimmon/90"
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Recipe"}
                </button>
              </form>
            </Form>
          </div>
        </motion.section>

        {/* Section B — Saved Recipes */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader
            className="col-span-12"
            kicker="02"
            title="Saved Recipes"
            subtitle={`(${recipes.length})`}
          />
          {recipes.length === 0 ? (
            <div className="col-span-12 text-ink-soft font-display italic text-lg">
              No recipes saved yet.
            </div>
          ) : (
            <ul className="col-span-12 divide-y divide-rule border-y border-rule">
              {recipes.map((recipe) => (
                <li
                  key={recipe.id}
                  className="flex justify-between items-start p-4 hover:bg-paper-muted transition"
                >
                  <div className="flex-1">
                    <p className="font-display text-lg text-ink">{recipe.name}</p>
                    <p className="text-sm text-ink-soft truncate max-w-md mt-1">
                      {recipe.description}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon mt-2">
                      {recipe.totalCalories.toLocaleString()} kcal · {recipe.ingredients.length}{" "}
                      ingredient(s)
                    </p>
                  </div>
                  <button
                    onClick={() => recipe.id && deleteRecipe(recipe.id)}
                    className="font-mono text-[10px] uppercase tracking-wider text-destructive hover:text-destructive/80 transition flex-shrink-0 ml-4"
                    aria-label={`Delete recipe ${recipe.name}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Recipes;

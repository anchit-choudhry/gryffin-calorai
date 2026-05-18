import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type Recipe, saveRecipe, updateRecipe } from "../db/dbService";
import { FoodItemId, type UserId } from "@/types";
import { RecipeFormSchema, type RecipeFormValues } from "../forms/schemas";
import { useAppState } from "../state/AppState";

type UseRecipeFormReturn = {
  form: ReturnType<typeof useForm<RecipeFormValues>>;
  fields: ReturnType<typeof useFieldArray<RecipeFormValues, "ingredients">>["fields"];
  append: ReturnType<typeof useFieldArray<RecipeFormValues, "ingredients">>["append"];
  remove: ReturnType<typeof useFieldArray<RecipeFormValues, "ingredients">>["remove"];
  isLoading: boolean;
  saveRecipeForm: () => Promise<boolean>;
  mode: "create" | "edit";
};

export function useRecipeForm(userId: UserId | null, initialRecipe?: Recipe): UseRecipeFormReturn {
  const mode: "create" | "edit" = initialRecipe ? "edit" : "create";
  const [isLoading, setIsLoading] = useState(false);
  const { checkAndUnlockAchievements, allFoodItems } = useAppState();

  const computedDefaults: RecipeFormValues = initialRecipe
    ? {
        recipeName: initialRecipe.name,
        description: initialRecipe.description,
        ingredients: initialRecipe.ingredients.map((ing) => {
          const foodItem = allFoodItems.find((fi) => fi.id === ing.foodItemId);
          return {
            foodItemId: Number(ing.foodItemId),
            foodItemName: foodItem?.name ?? "",
            calories: foodItem?.calories ?? 0,
            quantity: ing.quantity,
            serving: ing.serving,
          };
        }),
      }
    : { recipeName: "", description: "", ingredients: [] };

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeFormSchema),
    mode: "onBlur",
    defaultValues: computedDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const saveRecipeForm = async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not initialized. Please refresh the page.");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      form.handleSubmit(
        async (data) => {
          setIsLoading(true);
          try {
            const totalCalories = data.ingredients.reduce(
              (acc, ing) => acc + ing.calories * ing.quantity * ing.serving,
              0,
            );

            const mappedIngredients = data.ingredients.map(({ foodItemId, quantity, serving }) => ({
              foodItemId: FoodItemId(foodItemId),
              quantity,
              serving,
            }));

            if (mode === "edit" && initialRecipe) {
              await updateRecipe(
                {
                  ...initialRecipe,
                  name: data.recipeName,
                  description: data.description,
                  ingredients: mappedIngredients,
                  totalCalories,
                },
                userId,
              );
              toast.success(`Recipe "${data.recipeName}" updated successfully!`);
            } else {
              await saveRecipe({
                name: data.recipeName,
                description: data.description,
                ingredients: mappedIngredients,
                totalCalories,
                createdBy: userId,
                dateCreated: new Date().toISOString(),
                userId,
              });
              toast.success(`Recipe "${data.recipeName}" saved successfully!`);
              form.reset();
            }

            void checkAndUnlockAchievements();
            resolve(true);
          } catch (error) {
            if (import.meta.env.DEV) console.error("Error saving recipe:", error);
            toast.error("Failed to save recipe. Check console for details.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          const errors = form.formState.errors;
          const firstMsg =
            errors.recipeName?.message ??
            errors.description?.message ??
            errors.ingredients?.root?.message ??
            "Please fix the errors above.";
          toast.error(firstMsg);
          resolve(false);
        },
      )();
    });
  };

  return { form, fields, append, remove, isLoading, saveRecipeForm, mode };
}

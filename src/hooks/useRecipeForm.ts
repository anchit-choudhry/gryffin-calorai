import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveRecipe } from "../db/dbService";
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
};

export function useRecipeForm(userId: UserId | null): UseRecipeFormReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { checkAndUnlockAchievements } = useAppState();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: { recipeName: "", description: "", ingredients: [] },
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

            await saveRecipe({
              name: data.recipeName,
              description: data.description,
              ingredients: data.ingredients.map(({ foodItemId, quantity, serving }) => ({
                foodItemId: FoodItemId(foodItemId),
                quantity,
                serving,
              })),
              totalCalories,
              createdBy: userId,
              dateCreated: new Date().toISOString(),
              userId,
            });

            toast.success(`Recipe "${data.recipeName}" saved successfully!`);
            form.reset();
            void checkAndUnlockAchievements();
            resolve(true);
          } catch (error) {
            console.error("Error saving recipe:", error);
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

  return { form, fields, append, remove, isLoading, saveRecipeForm };
}

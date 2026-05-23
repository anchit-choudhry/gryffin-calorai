import type { FC, FormEvent } from "react";
import type { Recipe } from "@/db/dbService";
import { useAppState } from "@/state/AppState";
import { useRecipeForm } from "@/hooks/useRecipeForm";
import { useRecipeImport } from "@/hooks/useRecipeImport";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";
import IngredientRow from "./IngredientRow";

interface Props {
  initialRecipe?: Recipe;
  onSuccess?: () => void;
}

const RecipeForm: FC<Props> = ({ initialRecipe, onSuccess }) => {
  const { userId, allFoodItems } = useAppState();
  const { form, fields, append, remove, isLoading, saveRecipeForm, mode } = useRecipeForm(
    userId,
    initialRecipe,
  );
  const {
    url,
    setUrl,
    isLoading: isImporting,
    error: importError,
    importedRecipe,
    importFromUrl,
  } = useRecipeImport(allFoodItems);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await saveRecipeForm();
    if (ok) onSuccess?.();
  };

  const handleImport = () => {
    void importFromUrl();
  };

  return (
    <div className="space-y-6">
      <div className="border border-rule p-4 space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Import from URL
        </p>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a recipe URL to auto-fill..."
            className={cn(EDITORIAL_INPUT_CLS, "flex-1")}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!url.trim() || isImporting}
            onClick={handleImport}
            className="font-mono text-[11px] uppercase tracking-wider rounded-none shrink-0"
          >
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </div>
        {importError && <p className="text-xs text-red-500">{importError}</p>}
        {importedRecipe && (
          <p className="text-xs text-green-600">
            Imported: &ldquo;{importedRecipe.name}&rdquo; - review and save below.
          </p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="recipeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  Recipe Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., High Protein Breakfast"
                    className={EDITORIAL_INPUT_CLS}
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
                    placeholder="Briefly describe the meal's purpose."
                    className={cn(EDITORIAL_INPUT_CLS, "resize-none w-full block")}
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
              <IngredientRow
                key={field.id}
                field={field}
                index={index}
                form={form}
                allFoodItems={allFoodItems}
                onRemove={() => remove(index)}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                append({ foodItemId: 0, foodItemName: "", calories: 0, quantity: 1, serving: 1 })
              }
              className="w-full border border-dashed border-rule text-ink-soft hover:border-ink hover:text-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              + Add Ingredient
            </button>
          </div>

          <Button
            type="submit"
            variant="persimmon"
            disabled={isLoading}
            className="font-mono text-sm rounded-none h-auto w-full px-4 py-3"
          >
            {isLoading ? "Saving..." : mode === "edit" ? "Update Recipe" : "Save Recipe"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RecipeForm;

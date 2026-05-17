import type { FC } from "react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import type { FoodItem } from "@/db/dbService";
import type { RecipeFormValues } from "@/forms/schemas";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";

interface Props {
  field: FieldArrayWithId<RecipeFormValues, "ingredients">;
  index: number;
  form: UseFormReturn<RecipeFormValues>;
  allFoodItems: FoodItem[];
  onRemove: () => void;
}

const IngredientRow: FC<Props> = ({ field, index, form, allFoodItems, onRemove }) => {
  const watchedIngredients = form.watch("ingredients");

  return (
    <div className="group flex gap-2 items-center border border-rule p-3 bg-paper-raised">
      <div className="relative flex-1">
        <input
          type="text"
          list={`food-items-${field.id}`}
          placeholder="Search food item..."
          value={watchedIngredients?.[index]?.foodItemName ?? ""}
          onChange={(e) => {
            const name = e.target.value;
            form.setValue(`ingredients.${index}.foodItemName`, name);
            const match = allFoodItems.find((fi) => fi.name.toLowerCase() === name.toLowerCase());
            if (match && match.id != null) {
              form.setValue(`ingredients.${index}.foodItemId`, match.id);
              form.setValue(`ingredients.${index}.foodItemName`, match.name);
              form.setValue(`ingredients.${index}.calories`, match.calories);
            }
          }}
          className={cn(EDITORIAL_INPUT_CLS, "w-full text-sm")}
        />
        <datalist id={`food-items-${field.id}`}>
          {allFoodItems.map((fi) => (
            <option key={fi.id} value={fi.name} />
          ))}
        </datalist>
      </div>
      <input
        type="number"
        placeholder="Qty"
        aria-label="Ingredient quantity"
        {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
        className={cn(EDITORIAL_INPUT_CLS, "w-16 text-sm")}
      />
      <input
        type="number"
        placeholder="Srv"
        aria-label="Ingredient serving size"
        {...form.register(`ingredients.${index}.serving`, { valueAsNumber: true })}
        className={cn(EDITORIAL_INPUT_CLS, "w-16 text-sm")}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove ingredient"
        className="text-ink-soft hover:text-persimmon transition-colors opacity-0 group-hover:opacity-100 font-mono text-sm ml-1 flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
};

export default IngredientRow;

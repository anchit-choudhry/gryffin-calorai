import { Pencil, X } from "lucide-react";
import type { Recipe } from "@/db/dbService";
import type { RecipeId } from "@/types";

interface Props {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: RecipeId) => void;
}

const iconBtn =
  "flex items-center justify-center size-9 rounded hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1";

function RecipeRow({ recipe, onEdit, onDelete }: Props) {
  return (
    <li className="group flex justify-between items-start p-4 hover:bg-paper-muted transition">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-base font-semibold text-ink">{recipe.name}</p>
        <p className="text-sm text-ink-soft truncate max-w-md mt-1">{recipe.description}</p>
        <p className="text-xs text-persimmon mt-2">
          {recipe.totalCalories.toLocaleString()} kcal &middot; {recipe.ingredients.length}{" "}
          ingredient(s)
        </p>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(recipe)}
          aria-label={`Edit recipe ${recipe.name}`}
          className={iconBtn}
        >
          <Pencil className="size-3.5 text-ink-soft" />
        </button>
        <button
          onClick={() => recipe.id && onDelete(recipe.id)}
          aria-label={`Delete recipe ${recipe.name}`}
          className={iconBtn}
        >
          <X className="size-3.5 text-ink-soft hover:text-persimmon" />
        </button>
      </div>
    </li>
  );
}

RecipeRow.displayName = "RecipeRow";

export default RecipeRow;

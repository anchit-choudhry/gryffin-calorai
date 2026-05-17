import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Recipe } from "@/db/dbService";
import type { RecipeId } from "@/types";

interface Props {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: RecipeId) => void;
}

function RecipeRow({ recipe, onEdit, onDelete }: Props) {
  const [pendingDelete, setPendingDelete] = useState(false);

  return (
    <li className="group flex justify-between items-start p-4 hover:bg-paper-muted transition">
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg text-ink">{recipe.name}</p>
        <p className="text-sm text-ink-soft truncate max-w-md mt-1">{recipe.description}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon mt-2">
          {recipe.totalCalories.toLocaleString()} kcal &middot; {recipe.ingredients.length}{" "}
          ingredient(s)
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {pendingDelete ? (
          <>
            <button
              onClick={() => {
                if (recipe.id) onDelete(recipe.id);
                setPendingDelete(false);
              }}
              className="px-1.5 py-0.5 bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Delete
            </button>
            <button
              onClick={() => setPendingDelete(false)}
              aria-label="Cancel delete"
              className="font-mono text-[9px] text-ink-soft hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(recipe)}
              aria-label={`Edit recipe ${recipe.name}`}
              className="text-ink-soft hover:text-ink transition-colors opacity-0 group-hover:opacity-100"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => setPendingDelete(true)}
              aria-label={`Delete recipe ${recipe.name}`}
              className="text-ink-soft hover:text-persimmon transition-colors opacity-0 group-hover:opacity-100 font-mono text-sm"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </li>
  );
}

RecipeRow.displayName = "RecipeRow";

export default RecipeRow;

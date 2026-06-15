import { Pencil, X } from "lucide-react";
import type { Recipe } from "@/db/dbService";
import type { RecipeId } from "@/types";

interface Props {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: RecipeId) => void;
}

const iconBtn =
  "flex items-center justify-center size-11 rounded-none hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-1";

function RecipeRow({ recipe, onEdit, onDelete }: Props) {
  return (
    <li className="group flex justify-between items-start p-4 hover:bg-paper-muted transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-1 min-w-0">
          <p className="font-sans text-base font-semibold text-ink shrink-0 max-w-[60%]">
            {recipe.name}
          </p>
          <span
            className="flex-1 self-end border-b border-dotted border-rule/40 mb-[3px] min-w-[8px]"
            aria-hidden="true"
          />
          <span className="font-sans text-sm font-semibold tabular-nums text-persimmon shrink-0">
            {recipe.totalCalories.toLocaleString()}
            <span className="font-mono text-[10px] text-ink-soft ml-1">kcal</span>
          </span>
        </div>
        <p className="text-sm text-ink-soft truncate max-w-md mt-1">{recipe.description}</p>
        <p className="text-xs text-ink-soft/70 mt-1">{recipe.ingredients.length} ingredient(s)</p>
        {recipe.totalProtein !== undefined && (
          <p className="text-xs text-ink-soft/70 mt-1">
            {Math.round(recipe.totalProtein)}g P &middot; {Math.round(recipe.totalCarbs ?? 0)}g C
            &middot; {Math.round(recipe.totalFat ?? 0)}g F
          </p>
        )}
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

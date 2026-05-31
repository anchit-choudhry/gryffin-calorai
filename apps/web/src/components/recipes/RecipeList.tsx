import type { FC } from "react";
import type { Recipe } from "@/db/dbService";
import type { RecipeId } from "@/types";
import RecipeRow from "./RecipeRow";
import { EmptyState } from "@/components/EmptyState";
import { RecipeBook } from "@/components/illustrations";

interface Props {
  recipes: Recipe[];
  isLoading?: boolean;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: RecipeId) => void;
}

const RecipeList: FC<Props> = ({ recipes, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <ul className="divide-y divide-rule border-y border-rule animate-pulse">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="p-4 space-y-2">
            <div className="h-5 w-1/3 bg-paper-muted" />
            <div className="h-3 w-2/3 bg-paper-muted/60" />
            <div className="h-2 w-1/4 bg-paper-muted/40" />
          </li>
        ))}
      </ul>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="border border-rule">
        <EmptyState
          illustration={<RecipeBook className="w-full h-full" />}
          eyebrow="Recipe Collection"
          heading="No recipes saved yet"
          body="Write your first recipe using the form above - add ingredients, portions, and save for quick logging."
          variant="illustrated"
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-rule border-y border-rule @container">
      {recipes.map((recipe) => (
        <RecipeRow key={recipe.id} recipe={recipe} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
};

export default RecipeList;

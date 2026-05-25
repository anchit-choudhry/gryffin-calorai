import { useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import SectionHeader from "../components/dashboard/SectionHeader";
import EditorialFrame from "../components/dashboard/EditorialFrame";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pageVariants, useSectionMotion } from "../lib/motionVariants";
import RecipesHero from "@/components/recipes/RecipesHero";
import RecipeForm from "@/components/recipes/RecipeForm";
import RecipeList from "@/components/recipes/RecipeList";
import { type Recipe, saveRecipe } from "@/db/dbService";
import type { RecipeId } from "@/types";
import { Input } from "@/components/ui/input";
import { EDITORIAL_INPUT_CLS } from "@/lib/utils";

const Recipes = () => {
  const { recipes, deleteRecipe, fetchRecipes, userId } = useAppState();
  const shouldReduceMotion = useReducedMotion();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = useMemo(
    () =>
      searchQuery.trim()
        ? recipes.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : recipes,
    [recipes, searchQuery],
  );

  const handleDeleteRecipeWithUndo = useCallback(
    async (id: RecipeId) => {
      const item = recipes.find((r) => r.id === id);
      await deleteRecipe(id);
      if (item && userId) {
        toast("Recipe removed", {
          action: {
            label: "Undo",
            onClick: async () => {
              await saveRecipe(item);
              await fetchRecipes(userId);
            },
          },
        });
      }
    },
    [recipes, deleteRecipe, fetchRecipes, userId],
  );

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: pageVariants, initial: "hidden", animate: "show" };
  const sv = useSectionMotion();

  return (
    <div className="bg-paper text-ink font-sans min-h-[calc(100vh-4rem)]">
      <motion.main
        className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14"
        {...motionProps}
      >
        {/* Hero */}
        <motion.section className="col-span-12" {...sv}>
          <RecipesHero recipes={recipes} />
        </motion.section>

        {/* Recipe Manager */}
        <motion.section
          data-tour-id="recipes-form"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader className="col-span-12" title="Recipe Manager" accent />
          <div className="col-span-12 md:col-span-8">
            <EditorialFrame label="Compose">
              <RecipeForm />
            </EditorialFrame>
          </div>
        </motion.section>

        {/* Saved Recipes */}
        <motion.section
          data-tour-id="recipes-list"
          className="col-span-12 grid grid-cols-12 gap-6"
          {...sv}
        >
          <SectionHeader
            className="col-span-12"
            title="Saved Recipes"
            subtitle={`(${recipes.length})`}
          />
          <div className="col-span-12">
            <Input
              className={EDITORIAL_INPUT_CLS + " mb-4 max-w-sm"}
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search recipes"
            />
            <RecipeList
              recipes={filteredRecipes}
              onEdit={setEditingRecipe}
              onDelete={handleDeleteRecipeWithUndo}
            />
          </div>
        </motion.section>
      </motion.main>

      {/* Edit Dialog */}
      <Dialog
        open={editingRecipe !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRecipe(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold">Edit Recipe</DialogTitle>
          </DialogHeader>
          {editingRecipe && (
            <RecipeForm initialRecipe={editingRecipe} onSuccess={() => setEditingRecipe(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;

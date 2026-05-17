import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAppState } from "../state/AppState";
import SectionHeader from "../components/dashboard/SectionHeader";
import EditorialFrame from "../components/dashboard/EditorialFrame";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pageVariants, sectionVariants } from "../lib/motionVariants";
import RecipesHero from "@/components/recipes/RecipesHero";
import RecipeForm from "@/components/recipes/RecipeForm";
import RecipeList from "@/components/recipes/RecipeList";
import type { Recipe } from "@/db/dbService";

const Recipes = () => {
  const { recipes, deleteRecipe } = useAppState();
  const shouldReduceMotion = useReducedMotion();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

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
        {/* Hero */}
        <motion.section className="col-span-12" {...sv}>
          <RecipesHero recipes={recipes} />
        </motion.section>

        {/* Section 01 - Compose */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader className="col-span-12" kicker="01" title="Recipe Manager" accent />
          <div className="col-span-12 md:col-span-8">
            <EditorialFrame label="01 · Compose">
              <RecipeForm />
            </EditorialFrame>
          </div>
        </motion.section>

        {/* Section 02 - Saved Recipes */}
        <motion.section className="col-span-12 grid grid-cols-12 gap-6" {...sv}>
          <SectionHeader
            className="col-span-12"
            kicker="02"
            title="Saved Recipes"
            subtitle={`(${recipes.length})`}
          />
          <div className="col-span-12">
            <RecipeList
              recipes={recipes}
              onEdit={setEditingRecipe}
              onDelete={(id) => void deleteRecipe(id)}
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
            <DialogTitle className="font-display text-2xl">Edit Recipe</DialogTitle>
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

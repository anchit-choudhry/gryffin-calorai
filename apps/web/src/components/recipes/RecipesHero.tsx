import { useEffect, useMemo } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { Recipe } from "@/db/dbService";
import { motionTokens } from "@/lib/motionVariants";

interface Props {
  recipes: Recipe[];
}

function RecipesHero({ recipes }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => Math.round(v).toLocaleString());

  const totalRecipes = recipes.length;

  const avgCalories = useMemo(() => {
    if (recipes.length === 0) return 0;
    return Math.round(recipes.reduce((acc, r) => acc + r.totalCalories, 0) / recipes.length);
  }, [recipes]);

  const lastSaved = useMemo(() => {
    if (recipes.length === 0) return null;
    const sorted = [...recipes].sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));
    return sorted[0]?.dateCreated ?? null;
  }, [recipes]);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(totalRecipes);
      return;
    }
    const controls = animate(count, totalRecipes, {
      duration: motionTokens.durEntrance,
      ease: motionTokens.easeOutExpo,
    });
    return () => controls.stop();
  }, [totalRecipes, shouldReduceMotion, count]);

  return (
    <div className="hero-wash -mx-6 md:-mx-10 lg:-mx-14 px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-6 mb-2">
      {/* Hero numeral */}
      <div className="col-span-12 md:col-span-8">
        <div className="flex items-start">
          <motion.span
            className="font-display font-light text-[clamp(72px,11vw,180px)] leading-[0.85] tabular-nums tracking-tight text-ink"
            aria-label={`${totalRecipes} saved recipes`}
          >
            {displayCount}
          </motion.span>
          <span className="font-sans text-xs text-ink-soft self-start mt-3 ml-3">recipes</span>
        </div>
        <div className="flex items-baseline flex-wrap gap-6 mt-3">
          <span className="text-xs text-ink-soft">
            {avgCalories > 0 ? `${avgCalories.toLocaleString()} avg kcal` : "no recipes yet"}
          </span>
          {lastSaved && (
            <span className="text-xs text-ink-soft">
              Last saved{" "}
              {new Date(lastSaved).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="col-span-12 md:col-span-3 md:col-start-10 flex flex-col justify-end pb-2">
        <p className="text-sm text-ink-soft">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

RecipesHero.displayName = "RecipesHero";

export default RecipesHero;

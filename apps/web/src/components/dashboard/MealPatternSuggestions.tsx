import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/state/AppState";
import { todayISO } from "@/types";
import type { MealPattern } from "@/lib/mealPatterns";
import { getCurrentMealType, getMealSuggestions } from "@/lib/mealPatterns";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";

const MAX_SUGGESTIONS = 4;

export function MealPatternSuggestions() {
  const { allFoodItems, addFoodLog, userId } = useAppState();

  const currentMealType = getCurrentMealType();
  const suggestions = getMealSuggestions(allFoodItems, currentMealType).slice(0, MAX_SUGGESTIONS);

  if (!userId || suggestions.length === 0) return null;

  const handleLog = async (s: MealPattern) => {
    await addFoodLog({
      userId,
      name: s.name,
      calories: s.calories,
      servingSize: s.servingSize,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      dateLogged: todayISO(),
      isFavorite: false,
      mealType: s.mealType,
    });
    toast.success(`Logged ${s.name}`);
  };

  return (
    <div>
      <p className={cn(LABEL_MONO_CLS, "mb-2 text-ink-soft")}>Usually at {currentMealType}</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={`${s.name}|${s.mealType}`}
            type="button"
            aria-label={`Log ${s.name}`}
            onClick={() => void handleLog(s)}
            className="flex items-center gap-1.5 border border-rule px-3 py-1.5 transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <RotateCcw className="size-3 shrink-0 text-persimmon" aria-hidden="true" />
            <span className={cn(LABEL_MONO_CLS, "text-ink")}>{s.name}</span>
            <span className="font-mono text-[10px] text-ink-soft">{s.calories}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

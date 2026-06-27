import { useState } from "react";
import type { JSX } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "@/lib/utils";
import { useAppState } from "@/state/AppState";
import type { RecognizedFoodItem } from "@/lib/aiLoggingApi";
import type { MealType } from "@/types";
import { MEAL_TYPES } from "@/types";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface FoodReviewDraft {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  mealType: MealType;
}

interface FoodReviewRowProps {
  item: RecognizedFoodItem;
  captureMethod: "photo_ai" | "text_ai" | "voice_ai";
  onRemove: () => void;
  onLogged: () => void;
}

export function FoodReviewRow({
  item,
  captureMethod,
  onRemove,
  onLogged,
}: FoodReviewRowProps): JSX.Element {
  const addFoodLog = useAppState((s) => s.addFoodLog);
  const userId = useAppState((s) => s.userId);
  const selectedDate = useAppState((s) => s.selectedDate);

  const rowId = item.offProductId ?? item.name.replace(/\s+/g, "-");

  const [draft, setDraft] = useState<FoodReviewDraft>({
    name: item.name,
    calories: item.calories !== undefined ? String(item.calories) : "",
    protein: item.protein !== undefined ? String(item.protein) : "",
    carbs: item.carbs !== undefined ? String(item.carbs) : "",
    fat: item.fat !== undefined ? String(item.fat) : "",
    mealType: "Breakfast",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const canLog = draft.name.trim().length > 0 && draft.calories.trim().length > 0 && !isLogging;

  const handleLog = async (): Promise<void> => {
    if (!userId) return;
    const calories = parseInt(draft.calories, 10);
    if (!draft.name.trim() || isNaN(calories) || calories <= 0) {
      setError("Food name and calories are required.");
      return;
    }
    setIsLogging(true);
    setError(null);
    try {
      await addFoodLog({
        name: draft.name.trim(),
        calories,
        servingSize: 1,
        protein: draft.protein !== "" ? parseFloat(draft.protein) || undefined : undefined,
        carbs: draft.carbs !== "" ? parseFloat(draft.carbs) || undefined : undefined,
        fat: draft.fat !== "" ? parseFloat(draft.fat) || undefined : undefined,
        dateLogged: selectedDate,
        userId,
        isFavorite: false,
        mealType: draft.mealType,
        captureMethod,
      });
      toast(`Logged ${draft.name.trim()}`);
      onLogged();
    } catch {
      setError("Failed to log food. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-3 border-b border-rule pb-4">
      <div className="flex items-center gap-2">
        <ProvenanceBadge method={captureMethod} />
        {item.source === "off_match" && (
          <span className="font-mono text-[9px] text-ink-soft/60">
            {Math.round(item.confidence * 100)}% match
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-destructive"
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label htmlFor={`review-name-${rowId}`} className={LABEL_MONO_CLS}>
            Food name
          </label>
          <Input
            id={`review-name-${rowId}`}
            type="text"
            value={draft.name}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, name: e.target.value }));
              setError(null);
            }}
            className={EDITORIAL_INPUT_CLS}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`review-cal-${rowId}`} className={LABEL_MONO_CLS}>
              Calories
              {item.source === "estimate" && <span className="text-persimmon"> *</span>}
            </label>
            <Input
              id={`review-cal-${rowId}`}
              type="number"
              min="0"
              value={draft.calories}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, calories: e.target.value }));
                setError(null);
              }}
              placeholder={item.source === "estimate" ? "Enter calories" : "0"}
              className={EDITORIAL_INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor={`review-meal-${rowId}`} className={LABEL_MONO_CLS}>
              Meal
            </label>
            <select
              id={`review-meal-${rowId}`}
              value={draft.mealType}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, mealType: e.target.value as MealType }))
              }
              className={cn(
                EDITORIAL_INPUT_CLS,
                "h-9 w-full appearance-none bg-paper px-3 cursor-pointer",
              )}
            >
              {MEAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {item.source === "estimate" && (
          <p className="font-mono text-[9px] text-ink-soft/60">
            No database match - please verify calories
          </p>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="font-mono text-[9px] text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={() => void handleLog()}
        disabled={!canLog}
        className="w-full rounded-none font-mono text-[10px] uppercase tracking-[0.15em]"
      >
        {isLogging ? "Logging..." : "Log this food"}
      </Button>
    </div>
  );
}

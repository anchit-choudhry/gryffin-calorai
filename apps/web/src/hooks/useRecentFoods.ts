import { useEffect, useState } from "react";
import type { FoodItem } from "@/db/dbService";
import { getRecentFoodItems } from "@/db/dbService";
import { useAppState } from "@/state/AppState";

const DAYS_BACK = 14;

export function useRecentFoods(): FoodItem[] {
  const userId = useAppState((s) => s.userId);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    getRecentFoodItems(userId, DAYS_BACK)
      .then((items) => {
        // Deduplicate by name, keeping the most recent entry.
        const seen = new Set<string>();
        const unique: FoodItem[] = [];
        for (const item of items.reverse()) {
          const key = item.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        setRecentFoods(unique);
      })
      .catch(() => {
        // Non-critical: combobox falls back to empty corpus silently.
      });
  }, [userId]);

  return recentFoods;
}

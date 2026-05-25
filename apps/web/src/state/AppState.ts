import { create } from "zustand";
import { createActivitySlice, type ActivitySlice } from "./slices/activitySlice";
import { createBodySlice, type BodySlice } from "./slices/bodySlice";
import { createCoreSlice, type CoreSlice } from "./slices/coreSlice";
import { createFoodSlice, type FoodSlice } from "./slices/foodSlice";
import { createRecipeSlice, type RecipeSlice } from "./slices/recipeSlice";
import { createSettingsSlice, type SettingsSlice } from "./slices/settingsSlice";
import { createTrackerSlice, type TrackerSlice } from "./slices/trackerSlice";

export type AppState = CoreSlice &
  FoodSlice &
  RecipeSlice &
  TrackerSlice &
  BodySlice &
  ActivitySlice &
  SettingsSlice;

export const useAppState = create<AppState>((...a) => ({
  ...createCoreSlice(...a),
  ...createFoodSlice(...a),
  ...createRecipeSlice(...a),
  ...createTrackerSlice(...a),
  ...createBodySlice(...a),
  ...createActivitySlice(...a),
  ...createSettingsSlice(...a),
}));

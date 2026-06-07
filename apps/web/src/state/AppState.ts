import { create } from "zustand";
import { type ActivitySlice, createActivitySlice } from "./slices/activitySlice";
import { type BodySlice, createBodySlice } from "./slices/bodySlice";
import { type CoreSlice, createCoreSlice } from "./slices/coreSlice";
import { createFoodSlice, type FoodSlice } from "./slices/foodSlice";
import { createRecipeSlice, type RecipeSlice } from "./slices/recipeSlice";
import { createSettingsSlice, type SettingsSlice } from "./slices/settingsSlice";
import { createSyncSlice, type SyncSlice } from "./slices/syncSlice";
import { createTrackerSlice, type TrackerSlice } from "./slices/trackerSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";

export type AppState = CoreSlice &
  FoodSlice &
  RecipeSlice &
  TrackerSlice &
  BodySlice &
  ActivitySlice &
  SettingsSlice &
  SyncSlice &
  UiSlice;

export const useAppState = create<AppState>((...a) => ({
  ...createCoreSlice(...a),
  ...createFoodSlice(...a),
  ...createRecipeSlice(...a),
  ...createTrackerSlice(...a),
  ...createBodySlice(...a),
  ...createActivitySlice(...a),
  ...createSettingsSlice(...a),
  ...createSyncSlice(...a),
  ...createUiSlice(...a),
}));

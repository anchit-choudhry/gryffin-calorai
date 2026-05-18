export type TourPage = "dashboard" | "recipes" | "progress";
export type TourPlacement = "below" | "above" | "auto";

export interface TourStep {
  id: string;
  page: TourPage;
  targetId: string;
  title: string;
  body: string;
  isFirst?: boolean;
  placement?: TourPlacement;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard-hero",
    page: "dashboard",
    targetId: "dashboard-hero",
    title: "Today at a glance",
    body: "Your calorie ring and macros for today. The ring fills as you log meals.",
    isFirst: true,
    placement: "below",
  },
  {
    id: "dashboard-add",
    page: "dashboard",
    targetId: "dashboard-add",
    title: "Log a meal three ways",
    body: "Type it, scan a barcode, or speak it. Macros and meal type are inferred.",
    placement: "above",
  },
  {
    id: "dashboard-week",
    page: "dashboard",
    targetId: "dashboard-week",
    title: "Streaks, water, and steps",
    body: "Hydration and movement count too. Tap to log; goals are in settings.",
    placement: "below",
  },
  {
    id: "dashboard-log",
    page: "dashboard",
    targetId: "dashboard-log",
    title: "Today's log, by meal",
    body: "Everything you logged today, grouped by Breakfast, Lunch, Snacks, Dinner.",
    placement: "above",
  },
  {
    id: "recipes-form",
    page: "recipes",
    targetId: "recipes-form",
    title: "Save recipes you cook often",
    body: "Build a recipe once. Log it later in one tap from the pantry.",
    placement: "below",
  },
  {
    id: "recipes-list",
    page: "recipes",
    targetId: "recipes-list",
    title: "Your recipe book",
    body: "Edit, favorite, or delete anything you've saved.",
    placement: "above",
  },
  {
    id: "progress-calorie",
    page: "progress",
    targetId: "progress-calorie",
    title: "See your trend",
    body: "Calories, macros, water, and weight over 7 or 30 days.",
    placement: "below",
  },
  {
    id: "progress-achievements",
    page: "progress",
    targetId: "progress-achievements",
    title: "Achievements",
    body: "Streaks and milestones unlock automatically as you log. Keep going.",
    placement: "above",
  },
];

export const TOUR_TOTAL_STEPS = TOUR_STEPS.length;

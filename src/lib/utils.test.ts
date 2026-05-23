import { describe, expect, it } from "vitest";
import { cn, groupLogsByMeal, mapDbError, normalizeHash } from "./utils";
import { FoodItemId, ISODate, type MealType, UserId } from "@/types";
import type { FoodItem } from "../db/dbService";
import { Dexie } from "dexie";

describe("cn", () => {
  it("should merge tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toContain("px-4");
    expect(result).toContain("py-1");
  });

  it("should handle undefined values", () => {
    const result = cn("px-2", undefined, "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should handle false values", () => {
    const result = cn("px-2", (false as boolean) && "px-4", "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should handle empty strings", () => {
    const result = cn("px-2", "", "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should handle object class values", () => {
    const result = cn({
      "px-2": true,
      "py-1": true,
      "text-red": false,
    });
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should handle array class values", () => {
    const result = cn(["px-2", "py-1"], "text-sm");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).toContain("text-sm");
  });

  it("should resolve tailwind conflicts", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toContain("text-blue-500");
    expect(result).not.toContain("text-red-500");
  });
});

describe("groupLogsByMeal", () => {
  const createFoodItem = (mealType: MealType, name: string, id: number = 1): FoodItem => ({
    id: FoodItemId(id),
    userId: UserId("test-user"),
    name,
    calories: 100,
    servingSize: 1,
    protein: 10,
    carbs: 20,
    fat: 5,
    dateLogged: ISODate("2026-05-16"),
    isFavorite: false,
    mealType,
  });

  it("should group items by meal type", () => {
    const items = [
      createFoodItem("Breakfast", "Oatmeal", 1),
      createFoodItem("Lunch", "Sandwich", 2),
      createFoodItem("Breakfast", "Egg", 3),
    ];

    const grouped = groupLogsByMeal(items);

    const breakfast = grouped.find((g) => g.meal === "Breakfast");
    expect(breakfast?.items).toHaveLength(2);
    expect(breakfast?.items[0]?.name).toBe("Oatmeal");
    expect(breakfast?.items[1]?.name).toBe("Egg");

    const lunch = grouped.find((g) => g.meal === "Lunch");
    expect(lunch?.items).toHaveLength(1);
    expect(lunch?.items[0]?.name).toBe("Sandwich");
  });

  it("should exclude meal types with no items", () => {
    const items = [createFoodItem("Breakfast", "Toast", 1)];
    const grouped = groupLogsByMeal(items);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.meal).toBe("Breakfast");
  });

  it("should return empty array for empty input", () => {
    const grouped = groupLogsByMeal([]);
    expect(grouped).toHaveLength(0);
  });

  it("should include all four meal types when all have items", () => {
    const items = [
      createFoodItem("Breakfast", "Toast", 1),
      createFoodItem("Lunch", "Sandwich", 2),
      createFoodItem("Snacks", "Apple", 3),
      createFoodItem("Dinner", "Pasta", 4),
    ];

    const grouped = groupLogsByMeal(items);
    expect(grouped).toHaveLength(4);

    const mealTypes = grouped.map((g) => g.meal);
    expect(mealTypes).toContain("Breakfast");
    expect(mealTypes).toContain("Lunch");
    expect(mealTypes).toContain("Snacks");
    expect(mealTypes).toContain("Dinner");
  });

  it("should maintain order of meal types", () => {
    const items = [
      createFoodItem("Dinner", "Pasta", 1),
      createFoodItem("Breakfast", "Toast", 2),
      createFoodItem("Lunch", "Sandwich", 3),
      createFoodItem("Snacks", "Apple", 4),
    ];

    const grouped = groupLogsByMeal(items);
    expect(grouped[0]?.meal).toBe("Breakfast");
    expect(grouped[1]?.meal).toBe("Lunch");
    expect(grouped[2]?.meal).toBe("Snacks");
    expect(grouped[3]?.meal).toBe("Dinner");
  });

  it("should preserve order of items within meal groups", () => {
    const items = [
      createFoodItem("Breakfast", "Toast", 1),
      createFoodItem("Breakfast", "Egg", 2),
      createFoodItem("Breakfast", "Orange", 3),
    ];

    const grouped = groupLogsByMeal(items);
    const breakfast = grouped.find((g) => g.meal === "Breakfast");
    expect(breakfast?.items[0]?.name).toBe("Toast");
    expect(breakfast?.items[1]?.name).toBe("Egg");
    expect(breakfast?.items[2]?.name).toBe("Orange");
  });

  it("should handle duplicate meal types in input", () => {
    const items = [
      createFoodItem("Breakfast", "Toast", 1),
      createFoodItem("Lunch", "Sandwich", 2),
      createFoodItem("Breakfast", "Egg", 3),
      createFoodItem("Breakfast", "Orange", 4),
      createFoodItem("Lunch", "Soup", 5),
    ];

    const grouped = groupLogsByMeal(items);
    const breakfast = grouped.find((g) => g.meal === "Breakfast");
    const lunch = grouped.find((g) => g.meal === "Lunch");

    expect(breakfast?.items).toHaveLength(3);
    expect(lunch?.items).toHaveLength(2);
  });

  it("should exclude logs with undefined mealType from all groups", () => {
    const items = [
      createFoodItem("Breakfast", "Toast", 1),
      {
        id: FoodItemId(2),
        userId: UserId("test-user"),
        name: "Mystery",
        calories: 100,
        servingSize: 1,
        protein: 10,
        carbs: 20,
        fat: 5,
        dateLogged: ISODate("2026-05-16"),
        isFavorite: false,
        mealType: undefined as unknown as MealType,
      },
      createFoodItem("Lunch", "Sandwich", 3),
    ];

    const grouped = groupLogsByMeal(items);

    const breakfast = grouped.find((g) => g.meal === "Breakfast");
    const lunch = grouped.find((g) => g.meal === "Lunch");

    expect(breakfast?.items).toHaveLength(1);
    expect(lunch?.items).toHaveLength(1);
    expect(grouped.every((g) => g.items.every((item) => item.mealType !== undefined))).toBe(true);
  });
});

describe("normalizeHash", () => {
  it("should return dashboard for empty string", () => {
    expect(normalizeHash("")).toBe("#dashboard");
  });

  it("should return dashboard for invalid hash", () => {
    expect(normalizeHash("#invalid")).toBe("#dashboard");
    expect(normalizeHash("#profile")).toBe("#dashboard");
  });

  it("should accept valid dashboard hash", () => {
    expect(normalizeHash("#dashboard")).toBe("#dashboard");
  });

  it("should accept valid recipes hash", () => {
    expect(normalizeHash("#recipes")).toBe("#recipes");
  });

  it("should accept valid progress hash", () => {
    expect(normalizeHash("#progress")).toBe("#progress");
  });

  it("should be case-insensitive for input", () => {
    expect(normalizeHash("#DASHBOARD")).toBe("#dashboard");
    expect(normalizeHash("#Recipes")).toBe("#recipes");
    expect(normalizeHash("#PROGRESS")).toBe("#progress");
  });

  it("should default to dashboard for input without hash prefix", () => {
    expect(normalizeHash("dashboard")).toBe("#dashboard");
    expect(normalizeHash("recipes")).toBe("#dashboard");
    expect(normalizeHash("progress")).toBe("#dashboard");
  });

  it("should default to dashboard for non-existent hash", () => {
    expect(normalizeHash("#unknown")).toBe("#dashboard");
    expect(normalizeHash("foobar")).toBe("#dashboard");
  });

  it("should default to dashboard for input with whitespace", () => {
    expect(normalizeHash(" #dashboard")).toBe("#dashboard");
    expect(normalizeHash("#dashboard ")).toBe("#dashboard");
    expect(normalizeHash(" #RECIPES ")).toBe("#dashboard");
  });
});

describe("mapDbError", () => {
  it("should return fallback for generic error", () => {
    const error = new Error("Generic error");
    expect(mapDbError(error, "Default message")).toBe("Default message");
  });

  it("should return fallback for non-Dexie error", () => {
    const error = new TypeError("Type error");
    expect(mapDbError(error, "Custom fallback")).toBe("Custom fallback");
  });

  it("should return fallback for unknown DexieError types", () => {
    const error = new Dexie.DexieError("Unknown error type");
    error.name = "UnknownError";
    expect(mapDbError(error, "Fallback")).toBe("Fallback");
  });

  it("should map QuotaExceededError", () => {
    const error = new Dexie.DexieError("Storage quota exceeded");
    error.name = "QuotaExceededError";
    const result = mapDbError(error, "Fallback");
    expect(result).toContain("Storage is full");
  });

  it("should map ConstraintError", () => {
    const error = new Dexie.DexieError("Constraint violation");
    error.name = "ConstraintError";
    const result = mapDbError(error, "Fallback");
    expect(result).toContain("duplicate");
  });

  it("should map DatabaseClosedError", () => {
    const error = new Dexie.DexieError("Database closed");
    error.name = "DatabaseClosedError";
    const result = mapDbError(error, "Fallback");
    expect(result).toContain("connection lost");
  });

  it("should handle null error", () => {
    expect(mapDbError(null, "Fallback")).toBe("Fallback");
  });

  it("should handle undefined error", () => {
    expect(mapDbError(undefined, "Fallback")).toBe("Fallback");
  });

  it("should handle string error", () => {
    expect(mapDbError("Error string", "Fallback")).toBe("Fallback");
  });

  it("should preserve custom fallback messages", () => {
    const customMessage = "Custom error handling message";
    const error = new Error("Some error");
    expect(mapDbError(error, customMessage)).toBe(customMessage);
  });

  it("should return specific messages for Dexie errors before fallback", () => {
    const quotaError = new Dexie.DexieError("Quota");
    quotaError.name = "QuotaExceededError";
    expect(mapDbError(quotaError, "Fallback")).not.toBe("Fallback");

    const constraintError = new Dexie.DexieError("Constraint");
    constraintError.name = "ConstraintError";
    expect(mapDbError(constraintError, "Fallback")).not.toBe("Fallback");

    const closedError = new Dexie.DexieError("Closed");
    closedError.name = "DatabaseClosedError";
    expect(mapDbError(closedError, "Fallback")).not.toBe("Fallback");
  });
});

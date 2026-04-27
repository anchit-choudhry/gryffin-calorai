import { describe, expect, it } from "vitest";
import { calculateTotalCalories } from "./useFoodForm";
import { DEFAULT_MEAL_TYPE, MEAL_TYPES } from "../types";

describe("useFoodForm", () => {
  describe("meal type defaults", () => {
    it("DEFAULT_MEAL_TYPE should be Breakfast", () => {
      expect(DEFAULT_MEAL_TYPE).toBe("Breakfast");
    });

    it("MEAL_TYPES should contain all 4 expected values", () => {
      expect(MEAL_TYPES).toHaveLength(4);
      expect(MEAL_TYPES).toContain("Breakfast");
      expect(MEAL_TYPES).toContain("Lunch");
      expect(MEAL_TYPES).toContain("Snacks");
      expect(MEAL_TYPES).toContain("Dinner");
    });
  });

  describe("calculateTotalCalories", () => {
    it("should multiply caloriesPerServing by servingSize", () => {
      const result = calculateTotalCalories(95, 2);
      expect(result).toBe(190);
    });

    it("should handle single serving", () => {
      const result = calculateTotalCalories(105, 1);
      expect(result).toBe(105);
    });

    it("should handle decimal calories per serving", () => {
      const result = calculateTotalCalories(95.5, 2);
      expect(result).toBe(191);
    });

    it("should handle zero calories", () => {
      const result = calculateTotalCalories(0, 5);
      expect(result).toBe(0);
    });
  });
});

import { describe, expect, it } from "vitest";
import { EmptyCup, Footsteps, HarvestBasket, RecipeBook } from "./index";

describe("illustration components", () => {
  describe("EmptyCup", () => {
    it("renders without crashing", () => {
      const component = EmptyCup({});
      expect(component).toBeDefined();
    });
  });

  describe("Footsteps", () => {
    it("renders without crashing", () => {
      const component = Footsteps({});
      expect(component).toBeDefined();
    });
  });

  describe("HarvestBasket", () => {
    it("renders without crashing", () => {
      const component = HarvestBasket({});
      expect(component).toBeDefined();
    });
  });

  describe("RecipeBook", () => {
    it("renders without crashing", () => {
      const component = RecipeBook({});
      expect(component).toBeDefined();
    });
  });
});

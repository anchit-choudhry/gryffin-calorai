// src/db/mealTemplates.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMealPlan,
  addMealTemplate,
  db,
  deleteMealPlan,
  deleteMealTemplate,
  getMealPlans,
  getMealTemplates,
  initializeDB,
  type MealPlan,
  type MealPlanDay,
  type MealTemplate,
  updateMealPlan,
  updateMealTemplate,
} from "./dbService";
import { ISODate, MealPlanId, MealTemplateId, UserId } from "../types";

const userId = UserId("user-meal-tmpl-1");
const otherUserId = UserId("user-meal-tmpl-2");

const sampleFood = {
  name: "Oats",
  calories: 150,
  servingSize: 40,
  protein: 5,
  carbs: 27,
  fat: 3,
  mealType: "Breakfast" as const,
};

beforeAll(async () => {
  await db.delete();
  await db.open();
  await initializeDB();
});

afterAll(async () => {
  await db.delete();
});

describe("mealTemplates DB", () => {
  describe("addMealTemplate / getMealTemplates", () => {
    it("adds a template and retrieves it for the correct user", async () => {
      const template: MealTemplate = {
        userId,
        name: "My Breakfast",
        foods: [sampleFood],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const id = await addMealTemplate(template);
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);

      const templates = await getMealTemplates(userId);
      expect(templates).toHaveLength(1);
      expect(templates[0]!.name).toBe("My Breakfast");
      expect(templates[0]!.foods).toHaveLength(1);
      expect(templates[0]!.foods[0]!.name).toBe("Oats");
    });

    it("does not return templates belonging to another user", async () => {
      const template: MealTemplate = {
        userId: otherUserId,
        name: "Other User Template",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addMealTemplate(template);

      const templates = await getMealTemplates(userId);
      const names = templates.map((t) => t.name);
      expect(names).not.toContain("Other User Template");
    });

    it("returns empty array when user has no templates", async () => {
      const templates = await getMealTemplates(UserId("user-no-templates"));
      expect(templates).toStrictEqual([]);
    });
  });

  describe("updateMealTemplate", () => {
    it("updates the template name and foods", async () => {
      const id = await addMealTemplate({
        userId,
        name: "Old Name",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await updateMealTemplate(
        {
          id,
          userId,
          name: "New Name",
          foods: [sampleFood],
          createdAt: "",
          updatedAt: new Date().toISOString(),
        },
        userId,
      );

      const templates = await getMealTemplates(userId);
      const updated = templates.find((t) => t.id === id);
      expect(updated?.name).toBe("New Name");
      expect(updated?.foods).toHaveLength(1);
    });

    it("rejects update if userId does not match", async () => {
      const id = await addMealTemplate({
        userId,
        name: "Protected Template",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await updateMealTemplate(
        { id, userId, name: "Hacked", foods: [], createdAt: "", updatedAt: "" },
        otherUserId,
      );

      const templates = await getMealTemplates(userId);
      const unchanged = templates.find((t) => t.id === id);
      expect(unchanged?.name).toBe("Protected Template");
    });

    it("throws when id is missing", async () => {
      await expect(
        updateMealTemplate(
          { userId, name: "No ID", foods: [], createdAt: "", updatedAt: "" },
          userId,
        ),
      ).rejects.toThrow();
    });
  });

  describe("deleteMealTemplate", () => {
    it("deletes an owned template", async () => {
      const id = await addMealTemplate({
        userId,
        name: "To Delete",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await deleteMealTemplate(id, userId);

      const templates = await getMealTemplates(userId);
      expect(templates.find((t) => t.id === id)).toBeUndefined();
    });

    it("does not delete a template owned by another user", async () => {
      const id = await addMealTemplate({
        userId,
        name: "Should Not Delete",
        foods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await deleteMealTemplate(id, otherUserId);

      const templates = await getMealTemplates(userId);
      expect(templates.find((t) => t.id === id)).toBeDefined();
    });
  });
});

describe("mealPlans DB", () => {
  const makeDays = (): MealPlanDay[] =>
    Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, templateId: null }));

  describe("addMealPlan / getMealPlans", () => {
    it("adds a plan and retrieves it for the correct user", async () => {
      const plan: MealPlan = {
        userId,
        name: "My Week Plan",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      };
      const id = await addMealPlan(plan);
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);

      const plans = await getMealPlans(userId);
      const saved = plans.find((p) => p.id === id);
      expect(saved?.name).toBe("My Week Plan");
      expect(saved?.days).toHaveLength(7);
    });

    it("does not return plans belonging to another user", async () => {
      await addMealPlan({
        userId: otherUserId,
        name: "Other Plan",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      });

      const plans = await getMealPlans(userId);
      expect(plans.map((p) => p.name)).not.toContain("Other Plan");
    });

    it("supports template references on plan days", async () => {
      const templateId = await addMealTemplate({
        userId,
        name: "Mon Breakfast",
        foods: [sampleFood],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const days = makeDays();
      days[0] = { dayIndex: 0, templateId };

      const planId = await addMealPlan({
        userId,
        name: "Plan With Template",
        days,
        createdAt: new Date().toISOString(),
      });

      const plans = await getMealPlans(userId);
      const saved = plans.find((p) => p.id === planId);
      expect(saved?.days[0]?.templateId).toBe(templateId);
    });
  });

  describe("updateMealPlan", () => {
    it("updates the plan name and days", async () => {
      const id = await addMealPlan({
        userId,
        name: "Old Plan",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      });

      const newDays = makeDays();
      newDays[1] = { dayIndex: 1, templateId: MealTemplateId(999) };

      await updateMealPlan(
        { id, userId, name: "Updated Plan", days: newDays, createdAt: "" },
        userId,
      );

      const plans = await getMealPlans(userId);
      const updated = plans.find((p) => p.id === id);
      expect(updated?.name).toBe("Updated Plan");
      expect(updated?.days[1]?.templateId).toBe(999);
    });

    it("rejects update if userId does not match", async () => {
      const id = await addMealPlan({
        userId,
        name: "Protected Plan",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      });

      await updateMealPlan(
        { id, userId, name: "Hacked", days: makeDays(), createdAt: "" },
        otherUserId,
      );

      const plans = await getMealPlans(userId);
      const unchanged = plans.find((p) => p.id === id);
      expect(unchanged?.name).toBe("Protected Plan");
    });

    it("throws when id is missing", async () => {
      await expect(
        updateMealPlan({ userId, name: "No ID", days: makeDays(), createdAt: "" }, userId),
      ).rejects.toThrow();
    });
  });

  describe("deleteMealPlan", () => {
    it("deletes an owned plan", async () => {
      const id = await addMealPlan({
        userId,
        name: "Delete Me",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      });

      await deleteMealPlan(id, userId);

      const plans = await getMealPlans(userId);
      expect(plans.find((p) => p.id === id)).toBeUndefined();
    });

    it("does not delete a plan owned by another user", async () => {
      const id = await addMealPlan({
        userId,
        name: "Stay Put",
        days: makeDays(),
        createdAt: new Date().toISOString(),
      });

      await deleteMealPlan(id, otherUserId);

      const plans = await getMealPlans(userId);
      expect(plans.find((p) => p.id === id)).toBeDefined();
    });
  });
});

// Suppress unused-import warnings for types used only in type position
void (ISODate as unknown);
void (MealPlanId as unknown);
void (MealTemplateId as unknown);

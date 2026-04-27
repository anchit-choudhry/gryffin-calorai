// src/db/dbService.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  db,
  deleteFoodItem,
  deleteRecipe,
  type FoodItem,
  foodItems,
  getAllFoodLogs,
  getAllRecipes,
  getDailyFoodLogs,
  getOrCreateUser,
  initializeDB,
  type Recipe,
  saveRecipe,
  updateUserProfile,
} from "./dbService";
import { FoodItemId as makeFoodItemId, ISODate, todayISO, UserId } from "../types";

describe("dbService", () => {
  beforeAll(async () => {
    // Clear and initialize DB before tests
    await db.delete();
    await db.open();
    await initializeDB();
  });

  afterAll(async () => {
    await db.delete();
  });

  it("should add a food item and retrieve it by user and date", async () => {
    const mockFoodData: FoodItem = {
      userId: UserId("1"),
      name: "Apple",
      calories: 95,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: todayISO(),
    };

    // Add food item
    const addedItem = await foodItems.add(mockFoodData);
    expect(addedItem).toBeDefined();

    const logs = await getDailyFoodLogs(UserId("1"), todayISO());

    expect(logs).toHaveLength(1);
    expect(logs[0].name).toBe("Apple");

    const names = logs.map((log) => log.name);
    expect(names).toEqual(["Apple"]);
  });

  it("should retrieve only logs for the specified user and date", async () => {
    const today = todayISO();
    const fakeDate = ISODate("2023-01-01");

    await foodItems.add({
      userId: UserId("1"),
      name: "Banana",
      calories: 105,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: today,
    });
    await foodItems.add({
      userId: UserId("2"),
      name: "Orange",
      calories: 62,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: today,
    });
    await foodItems.add({
      userId: UserId("1"),
      name: "Grapes",
      calories: 100,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: fakeDate,
    });

    const logs = await getDailyFoodLogs(UserId("1"), today);

    expect(logs).toHaveLength(2);
    const names = logs.map((log) => log.name);
    expect(names).toEqual(["Apple", "Banana"]);
  });

  it("should delete a food item", async () => {
    const mockFood: FoodItem = {
      userId: UserId("3"),
      name: "Carrot",
      calories: 50,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: todayISO(),
    };

    const id = await foodItems.add(mockFood);
    const allBefore = await getDailyFoodLogs(UserId("3"), todayISO());
    expect(allBefore.length).toBeGreaterThan(0);

    await deleteFoodItem(makeFoodItemId(id));

    const allAfter = await getDailyFoodLogs(UserId("3"), todayISO());
    expect(allAfter.find((log) => log.name === "Carrot")).toBeUndefined();
  });

  it("should retrieve all food logs for a user across dates", async () => {
    const userId = UserId("4");
    const today = todayISO();
    const yesterday = ISODate(
      new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0],
    );

    await foodItems.add({
      userId,
      name: "Egg",
      calories: 78,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: today,
    });
    await foodItems.add({
      userId,
      name: "Yogurt",
      calories: 100,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: yesterday,
    });

    const allLogs = await getAllFoodLogs(userId);
    const userLogs = allLogs.filter(
      (log) => log.dateLogged === today || log.dateLogged === yesterday,
    );

    expect(userLogs.length).toBeGreaterThanOrEqual(2);
  });

  it("should save and retrieve a recipe", async () => {
    const userId = UserId("5");
    const recipe: Recipe = {
      name: "Test Recipe",
      description: "A test recipe",
      ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 2, serving: 1 }],
      totalCalories: 200,
      createdBy: userId,
      dateCreated: new Date().toISOString(),
      userId,
    };

    await saveRecipe(recipe);
    const recipes = await getAllRecipes(userId);

    expect(recipes.some((r) => r.name === "Test Recipe")).toBe(true);
  });

  it("should delete a recipe", async () => {
    const userId = UserId("6");
    const recipe: Recipe = {
      name: "Deletable Recipe",
      description: "To be deleted",
      ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
      totalCalories: 100,
      createdBy: userId,
      dateCreated: new Date().toISOString(),
      userId,
    };

    const id = await saveRecipe(recipe);
    const recipesBefore = await getAllRecipes(userId);
    expect(recipesBefore.some((r) => r.name === "Deletable Recipe")).toBe(true);

    await deleteRecipe(id);

    const recipesAfter = await getAllRecipes(userId);
    expect(recipesAfter.some((r) => r.name === "Deletable Recipe")).toBe(false);
  });

  it("should update user profile with calorie goal", async () => {
    const userId = UserId("7");
    const user = await getOrCreateUser(userId, "TestUser", "test@example.com");
    expect(user.calorieGoal).toBe(2000);

    const updatedUser = { ...user, calorieGoal: 2500 };
    await updateUserProfile(updatedUser);

    const retrieved = await getOrCreateUser(userId, "TestUser", "test@example.com");
    expect(retrieved.calorieGoal).toBe(2500);
  });
});

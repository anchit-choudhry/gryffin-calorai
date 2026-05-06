// src/db/dbService.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addBodyMeasurement,
  addWaterLog,
  db,
  deleteBodyMeasurement,
  deleteFoodItem,
  deleteRecipe,
  deleteWaterLog,
  type FoodItem,
  foodItems,
  getAllBodyMeasurements,
  getAllFoodLogs,
  getAllRecipes,
  getDailyFoodLogs,
  getDailyWaterLogs,
  getFavoriteFoodItems,
  getOrCreateUser,
  initializeDB,
  type Recipe,
  saveRecipe,
  toggleFavoriteFoodItem,
  updateFoodItem,
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
      isFavorite: false,
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
      isFavorite: false,
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
      isFavorite: false,
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
      isFavorite: false,
    });

    const logs = await getDailyFoodLogs(UserId("1"), today);

    expect(logs).toHaveLength(2);
    const names = logs.map((log) => log.name);
    expect(names).toEqual(["Apple", "Banana"]);
  });

  it("should delete a food item", async () => {
    const userId = UserId("3");
    const mockFood: FoodItem = {
      userId,
      name: "Carrot",
      calories: 50,
      servingSize: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
      dateLogged: todayISO(),
      isFavorite: false,
    };

    const id = await foodItems.add(mockFood);
    const allBefore = await getDailyFoodLogs(userId, todayISO());
    expect(allBefore.length).toBeGreaterThan(0);

    await deleteFoodItem(makeFoodItemId(id), userId);

    const allAfter = await getDailyFoodLogs(userId, todayISO());
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
      isFavorite: false,
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
      isFavorite: false,
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

    await deleteRecipe(id, userId);

    const recipesAfter = await getAllRecipes(userId);
    expect(recipesAfter.some((r) => r.name === "Deletable Recipe")).toBe(false);
  });

  it("should update user profile with calorie goal", async () => {
    const userId = UserId("7");
    const user = await getOrCreateUser(userId, "TestUser", "test@example.com");
    expect(user.calorieGoal).toBe(2000);

    const updatedUser = { ...user, calorieGoal: 2500 };
    await updateUserProfile(updatedUser, userId);

    const retrieved = await getOrCreateUser(userId, "TestUser", "test@example.com");
    expect(retrieved.calorieGoal).toBe(2500);
  });

  it("should toggle favorite on a food item", async () => {
    const userId = UserId("8");
    const mockFood: FoodItem = {
      userId,
      name: "Pizza",
      calories: 300,
      servingSize: 2,
      protein: 10,
      carbs: 40,
      fat: 12,
      dateLogged: todayISO(),
      isFavorite: false,
    };

    const id = await foodItems.add(mockFood);
    const idTyped = makeFoodItemId(id);

    await toggleFavoriteFoodItem(idTyped, true, userId);
    const updated = await foodItems.get(id);
    expect(updated?.isFavorite).toBe(true);

    await toggleFavoriteFoodItem(idTyped, false, userId);
    const updated2 = await foodItems.get(id);
    expect(updated2?.isFavorite).toBe(false);
  });

  it("should retrieve only favorite food items for a user", async () => {
    const userId = UserId("9");
    const item1: FoodItem = {
      userId,
      name: "Chicken",
      calories: 165,
      servingSize: 1,
      protein: 31,
      carbs: 0,
      fat: 3,
      dateLogged: todayISO(),
      isFavorite: true,
    };
    const item2: FoodItem = {
      userId,
      name: "Rice",
      calories: 130,
      servingSize: 1,
      protein: 2,
      carbs: 28,
      fat: 0,
      dateLogged: todayISO(),
      isFavorite: false,
    };

    await foodItems.add(item1);
    await foodItems.add(item2);

    const favorites = await getFavoriteFoodItems(userId);
    expect(favorites.some((f) => f.name === "Chicken")).toBe(true);
    expect(favorites.some((f) => f.name === "Rice")).toBe(false);
  });

  it("should update a food item without changing userId", async () => {
    const userId = UserId("10");
    const mockFood: FoodItem = {
      userId,
      name: "Salad",
      calories: 150,
      servingSize: 1,
      protein: 5,
      carbs: 20,
      fat: 8,
      dateLogged: todayISO(),
      isFavorite: false,
    };

    const id = await foodItems.add(mockFood);
    const idTyped = makeFoodItemId(id);

    await updateFoodItem(idTyped, { name: "Caesar Salad", calories: 200, protein: 8 }, userId);

    const updated = await foodItems.get(id);
    expect(updated?.name).toBe("Caesar Salad");
    expect(updated?.calories).toBe(200);
    expect(updated?.protein).toBe(8);
    expect(updated?.userId).toBe(userId);
  });

  it("should store and retrieve mealType on a food item", async () => {
    const userId = UserId("11");
    const mockFood: FoodItem = {
      userId,
      name: "Oatmeal",
      calories: 150,
      servingSize: 1,
      protein: 5,
      carbs: 27,
      fat: 3,
      dateLogged: todayISO(),
      isFavorite: false,
      mealType: "Breakfast",
    };

    const id = await foodItems.add(mockFood);
    const retrieved = await foodItems.get(id);
    expect(retrieved?.mealType).toBe("Breakfast");
  });

  it("should default mealType to undefined for items created without it", async () => {
    const userId = UserId("12");
    const mockFood: FoodItem = {
      userId,
      name: "Sandwich",
      calories: 350,
      servingSize: 1,
      protein: 15,
      carbs: 40,
      fat: 12,
      dateLogged: todayISO(),
      isFavorite: false,
    };

    const id = await foodItems.add(mockFood);
    const retrieved = await foodItems.get(id);
    expect(retrieved?.mealType).toBeUndefined();
  });

  describe("water logs", () => {
    it("should add and retrieve daily water logs", async () => {
      const userId = UserId("wl-1");
      const today = todayISO();

      await addWaterLog({
        userId,
        amount: 500,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addWaterLog({
        userId,
        amount: 250,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });

      const logs = await getDailyWaterLogs(userId, today);
      expect(logs).toHaveLength(2);
      expect(logs.map((l) => l.amount).sort()).toEqual([250, 500]);
    });

    it("should not return water logs from other dates", async () => {
      const userId = UserId("wl-2");
      const today = todayISO();
      const other = ISODate("2023-06-01");

      await addWaterLog({
        userId,
        amount: 300,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addWaterLog({
        userId,
        amount: 700,
        dateLogged: other,
        loggedAt: new Date().toISOString(),
      });

      const logs = await getDailyWaterLogs(userId, today);
      expect(logs).toHaveLength(1);
      expect(logs[0].amount).toBe(300);
    });

    it("should delete a water log", async () => {
      const userId = UserId("wl-3");
      const today = todayISO();

      const id = await addWaterLog({
        userId,
        amount: 400,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      const before = await getDailyWaterLogs(userId, today);
      expect(before).toHaveLength(1);

      await deleteWaterLog(id, userId);
      const after = await getDailyWaterLogs(userId, today);
      expect(after).toHaveLength(0);
    });
  });

  describe("body measurements", () => {
    it("should add and retrieve body measurements", async () => {
      const userId = UserId("bm-1");

      await addBodyMeasurement({
        userId,
        measuredAt: ISODate("2026-04-01"),
        weight: 70,
        bodyFat: 18,
      });
      await addBodyMeasurement({ userId, measuredAt: ISODate("2026-05-01"), weight: 69.5 });

      const measurements = await getAllBodyMeasurements(userId);
      expect(measurements).toHaveLength(2);
      expect(measurements.map((m) => m.weight).sort()).toEqual([69.5, 70]);
    });

    it("should support optional fields", async () => {
      const userId = UserId("bm-2");

      await addBodyMeasurement({
        userId,
        measuredAt: todayISO(),
        weight: 75,
        waist: 85,
        chest: 100,
        hips: 95,
      });

      const measurements = await getAllBodyMeasurements(userId);
      expect(measurements).toHaveLength(1);
      expect(measurements[0].waist).toBe(85);
      expect(measurements[0].chest).toBe(100);
      expect(measurements[0].bodyFat).toBeUndefined();
    });

    it("should delete a body measurement", async () => {
      const userId = UserId("bm-3");

      const id = await addBodyMeasurement({ userId, measuredAt: todayISO(), weight: 68 });
      const before = await getAllBodyMeasurements(userId);
      expect(before).toHaveLength(1);

      await deleteBodyMeasurement(id, userId);
      const after = await getAllBodyMeasurements(userId);
      expect(after).toHaveLength(0);
    });
  });
});

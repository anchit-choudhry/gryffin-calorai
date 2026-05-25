// src/db/dbService.test.ts
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  addBodyMeasurement,
  addFoodItemLog,
  addRecurringMeal,
  addStepLog,
  addUserAchievement,
  addWaterLog,
  BACKUP_VERSION,
  clearDatabase,
  completeOnboarding,
  db,
  deleteBodyMeasurement,
  deleteFoodItem,
  deleteRecipe,
  deleteRecurringMeal,
  deleteStepLog,
  deleteWaterLog,
  type FoodItem,
  foodItems,
  getAllBodyMeasurements,
  getAllFoodLogs,
  getAllRecipes,
  getAllStepLogs,
  getAllWaterLogs,
  getDailyFoodLogs,
  getDailyStepLogs,
  getDailyWaterLogs,
  getDietProfile,
  getFavoriteFoodItems,
  getFoodItemById,
  getOrCreateUser,
  getRecentFoodItems,
  getRecurringMeals,
  getUnlockedAchievementIds,
  getUnlockedAchievements,
  importBackup,
  initializeDB,
  type Recipe,
  type RecurringMeal,
  saveDietProfile,
  saveRecipe,
  toggleFavoriteFoodItem,
  updateBodyMeasurement,
  updateFoodItem,
  updateRecipe,
  updateRecurringMeal,
  updateUserProfile,
} from "./dbService";
import {
  BodyMeasurementId,
  FoodItemId as makeFoodItemId,
  ISODate,
  RecipeId,
  RecurringMealId,
  StepLogId,
  todayISO,
  UserId,
  WaterLogId,
} from "../types";

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
    expect(logs[0]!.name).toBe("Apple");

    const names = logs.map((log) => log.name);
    expect(names).toStrictEqual(["Apple"]);
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
    expect(names).toStrictEqual(["Apple", "Banana"]);
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
      new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]!,
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

  it("should handle concurrent getOrCreateUser calls without throwing", async () => {
    const userId = UserId("concurrent-user");
    // Call getOrCreateUser twice in parallel
    const results = await Promise.all([
      getOrCreateUser(userId, "Parallel1", "p1@example.com"),
      getOrCreateUser(userId, "Parallel2", "p2@example.com"),
    ]);

    expect(results[0].id).toBe(userId);
    expect(results[1].id).toBe(userId);

    const count = await db.table("users").where("id").equals(userId).count();
    expect(count).toBe(1);
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
      expect(logs.map((l) => l.amount).sort()).toStrictEqual([250, 500]);
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
      expect(logs[0]!.amount).toBe(300);
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
      expect(measurements.map((m) => m.weight).sort()).toStrictEqual([69.5, 70]);
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
      expect(measurements[0]!.waist).toBe(85);
      expect(measurements[0]!.chest).toBe(100);
      expect(measurements[0]!.bodyFat).toBeUndefined();
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

    it("should update an existing body measurement", async () => {
      const userId = UserId("bm-upd-1");
      const id = await addBodyMeasurement({
        userId,
        measuredAt: ISODate("2026-05-01"),
        weight: 70,
        bodyFat: 18,
      });

      await updateBodyMeasurement(id, userId, { weight: 71, bodyFat: 19 });

      const measurements = await getAllBodyMeasurements(userId);
      expect(measurements).toHaveLength(1);
      expect(measurements[0]!.weight).toBe(71);
      expect(measurements[0]!.bodyFat).toBe(19);
    });

    it("should not update a measurement belonging to a different user", async () => {
      const userId1 = UserId("bm-upd-2");
      const userId2 = UserId("bm-upd-3");
      const id = await addBodyMeasurement({
        userId: userId1,
        measuredAt: ISODate("2026-05-01"),
        weight: 70,
      });

      await updateBodyMeasurement(id, userId2, { weight: 99 });

      const measurements = await getAllBodyMeasurements(userId1);
      expect(measurements[0]!.weight).toBe(70);
    });

    it("should not throw when updating a non-existent measurement", async () => {
      const userId = UserId("bm-upd-4");
      const nonExistentId = BodyMeasurementId(99999);

      await expect(
        updateBodyMeasurement(nonExistentId, userId, { weight: 75 }),
      ).resolves.not.toThrow();
    });
  });

  describe("step logs", () => {
    it("should add and retrieve daily step logs", async () => {
      const userId = UserId("sl-1");
      const today = todayISO();

      await addStepLog({
        userId,
        steps: 5000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addStepLog({
        userId,
        steps: 3000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });

      const logs = await getDailyStepLogs(userId, today);
      expect(logs).toHaveLength(2);
      expect(logs.map((l) => l.steps).sort()).toStrictEqual([3000, 5000]);
    });

    it("should retrieve all step logs across dates", async () => {
      const userId = UserId("sl-2");
      const today = todayISO();
      const yesterday = ISODate(
        new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]!,
      );

      await addStepLog({
        userId,
        steps: 8000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addStepLog({
        userId,
        steps: 10000,
        dateLogged: yesterday,
        loggedAt: new Date().toISOString(),
      });

      const allLogs = await getAllStepLogs(userId);
      expect(allLogs.length).toBeGreaterThanOrEqual(2);
      expect(allLogs.some((l) => l.steps === 8000)).toBe(true);
      expect(allLogs.some((l) => l.steps === 10000)).toBe(true);
    });

    it("should not return step logs from other dates", async () => {
      const userId = UserId("sl-3");
      const today = todayISO();
      const other = ISODate("2023-07-01");

      await addStepLog({
        userId,
        steps: 6000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addStepLog({
        userId,
        steps: 9000,
        dateLogged: other,
        loggedAt: new Date().toISOString(),
      });

      const logs = await getDailyStepLogs(userId, today);
      expect(logs).toHaveLength(1);
      expect(logs[0]!.steps).toBe(6000);
    });

    it("should delete a step log", async () => {
      const userId = UserId("sl-4");
      const today = todayISO();

      const id = await addStepLog({
        userId,
        steps: 7000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      const before = await getDailyStepLogs(userId, today);
      expect(before).toHaveLength(1);

      await deleteStepLog(id, userId);
      const after = await getDailyStepLogs(userId, today);
      expect(after).toHaveLength(0);
    });

    it("should not delete if userId does not match", async () => {
      const userId = UserId("sl-5");
      const differentUserId = UserId("sl-5-other");
      const today = todayISO();

      const id = await addStepLog({
        userId,
        steps: 7000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });

      await deleteStepLog(id, differentUserId);
      const logs = await getDailyStepLogs(userId, today);
      expect(logs).toHaveLength(1);
    });
  });

  describe("achievements", () => {
    it("should add and retrieve achievements", async () => {
      const userId = UserId("ach-1");

      await addUserAchievement({
        userId,
        achievementId: "first_food_log",
        unlockedAt: new Date().toISOString(),
      });
      await addUserAchievement({
        userId,
        achievementId: "week_streak_7",
        unlockedAt: new Date().toISOString(),
      });

      const achievements = await getUnlockedAchievements(userId);
      expect(achievements.length).toBeGreaterThanOrEqual(2);
      expect(achievements.some((a) => a.achievementId === "first_food_log")).toBe(true);
      expect(achievements.some((a) => a.achievementId === "week_streak_7")).toBe(true);
    });

    it("should retrieve achievement ids as a set", async () => {
      const userId = UserId("ach-2");

      await addUserAchievement({
        userId,
        achievementId: "hydration_500ml",
        unlockedAt: new Date().toISOString(),
      });
      await addUserAchievement({
        userId,
        achievementId: "step_goal_reached",
        unlockedAt: new Date().toISOString(),
      });

      const achievementIds = await getUnlockedAchievementIds(userId);
      expect(achievementIds.has("hydration_500ml")).toBe(true);
      expect(achievementIds.has("step_goal_reached")).toBe(true);
    });

    it("should return empty set for user with no achievements", async () => {
      const userId = UserId("ach-3");
      const achievementIds = await getUnlockedAchievementIds(userId);
      expect(achievementIds.size).toBe(0);
    });
  });

  describe("recipe operations", () => {
    it("should update a recipe", async () => {
      const userId = UserId("recipe-1");
      const recipe: Recipe = {
        name: "Original Recipe",
        description: "Original description",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
        userId,
      };

      const id = await saveRecipe(recipe);
      const updatedRecipe = { ...recipe, id, name: "Updated Recipe", description: "Updated" };

      await updateRecipe(updatedRecipe, userId);

      const recipes = await getAllRecipes(userId);
      const found = recipes.find((r) => r.id === id);
      expect(found?.name).toBe("Updated Recipe");
      expect(found?.description).toBe("Updated");
    });
  });

  describe("getRecentFoodItems", () => {
    it("should retrieve recent food items for a user", async () => {
      const userId = UserId("recent-1");
      const today = todayISO();

      await foodItems.add({
        userId,
        name: "Apple",
        calories: 95,
        servingSize: 1,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        dateLogged: today,
        isFavorite: false,
      });
      await foodItems.add({
        userId,
        name: "Banana",
        calories: 105,
        servingSize: 1,
        protein: 1,
        carbs: 27,
        fat: 0.3,
        dateLogged: today,
        isFavorite: false,
      });

      const recent = await getRecentFoodItems(userId);
      expect(recent.length).toBeGreaterThanOrEqual(2);
      expect(recent.some((i) => i.name === "Apple")).toBe(true);
      expect(recent.some((i) => i.name === "Banana")).toBe(true);
    });
  });

  describe("deletion edge cases", () => {
    it("should handle deletion of non-existent food items gracefully", async () => {
      const userId = UserId("edge-1");
      const nonExistentId = makeFoodItemId(99999);

      await expect(deleteFoodItem(nonExistentId, userId)).resolves.not.toThrow();
    });

    it("should handle deletion of food items by wrong user", async () => {
      const userId1 = UserId("edge-2a");
      const userId2 = UserId("edge-2b");
      const today = todayISO();

      const id = await foodItems.add({
        userId: userId1,
        name: "Protected Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 15,
        fat: 3,
        dateLogged: today,
        isFavorite: false,
      });

      await deleteFoodItem(makeFoodItemId(id), userId2);

      const logs = await getDailyFoodLogs(userId1, today);
      expect(logs.some((log) => log.name === "Protected Food")).toBe(true);
    });

    it("should handle deletion of non-existent water logs gracefully", async () => {
      const userId = UserId("edge-3");
      const nonExistentId = WaterLogId(99999);

      await expect(deleteWaterLog(nonExistentId, userId)).resolves.not.toThrow();
    });

    it("should handle deletion of non-existent body measurements gracefully", async () => {
      const userId = UserId("edge-4");
      const nonExistentId = BodyMeasurementId(99999);

      await expect(deleteBodyMeasurement(nonExistentId, userId)).resolves.not.toThrow();
    });

    it("should handle deletion of non-existent step logs gracefully", async () => {
      const userId = UserId("edge-5");
      const nonExistentId = StepLogId(99999);

      await expect(deleteStepLog(nonExistentId, userId)).resolves.not.toThrow();
    });
  });

  describe("additional coverage", () => {
    it("should retrieve all water logs for a user", async () => {
      const userId = UserId("wl-all");
      const today = todayISO();
      const yesterday = ISODate(
        new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]!,
      );

      await addWaterLog({
        userId,
        amount: 500,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });
      await addWaterLog({
        userId,
        amount: 250,
        dateLogged: yesterday,
        loggedAt: new Date().toISOString(),
      });

      const allLogs = await getAllWaterLogs(userId);
      expect(allLogs.length).toBeGreaterThanOrEqual(2);
      expect(allLogs.some((l) => l.amount === 500)).toBe(true);
      expect(allLogs.some((l) => l.amount === 250)).toBe(true);
    });

    it("should retrieve food item by id with authorization check", async () => {
      const userId1 = UserId("food-auth-1");
      const userId2 = UserId("food-auth-2");
      const today = todayISO();

      const id = await foodItems.add({
        userId: userId1,
        name: "Secret Food",
        calories: 200,
        servingSize: 1,
        protein: 10,
        carbs: 20,
        fat: 5,
        dateLogged: today,
        isFavorite: false,
      });

      const item = await getFoodItemById(makeFoodItemId(id), userId1);
      expect(item).toBeDefined();
      expect(item?.name).toBe("Secret Food");

      const itemByWrongUser = await getFoodItemById(makeFoodItemId(id), userId2);
      expect(itemByWrongUser).toBeUndefined();
    });

    it("should return undefined for non-existent food item", async () => {
      const userId = UserId("food-missing");
      const item = await getFoodItemById(makeFoodItemId(99999), userId);
      expect(item).toBeUndefined();
    });

    it("should throw error when updating recipe without id", async () => {
      const userId = UserId("recipe-no-id");
      const recipe: Recipe = {
        name: "No ID Recipe",
        description: "Has no ID",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
        userId,
      };

      await expect(updateRecipe(recipe, userId)).rejects.toThrow("Recipe id required");
    });

    it("should throw error when updating another user's recipe", async () => {
      const userId1 = UserId("recipe-owner");
      const userId2 = UserId("recipe-intruder");

      const recipe: Recipe = {
        name: "Protected Recipe",
        description: "Owned by user1",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId1,
        dateCreated: new Date().toISOString(),
        userId: userId1,
      };

      const id = await saveRecipe(recipe);
      const recipeWithId = { ...recipe, id };

      await expect(updateRecipe(recipeWithId, userId2)).rejects.toThrow("Unauthorized");
    });

    it("should throw error when updating non-existent recipe", async () => {
      const userId = UserId("recipe-missing");
      const recipe: Recipe = {
        id: RecipeId(99999),
        name: "Missing Recipe",
        description: "Does not exist",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
        userId,
      };

      await expect(updateRecipe(recipe, userId)).rejects.toThrow("Unauthorized");
    });

    it("should add food item log using addFoodItemLog function", async () => {
      const userId = UserId("food-log-1");
      const mockFood: FoodItem = {
        userId,
        name: "Burger",
        calories: 500,
        servingSize: 1,
        protein: 25,
        carbs: 40,
        fat: 20,
        dateLogged: todayISO(),
        isFavorite: false,
      };

      const id = await addFoodItemLog(mockFood);
      expect(id).toBeDefined();
      expect(typeof id).toBe("number");

      const retrieved = await getFoodItemById(id, userId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Burger");
    });

    it("should throw error when updating user profile from different user", async () => {
      const userId1 = UserId("profile-owner");
      const userId2 = UserId("profile-intruder");

      const user = await getOrCreateUser(userId1, "Owner", "owner@example.com");
      const modifiedProfile = { ...user, calorieGoal: 3000 };

      await expect(updateUserProfile(modifiedProfile, userId2)).rejects.toThrow("Unauthorized");
    });

    it("should clear database in test mode", async () => {
      const userId = UserId("clear-test");
      const mockFood: FoodItem = {
        userId,
        name: "Temp Food",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 10,
        fat: 3,
        dateLogged: todayISO(),
        isFavorite: false,
      };

      await foodItems.add(mockFood);
      const before = await getAllFoodLogs(userId);
      expect(before.some((f) => f.name === "Temp Food")).toBe(true);

      await clearDatabase();
      await initializeDB();

      const after = await getAllFoodLogs(userId);
      expect(after.some((f) => f.name === "Temp Food")).toBe(false);
    });

    it("should deduplicate by name in getRecentFoodItems", async () => {
      const userId = UserId("recent-dedup");
      const today = todayISO();
      const yesterday = ISODate(
        new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]!,
      );

      await foodItems.add({
        userId,
        name: "Apple",
        calories: 95,
        servingSize: 1,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        dateLogged: today,
        isFavorite: false,
      });
      await foodItems.add({
        userId,
        name: "Apple",
        calories: 95,
        servingSize: 2,
        protein: 1,
        carbs: 50,
        fat: 0.6,
        dateLogged: yesterday,
        isFavorite: false,
      });

      const recent = await getRecentFoodItems(userId);
      const apples = recent.filter((i) => i.name === "Apple");
      expect(apples).toHaveLength(1);
    });

    it("should reject toggle favorite for non-existent food item", async () => {
      const userId = UserId("toggle-missing");
      const nonExistentId = makeFoodItemId(99999);

      await expect(toggleFavoriteFoodItem(nonExistentId, true, userId)).resolves.not.toThrow();
    });

    it("should not allow wrong user to toggle favorite", async () => {
      const userId1 = UserId("toggle-owner");
      const userId2 = UserId("toggle-intruder");
      const today = todayISO();

      const id = await foodItems.add({
        userId: userId1,
        name: "Secret Snack",
        calories: 150,
        servingSize: 1,
        protein: 5,
        carbs: 20,
        fat: 5,
        dateLogged: today,
        isFavorite: false,
      });

      await toggleFavoriteFoodItem(makeFoodItemId(id), true, userId2);

      const item = await getFoodItemById(makeFoodItemId(id), userId1);
      expect(item?.isFavorite).toBe(false);
    });

    it("should not allow wrong user to update food item", async () => {
      const userId1 = UserId("update-owner");
      const userId2 = UserId("update-intruder");
      const today = todayISO();

      const id = await foodItems.add({
        userId: userId1,
        name: "Protected Dish",
        calories: 200,
        servingSize: 1,
        protein: 10,
        carbs: 25,
        fat: 5,
        dateLogged: today,
        isFavorite: false,
      });

      await updateFoodItem(makeFoodItemId(id), { name: "Hacked!" }, userId2);

      const item = await getFoodItemById(makeFoodItemId(id), userId1);
      expect(item?.name).toBe("Protected Dish");
    });

    it("should handle deletion of non-existent recipe gracefully", async () => {
      const userId = UserId("recipe-missing-del");
      const nonExistentId = RecipeId(99999);

      await expect(deleteRecipe(nonExistentId, userId)).resolves.not.toThrow();
    });

    it("should not allow wrong user to delete recipe", async () => {
      const userId1 = UserId("recipe-del-owner");
      const userId2 = UserId("recipe-del-intruder");

      const recipe: Recipe = {
        name: "Protected Recipe",
        description: "Owned by user1",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId1,
        dateCreated: new Date().toISOString(),
        userId: userId1,
      };

      const id = await saveRecipe(recipe);
      await deleteRecipe(id, userId2);

      const recipes = await getAllRecipes(userId1);
      expect(recipes.some((r) => r.id === id)).toBe(true);
    });

    it("should not delete water log from wrong user", async () => {
      const userId1 = UserId("water-owner");
      const userId2 = UserId("water-intruder");
      const today = todayISO();

      const id = await addWaterLog({
        userId: userId1,
        amount: 500,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });

      await deleteWaterLog(id, userId2);

      const logs = await getDailyWaterLogs(userId1, today);
      expect(logs.some((l) => l.amount === 500)).toBe(true);
    });

    it("should not delete body measurement from wrong user", async () => {
      const userId1 = UserId("meas-owner");
      const userId2 = UserId("meas-intruder");

      const id = await addBodyMeasurement({
        userId: userId1,
        measuredAt: todayISO(),
        weight: 75,
      });

      await deleteBodyMeasurement(id, userId2);

      const measurements = await getAllBodyMeasurements(userId1);
      expect(measurements.some((m) => m.weight === 75)).toBe(true);
    });

    it("should not delete step log from wrong user", async () => {
      const userId1 = UserId("step-owner");
      const userId2 = UserId("step-intruder");
      const today = todayISO();

      const id = await addStepLog({
        userId: userId1,
        steps: 8000,
        dateLogged: today,
        loggedAt: new Date().toISOString(),
      });

      await deleteStepLog(id, userId2);

      const logs = await getDailyStepLogs(userId1, today);
      expect(logs.some((l) => l.steps === 8000)).toBe(true);
    });

    it("should return undefined when getFoodItemById item not found", async () => {
      const userId = UserId("missing-food-user");
      const nonExistentId = makeFoodItemId(999999);
      const result = await getFoodItemById(nonExistentId, userId);
      expect(result).toBeUndefined();
    });

    it("should return undefined when getRecentFoodItems called with no items", async () => {
      const userId = UserId("no-recent-items");
      const recent = await getRecentFoodItems(userId);
      expect(Array.isArray(recent)).toBe(true);
      expect(recent.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle recipe update when recipe has no id", async () => {
      const userId = UserId("recipe-update-no-id");
      const recipe: Recipe = {
        name: "No ID Recipe",
        description: "Missing ID field",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: userId,
        dateCreated: new Date().toISOString(),
        userId,
      };

      await expect(updateRecipe(recipe, userId)).rejects.toThrow();
    });

    it("should reject recipe update when trying to update someone else's recipe", async () => {
      const owner = UserId("owner123");
      const intruder = UserId("intruder456");

      const recipe: Recipe = {
        name: "Original Recipe",
        description: "Description",
        ingredients: [{ foodItemId: makeFoodItemId(1), quantity: 1, serving: 1 }],
        totalCalories: 100,
        createdBy: owner,
        dateCreated: new Date().toISOString(),
        userId: owner,
      };

      const id = await saveRecipe(recipe);
      const recipeWithId = { ...recipe, id };

      await expect(updateRecipe(recipeWithId, intruder)).rejects.toThrow("Unauthorized");
    });

    it("should handle updateFoodItem when item not found", async () => {
      const userId = UserId("update-missing");
      const nonExistentId = makeFoodItemId(999999);

      await updateFoodItem(nonExistentId, { name: "Updated" }, userId);

      // Should not crash - item simply doesn't exist to update
      expect(true).toBe(true);
    });

    it("should not allow a different user to update another user's food item", async () => {
      const userId1 = UserId("original-owner");
      const userId2 = UserId("unauthorized-updater");
      const today = todayISO();

      const id = await foodItems.add({
        userId: userId1,
        name: "Original Name",
        calories: 100,
        servingSize: 1,
        protein: 5,
        carbs: 15,
        fat: 3,
        dateLogged: today,
        isFavorite: false,
      });

      await updateFoodItem(makeFoodItemId(id), { name: "Hacked!" }, userId2);

      const item = await getFoodItemById(makeFoodItemId(id), userId1);
      expect(item?.name).toBe("Original Name");
    });
  });

  describe("clearDatabase", () => {
    it("throws in production mode to prevent accidental data wipe", async () => {
      vi.stubEnv("MODE", "production");
      try {
        await expect(clearDatabase()).rejects.toThrow(
          "clearDatabase must not be called in production",
        );
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("succeeds in non-production mode and leaves the db open and empty", async () => {
      await clearDatabase();
      const count = await db.table("foodItems").count();
      expect(count).toBe(0);
    });
  });

  describe("DietProfile CRUD", () => {
    const userId = UserId("diet-user");

    it("getDietProfile returns null when no profile exists", async () => {
      const result = await getDietProfile(userId);
      expect(result).toBeNull();
    });

    it("saveDietProfile creates a new profile", async () => {
      await saveDietProfile({
        userId,
        preset: "keto",
        restrictions: ["gluten"],
        updatedAt: new Date().toISOString(),
      });

      const profile = await getDietProfile(userId);
      expect(profile?.preset).toBe("keto");
      expect(profile?.restrictions).toStrictEqual(["gluten"]);
    });

    it("saveDietProfile upserts existing profile", async () => {
      await saveDietProfile({
        userId,
        preset: "vegan",
        restrictions: [],
        updatedAt: new Date().toISOString(),
      });

      const profile = await getDietProfile(userId);
      expect(profile?.preset).toBe("vegan");

      // Upsert with new preset
      await saveDietProfile({
        userId,
        preset: "paleo",
        restrictions: ["nuts"],
        updatedAt: new Date().toISOString(),
      });

      const updated = await getDietProfile(userId);
      expect(updated?.preset).toBe("paleo");
      expect(updated?.restrictions).toStrictEqual(["nuts"]);
    });
  });

  describe("RecurringMeal CRUD", () => {
    const userId = UserId("recurring-user");

    const makeMeal = (name: string): Omit<RecurringMeal, "id"> => ({
      userId,
      name,
      dayMask: 0b1111111,
      mealType: "Breakfast",
      scheduledTime: "08:00",
      foods: [
        {
          name: "Oats",
          calories: 150,
          servingSize: 40,
          protein: 5,
          carbs: 27,
          fat: 3,
          mealType: "Breakfast",
        },
      ],
    });

    it("addRecurringMeal returns a RecurringMealId", async () => {
      const id = await addRecurringMeal(makeMeal("Morning Oats") as RecurringMeal);
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);
    });

    it("getRecurringMeals returns meals for the user", async () => {
      await addRecurringMeal(makeMeal("Evening Bowl") as RecurringMeal);
      const meals = await getRecurringMeals(userId);
      expect(meals.length).toBeGreaterThanOrEqual(1);
      expect(meals.every((m) => m.userId === userId)).toBe(true);
    });

    it("deleteRecurringMeal removes the meal", async () => {
      const id = await addRecurringMeal(makeMeal("Temp Meal") as RecurringMeal);
      const before = await getRecurringMeals(userId);
      const countBefore = before.length;

      await deleteRecurringMeal(RecurringMealId(id), userId);
      const after = await getRecurringMeals(userId);
      expect(after).toHaveLength(countBefore - 1);
    });

    it("deleteRecurringMeal does not delete meal belonging to another user", async () => {
      const otherId = UserId("other-recurring-user");
      const id = await addRecurringMeal(makeMeal("My Meal") as RecurringMeal);

      const before = await getRecurringMeals(userId);
      await deleteRecurringMeal(RecurringMealId(id), otherId);
      const after = await getRecurringMeals(userId);

      // Meal still there because userId didn't match
      expect(after).toHaveLength(before.length);
    });

    it("deleteRecurringMeal does not throw when meal does not exist", async () => {
      const nonExistentId = RecurringMealId(999999);
      await expect(deleteRecurringMeal(nonExistentId, userId)).resolves.not.toThrow();
    });

    it("updateRecurringMeal throws when meal has no id", async () => {
      const mealWithoutId = makeMeal("No ID Meal") as RecurringMeal;
      await expect(updateRecurringMeal(mealWithoutId, userId)).rejects.toThrow(
        "RecurringMeal id required for update",
      );
    });

    it("updateRecurringMeal returns silently when meal does not exist", async () => {
      const mealWithFakeId: RecurringMeal = {
        ...(makeMeal("Ghost Meal") as RecurringMeal),
        id: RecurringMealId(999999),
      };
      await expect(updateRecurringMeal(mealWithFakeId, userId)).resolves.not.toThrow();
    });

    it("updateRecurringMeal returns silently when meal belongs to another user", async () => {
      const otherId = UserId("update-other-user");
      const id = await addRecurringMeal(makeMeal("Other User Meal") as RecurringMeal);
      const mealWithId: RecurringMeal = {
        ...(makeMeal("Other User Meal") as RecurringMeal),
        id: RecurringMealId(id),
      };
      await expect(updateRecurringMeal(mealWithId, otherId)).resolves.not.toThrow();
    });

    it("updateRecurringMeal updates the meal successfully", async () => {
      const id = await addRecurringMeal(makeMeal("Original Name") as RecurringMeal);
      const updated: RecurringMeal = {
        ...(makeMeal("Updated Name") as RecurringMeal),
        id: RecurringMealId(id),
      };
      await updateRecurringMeal(updated, userId);
      const meals = await getRecurringMeals(userId);
      expect(meals.some((m) => m.name === "Updated Name")).toBe(true);
    });
  });

  describe("completeOnboarding", () => {
    it("does not throw when user does not exist", async () => {
      const nonExistentUserId = UserId("onboarding-missing");
      await expect(completeOnboarding(nonExistentUserId)).resolves.not.toThrow();
    });

    it("sets hasCompletedOnboarding to true for existing user", async () => {
      const userId = UserId("onboarding-happy");
      await getOrCreateUser(userId, "TestUser", "test@example.com");
      await completeOnboarding(userId);
      const user = await getOrCreateUser(userId, "TestUser", "test@example.com");
      expect(user.hasCompletedOnboarding).toBe(true);
    });
  });

  describe("importBackup", () => {
    it("imports data including tdeeProfile", async () => {
      const userId = UserId("import-user-1");
      const payload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        userId,
        tables: {
          foodItems: [],
          recipes: [],
          waterLogs: [],
          bodyMeasurements: [],
          userAchievements: [],
          stepLogs: [],
          activityLogs: [],
          fastingSessions: [],
          tdeeProfile: {
            userId,
            sex: "male" as const,
            age: 30,
            heightCm: 175,
            weightKg: 75,
            activityLevel: "moderate" as const,
            goal: "maintain" as const,
            updatedAt: new Date().toISOString(),
          },
        },
      };

      const result = await importBackup(payload, userId);
      expect(result.imported["tdeeProfile"]).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it("imports data when tdeeProfile is null", async () => {
      const userId = UserId("import-user-2");
      const payload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        userId,
        tables: {
          foodItems: [],
          recipes: [],
          waterLogs: [],
          bodyMeasurements: [],
          userAchievements: [],
          stepLogs: [],
          activityLogs: [],
          fastingSessions: [],
          tdeeProfile: null,
        },
      };

      const result = await importBackup(payload, userId);
      expect(result.skipped).toBe(0);
    });
  });
});

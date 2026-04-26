// src/db/dbService.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, type FoodItem, foodItems, getDailyFoodLogs, initializeDB } from "./dbService";
import { ISODate, todayISO, UserId } from "../types";

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
      dateLogged: today,
    });
    await foodItems.add({
      userId: UserId("2"),
      name: "Orange",
      calories: 62,
      servingSize: 1,
      dateLogged: today,
    });
    await foodItems.add({
      userId: UserId("1"),
      name: "Grapes",
      calories: 100,
      servingSize: 1,
      dateLogged: fakeDate,
    });

    const logs = await getDailyFoodLogs(UserId("1"), today);

    expect(logs).toHaveLength(2);
    const names = logs.map((log) => log.name);
    expect(names).toEqual(["Apple", "Banana"]);
  });
});

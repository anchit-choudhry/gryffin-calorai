// src/db/dbService.ts
import { Dexie, type Table } from "dexie";
import type { FoodItemId, ISODate, RecipeId, UserId } from "../types";
import { FoodItemId as makeFoodItemId, RecipeId as makeRecipeId } from "../types";

// --- Type Definitions ---
export interface FoodItem {
  id?: FoodItemId;
  name: string;
  calories: number;
  servingSize: number;
  dateLogged: ISODate;
  userId: UserId;
}

export interface Recipe {
  id?: RecipeId;
  name: string;
  description: string;
  ingredients: {
    foodItemId: FoodItemId;
    quantity: number;
    serving: number;
  }[];
  totalCalories: number;
  createdBy: UserId;
  dateCreated: string;
  userId: UserId;
}

export interface UserProfile {
  id: UserId;
  username: string;
  email: string;
  lastLogin: string;
}

// 1. Initialize Dexie Database
export const db = new Dexie("GryffinCaloraiDB");

// 2. Define schema structure with correct primary keys
db.version(1).stores({
  users: "id, username, email, lastLogin",
  foodItems: "++id, [userId+dateLogged], name, calories, servingSize, dateLogged",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
});

// 3. Define table references AFTER schema is set
export const users: Table<UserProfile> = db.table("users");
export const foodItems: Table<FoodItem> = db.table("foodItems");
export const recipes: Table<Recipe> = db.table("recipes");

export const initializeDB = async () => {
  try {
    await db.open();
    console.log("Database initialized and opened.");
  } catch (error) {
    // If migration fails, delete and recreate the database
    if (error instanceof Error && error.message.includes("primary key")) {
      console.warn("Database schema conflict detected. Clearing and reinitializing...");
      await db.delete();
      await db.open();
      console.log("Database cleared and recreated successfully.");
    } else {
      throw error;
    }
  }
};

export const addFoodItemLog = async (foodLog: FoodItem): Promise<FoodItemId> => {
  try {
    const id = await foodItems.add(foodLog);
    return makeFoodItemId(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Key already exists")) {
      console.warn("Database constraint error detected. Clearing and reinitializing database...");
      await db.delete();
      await db.open();
      const id = await foodItems.add(foodLog);
      return makeFoodItemId(id);
    }
    throw error;
  }
};

export const clearDatabase = async (): Promise<void> => {
  await db.delete();
  await db.open();
  console.log("Database cleared and reinitialized.");
};

export const getOrCreateUser = async (
  userId: UserId,
  username: string,
  email: string,
): Promise<UserProfile> => {
  const user = await users.get(userId);
  if (user) {
    return { ...user, lastLogin: new Date().toISOString() };
  }
  const newUser: UserProfile = {
    id: userId,
    username,
    email,
    lastLogin: new Date().toISOString(),
  };
  await users.add(newUser);
  console.log(`✅ New user created for ID: ${userId}`);
  return newUser;
};

export const getDailyFoodLogs = async (userId: UserId, date: ISODate): Promise<FoodItem[]> => {
  return foodItems.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

export const saveRecipe = async (recipe: Recipe): Promise<RecipeId> => {
  const id = await recipes.add(recipe);
  return makeRecipeId(id);
};

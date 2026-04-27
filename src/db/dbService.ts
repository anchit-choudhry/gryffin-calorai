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
  protein: number;
  carbs: number;
  fat: number;
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
  calorieGoal: number;
}

// 1. Initialize Dexie Database
export const db = new Dexie("GryffinCaloraiDB");

// 2. Define schema structure with correct primary keys
db.version(1).stores({
  users: "id, username, email, lastLogin",
  foodItems: "++id, [userId+dateLogged], name, calories, servingSize, dateLogged",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
});

// 2.5 Version 2: add calorieGoal to users and userId index to foodItems
db.version(2)
  .stores({
    users: "id, username, email, lastLogin",
    foodItems: "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged",
    recipes: "++id, name, description, createdBy, dateCreated, userId",
  })
  .upgrade((tx) => {
    return tx
      .table("users")
      .toCollection()
      .modify((user) => {
        if (user.calorieGoal === undefined) {
          user.calorieGoal = 2000;
        }
      });
  });

// 3. Version 3: add protein, carbs, fat to foodItems
db.version(3)
  .stores({
    users: "id, username, email, lastLogin",
    foodItems: "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged",
    recipes: "++id, name, description, createdBy, dateCreated, userId",
  })
  .upgrade((tx) => {
    return tx
      .table("foodItems")
      .toCollection()
      .modify((item) => {
        if (item.protein === undefined) item.protein = 0;
        if (item.carbs === undefined) item.carbs = 0;
        if (item.fat === undefined) item.fat = 0;
      });
  });

// 4. Define table references AFTER schema is set
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
    calorieGoal: 2000,
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

export const updateUserProfile = async (profile: UserProfile): Promise<void> => {
  await users.put(profile);
};

export const deleteFoodItem = async (id: FoodItemId): Promise<void> => {
  await foodItems.delete(id);
};

export const getAllFoodLogs = async (userId: UserId): Promise<FoodItem[]> => {
  return foodItems.where("userId").equals(userId).toArray();
};

export const getAllRecipes = async (userId: UserId): Promise<Recipe[]> => {
  return recipes.where("userId").equals(userId).toArray();
};

export const deleteRecipe = async (id: RecipeId): Promise<void> => {
  await recipes.delete(id);
};

export const getFoodItemById = async (id: FoodItemId): Promise<FoodItem | undefined> => {
  return foodItems.get(id);
};

export const getRecentFoodItems = async (userId: UserId): Promise<FoodItem[]> => {
  const allItems = await foodItems.where("userId").equals(userId).toArray();
  const seen = new Map<string, FoodItem>();
  for (const item of allItems.reverse()) {
    if (!seen.has(item.name)) seen.set(item.name, item);
  }
  return Array.from(seen.values());
};

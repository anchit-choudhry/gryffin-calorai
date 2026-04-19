// src/db/dbService.ts
import { Dexie, type Table } from "dexie";

// --- Type Definitions ---
export interface FoodItem {
  id?: number;
  name: string;
  calories: number;
  servingSize: number; // e.g., in grams or servings
  dateLogged: string; // ISO Date string (YYYY-MM-DD)
  userId: string; // Added User ID scope
}

export interface Recipe {
  id?: number;
  name: string;
  description: string;
  ingredients: {
    foodItemId: number;
    quantity: number;
    serving: number;
  }[];
  totalCalories: number;
  createdBy: string;
  dateCreated: string;
  userId: string; // Scoping recipes to a user
}

export interface UserProfile {
  id?: string; // Will now be the primary key for the user
  username: string;
  email: string;
  lastLogin: string;
}

// 1. Initialize Dexie Database
export const db = new Dexie("GryffinCaloraiDB");

// 2. Define schema structure
db.version(2).stores({
  users: "id, username, email, lastLogin", // 'id' is now the primary key
  foodItems: "[userId+dateLogged], name, calories, servingSize, dateLogged", // userId and dateLogged are now a compound primary index
  recipes: "id, name, description, createdBy, dateCreated, userId", // Added userId to scope recipes
});

// 3. Define table references AFTER schema is set
export const users: Table<UserProfile> = db.table("users");
export const foodItems: Table<FoodItem> = db.table("foodItems");
export const recipes: Table<Recipe> = db.table("recipes");

export const initializeDB = async () => {
  await db.open();
  console.log("Database initialized and opened.");
};

export const addFoodItemLog = async (foodLog: FoodItem): Promise<number> => {
  const id = await foodItems.add(foodLog);
  return id;
};

/**
 * Retrieves or creates a user profile record in the database.
 * @param userId The unique ID for the user.
 * @param username The user's display name.
 * @param email The user's email.
 * @returns The user profile object.
 */
export const getOrCreateUser = async (
  userId: string,
  username: string,
  email: string,
): Promise<UserProfile> => {
  const user = await users.get(userId);
  if (user) {
    return { ...user, lastLogin: new Date().toISOString() };
  } else {
    const newUser: UserProfile = {
      id: userId,
      username: username,
      email: email,
      lastLogin: new Date().toISOString(),
    };
    await users.add(newUser);
    console.log(`✅ New user created for ID: ${userId}`);
    return newUser;
  }
};

/**
 * Retrieves all food logs for a specific user and date.
 * @param userId The ID of the user.
 * @param date The date in 'YYYY-MM-DD' format.
 * @returns A promise that resolves with an array of food log entries.
 */
export const getDailyFoodLogs = async (userId: string, date: string): Promise<FoodItem[]> => {
  return foodItems.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

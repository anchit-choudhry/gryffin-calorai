// src/db/dbService.ts
import { Dexie, type Table } from "dexie";
import type {
  ActivityLevel,
  ActivityLogId,
  BodyMeasurementId,
  FastingSessionId,
  FoodItemId,
  GoalType,
  ISODate,
  MealType,
  RecipeId,
  Sex,
  StepLogId,
  UserAchievementId,
  UserId,
  WaterLogId,
} from "@/types";
import {
  ActivityLogId as makeActivityLogId,
  BodyMeasurementId as makeBodyMeasurementId,
  FastingSessionId as makeFastingSessionId,
  FoodItemId as makeFoodItemId,
  RecipeId as makeRecipeId,
  StepLogId as makeStepLogId,
  UserAchievementId as makeUserAchievementId,
  WaterLogId as makeWaterLogId,
} from "../types";

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
  isFavorite: boolean;
  mealType?: MealType;
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
  hasCompletedOnboarding?: boolean;
}

export interface WaterLog {
  id?: WaterLogId;
  userId: UserId;
  amount: number; // ml
  dateLogged: ISODate;
  loggedAt: string; // ISO timestamp for intra-day ordering
}

export interface BodyMeasurement {
  id?: BodyMeasurementId;
  userId: UserId;
  measuredAt: ISODate;
  weight?: number; // kg
  bodyFat?: number; // %
  waist?: number; // cm
  chest?: number; // cm
  hips?: number; // cm
}

export interface UserAchievement {
  id?: UserAchievementId;
  userId: UserId;
  achievementId: string;
  unlockedAt: string; // ISO timestamp
}

export interface StepLog {
  id?: StepLogId;
  userId: UserId;
  steps: number;
  dateLogged: ISODate;
  loggedAt: string; // ISO timestamp for intra-day ordering
}

export interface TdeeProfile {
  id?: number;
  userId: UserId;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  updatedAt: string;
}

export interface ActivityLog {
  id?: ActivityLogId;
  userId: UserId;
  activityType: string;
  durationMin: number;
  caloriesBurned: number;
  dateLogged: ISODate;
  loggedAt: string;
}

export interface FastingSession {
  id?: FastingSessionId;
  userId: UserId;
  startTime: string;
  endTime: string | null;
  targetHours: number;
  dateLogged: ISODate;
  completed: boolean;
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

// 4. Version 4: add isFavorite to foodItems
db.version(4)
  .stores({
    users: "id, username, email, lastLogin",
    foodItems:
      "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite",
    recipes: "++id, name, description, createdBy, dateCreated, userId",
  })
  .upgrade((tx) => {
    return tx
      .table("foodItems")
      .toCollection()
      .modify((item) => {
        if (item.isFavorite === undefined) item.isFavorite = false;
      });
  });

// 5. Version 5: add mealType to foodItems
db.version(5)
  .stores({
    users: "id, username, email, lastLogin",
    foodItems:
      "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
    recipes: "++id, name, description, createdBy, dateCreated, userId",
  })
  .upgrade((tx) => {
    return tx
      .table("foodItems")
      .toCollection()
      .modify((item) => {
        if (item.mealType === undefined) item.mealType = "Breakfast";
      });
  });

// 6. Version 6: add waterLogs table
db.version(6).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
});

// 7. Version 7: add bodyMeasurements table
db.version(7).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
});

// 8. Version 8: add userAchievements table
db.version(8).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
  userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
});

// 9. Version 9: add stepLogs table
db.version(9).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
  userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
  stepLogs: "++id, [userId+dateLogged], userId, dateLogged",
});

// 10. Version 10: add hasCompletedOnboarding to users
db.version(10)
  .stores({
    users: "id, username, email, lastLogin",
    foodItems:
      "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
    recipes: "++id, name, description, createdBy, dateCreated, userId",
    waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
    bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
    userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
    stepLogs: "++id, [userId+dateLogged], userId, dateLogged",
  })
  .upgrade((tx) => {
    return tx
      .table("users")
      .toCollection()
      .modify((user) => {
        if (user.hasCompletedOnboarding === undefined) {
          user.hasCompletedOnboarding = false;
        }
      });
  });

// 11. Version 11: add tdeeProfiles table
db.version(11).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
  userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
  stepLogs: "++id, [userId+dateLogged], userId, dateLogged",
  tdeeProfiles: "++id, &userId, updatedAt",
});

// 12. Version 12: add activityLogs table
db.version(12).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
  userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
  stepLogs: "++id, [userId+dateLogged], userId, dateLogged",
  tdeeProfiles: "++id, &userId, updatedAt",
  activityLogs: "++id, [userId+dateLogged], userId, dateLogged",
});

// 13. Version 13: add fastingSessions table
db.version(13).stores({
  users: "id, username, email, lastLogin",
  foodItems:
    "++id, [userId+dateLogged], userId, name, calories, servingSize, dateLogged, isFavorite, mealType",
  recipes: "++id, name, description, createdBy, dateCreated, userId",
  waterLogs: "++id, [userId+dateLogged], userId, dateLogged",
  bodyMeasurements: "++id, [userId+measuredAt], userId, measuredAt",
  userAchievements: "++id, [userId+achievementId], userId, achievementId, unlockedAt",
  stepLogs: "++id, [userId+dateLogged], userId, dateLogged",
  tdeeProfiles: "++id, &userId, updatedAt",
  activityLogs: "++id, [userId+dateLogged], userId, dateLogged",
  fastingSessions: "++id, [userId+dateLogged], userId, dateLogged, endTime",
});

// Define table references AFTER schema is set
export const users: Table<UserProfile> = db.table("users");
export const foodItems: Table<FoodItem> = db.table("foodItems");
export const recipes: Table<Recipe> = db.table("recipes");
export const waterLogs: Table<WaterLog> = db.table("waterLogs");
export const bodyMeasurements: Table<BodyMeasurement> = db.table("bodyMeasurements");
export const userAchievements: Table<UserAchievement> = db.table("userAchievements");
export const stepLogs: Table<StepLog> = db.table("stepLogs");
export const tdeeProfiles: Table<TdeeProfile> = db.table("tdeeProfiles");
export const activityLogs: Table<ActivityLog> = db.table("activityLogs");
export const fastingSessions: Table<FastingSession> = db.table("fastingSessions");

export const initializeDB = async () => {
  try {
    await db.open();
  } catch (error) {
    if (error instanceof Error && error.message.includes("primary key")) {
      // Schema conflict - only auto-recover in non-production to avoid silent data loss.
      if (import.meta.env.MODE === "production") {
        throw new Error(
          "Database schema conflict detected. Manual migration required to avoid data loss.",
          { cause: error },
        );
      }
      console.warn("Database schema conflict detected. Clearing and reinitializing (dev only)...");
      await db.delete();
      await db.open();
    } else {
      throw error;
    }
  }
};

export const addFoodItemLog = async (foodLog: FoodItem): Promise<FoodItemId> => {
  const id = await foodItems.add(foodLog);
  return makeFoodItemId(id);
};

export const clearDatabase = async (): Promise<void> => {
  if (import.meta.env.MODE === "production") {
    throw new Error("clearDatabase must not be called in production");
  }
  await db.delete();
  await db.open();
};

export const getOrCreateUser = async (
  userId: UserId,
  username: string,
  email: string,
): Promise<UserProfile> => {
  const user = await users.get(userId);
  const updatedUser: UserProfile = {
    id: userId,
    username: user?.username ?? username,
    email: user?.email ?? email,
    lastLogin: new Date().toISOString(),
    calorieGoal: user?.calorieGoal ?? 2000,
    hasCompletedOnboarding: user?.hasCompletedOnboarding ?? false,
  };
  await users.put(updatedUser);
  return updatedUser;
};

export const completeOnboarding = async (userId: UserId): Promise<void> => {
  const user = await users.get(userId);
  if (!user || user.id !== userId) return;
  await users.put({ ...user, hasCompletedOnboarding: true });
};

export const getDailyFoodLogs = async (userId: UserId, date: ISODate): Promise<FoodItem[]> => {
  return foodItems.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

export const saveRecipe = async (recipe: Recipe): Promise<RecipeId> => {
  const id = await recipes.add(recipe);
  return makeRecipeId(id);
};

export const updateUserProfile = async (
  profile: UserProfile,
  requestingUserId: UserId,
): Promise<void> => {
  if (profile.id !== requestingUserId)
    throw new Error("Unauthorized: cannot modify another user's profile");
  await users.put(profile);
};

export const deleteFoodItem = async (id: FoodItemId, userId: UserId): Promise<void> => {
  const item = await foodItems.get(id);
  if (!item || item.userId !== userId) return;
  await foodItems.delete(id);
};

export const getAllFoodLogs = async (userId: UserId): Promise<FoodItem[]> => {
  return foodItems.where("userId").equals(userId).toArray();
};

export const getAllRecipes = async (userId: UserId): Promise<Recipe[]> => {
  return recipes.where("userId").equals(userId).toArray();
};

export const deleteRecipe = async (id: RecipeId, userId: UserId): Promise<void> => {
  const recipe = await recipes.get(id);
  if (!recipe || recipe.userId !== userId) return;
  await recipes.delete(id);
};

export const updateRecipe = async (recipe: Recipe, userId: UserId): Promise<void> => {
  if (!recipe.id) throw new Error("Recipe id required for update");
  const existing = await recipes.get(recipe.id);
  if (!existing || existing.userId !== userId) {
    throw new Error("Unauthorized: cannot modify another user's recipe");
  }
  await recipes.put({ ...recipe, userId });
};

export const getFoodItemById = async (
  id: FoodItemId,
  userId: UserId,
): Promise<FoodItem | undefined> => {
  const item = await foodItems.get(id);
  return item?.userId === userId ? item : undefined;
};

export const getRecentFoodItems = async (userId: UserId): Promise<FoodItem[]> => {
  const allItems = await foodItems.where("userId").equals(userId).toArray();
  const seen = new Map<string, FoodItem>();
  for (const item of allItems.reverse()) {
    if (!seen.has(item.name)) seen.set(item.name, item);
  }
  return Array.from(seen.values());
};

export const toggleFavoriteFoodItem = async (
  id: FoodItemId,
  isFavorite: boolean,
  userId: UserId,
): Promise<void> => {
  const item = await foodItems.get(id);
  if (!item || item.userId !== userId) return;
  await foodItems.update(id, { isFavorite });
};

export const getFavoriteFoodItems = async (userId: UserId): Promise<FoodItem[]> => {
  return foodItems
    .where("userId")
    .equals(userId)
    .filter((item) => item.isFavorite)
    .toArray();
};

export const updateFoodItem = async (
  id: FoodItemId,
  updates: Partial<Omit<FoodItem, "id" | "userId">>,
  userId: UserId,
): Promise<void> => {
  const item = await foodItems.get(id);
  if (!item || item.userId !== userId) return;
  await foodItems.update(id, updates);
};

// --- Water Log CRUD ---

export const addWaterLog = async (log: WaterLog): Promise<WaterLogId> => {
  const id = await waterLogs.add(log);
  return makeWaterLogId(id);
};

export const getDailyWaterLogs = async (userId: UserId, date: ISODate): Promise<WaterLog[]> => {
  return waterLogs.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

export const getAllWaterLogs = async (userId: UserId): Promise<WaterLog[]> => {
  return waterLogs.where("userId").equals(userId).toArray();
};

export const deleteWaterLog = async (id: WaterLogId, userId: UserId): Promise<void> => {
  const log = await waterLogs.get(id);
  if (!log || log.userId !== userId) return;
  await waterLogs.delete(id);
};

// --- Body Measurement CRUD ---

export const addBodyMeasurement = async (m: BodyMeasurement): Promise<BodyMeasurementId> => {
  const id = await bodyMeasurements.add(m);
  return makeBodyMeasurementId(id);
};

export const getAllBodyMeasurements = async (userId: UserId): Promise<BodyMeasurement[]> => {
  return bodyMeasurements.where("userId").equals(userId).sortBy("measuredAt");
};

export const deleteBodyMeasurement = async (
  id: BodyMeasurementId,
  userId: UserId,
): Promise<void> => {
  const m = await bodyMeasurements.get(id);
  if (!m || m.userId !== userId) return;
  await bodyMeasurements.delete(id);
};

// --- User Achievement CRUD ---

export const addUserAchievement = async (a: UserAchievement): Promise<UserAchievementId> => {
  const id = await userAchievements.add(a);
  return makeUserAchievementId(id);
};

export const getUnlockedAchievements = async (userId: UserId): Promise<UserAchievement[]> => {
  return userAchievements.where("userId").equals(userId).toArray();
};

export const getUnlockedAchievementIds = async (userId: UserId): Promise<Set<string>> => {
  const rows = await userAchievements.where("userId").equals(userId).toArray();
  return new Set(rows.map((r) => r.achievementId));
};

// --- Step Log CRUD ---

export const addStepLog = async (log: StepLog): Promise<StepLogId> => {
  const id = await stepLogs.add(log);
  return makeStepLogId(id);
};

export const getDailyStepLogs = async (userId: UserId, date: ISODate): Promise<StepLog[]> => {
  return stepLogs.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

export const getAllStepLogs = async (userId: UserId): Promise<StepLog[]> => {
  return stepLogs.where("userId").equals(userId).toArray();
};

export const deleteStepLog = async (id: StepLogId, userId: UserId): Promise<void> => {
  const log = await stepLogs.get(id);
  if (!log || log.userId !== userId) return;
  await stepLogs.delete(id);
};

// --- TDEE Profile CRUD ---

export const getTdeeProfile = async (userId: UserId): Promise<TdeeProfile | undefined> => {
  return tdeeProfiles.where("userId").equals(userId).first();
};

export const saveTdeeProfile = async (profile: TdeeProfile): Promise<void> => {
  const existing = await getTdeeProfile(profile.userId);
  if (existing?.id !== undefined) {
    await tdeeProfiles.put({ ...profile, id: existing.id });
  } else {
    await tdeeProfiles.add(profile);
  }
};

// --- Activity Log CRUD ---

export const addActivityLog = async (log: ActivityLog): Promise<ActivityLogId> => {
  const id = await activityLogs.add(log);
  return makeActivityLogId(id);
};

export const getDailyActivityLogs = async (
  userId: UserId,
  date: ISODate,
): Promise<ActivityLog[]> => {
  return activityLogs.where("[userId+dateLogged]").equals([userId, date]).toArray();
};

export const getAllActivityLogs = async (userId: UserId): Promise<ActivityLog[]> => {
  return activityLogs.where("userId").equals(userId).toArray();
};

export const deleteActivityLog = async (id: ActivityLogId, userId: UserId): Promise<void> => {
  const log = await activityLogs.get(id);
  if (!log || log.userId !== userId) return;
  await activityLogs.delete(id);
};

// --- Fasting Session CRUD ---

export const startFastingSession = async (session: FastingSession): Promise<FastingSessionId> => {
  const id = await fastingSessions.add(session);
  return makeFastingSessionId(id);
};

export const endFastingSession = async (
  id: FastingSessionId,
  userId: UserId,
  completed: boolean,
): Promise<void> => {
  const session = await fastingSessions.get(id);
  if (!session || session.userId !== userId) return;
  await fastingSessions.update(id, {
    endTime: new Date().toISOString(),
    completed,
  });
};

export const getActiveFastingSession = async (userId: UserId): Promise<FastingSession | null> => {
  return (
    (await fastingSessions
      .where("userId")
      .equals(userId)
      .filter((s) => s.endTime === null)
      .first()) ?? null
  );
};

export const getAllFastingSessions = async (userId: UserId): Promise<FastingSession[]> => {
  return fastingSessions.where("userId").equals(userId).toArray();
};

// --- Data Export / Import ---

export interface BackupPayload {
  version: number;
  exportedAt: string;
  userId: string;
  tables: {
    foodItems: FoodItem[];
    recipes: Recipe[];
    waterLogs: WaterLog[];
    bodyMeasurements: BodyMeasurement[];
    userAchievements: UserAchievement[];
    stepLogs: StepLog[];
    tdeeProfile: TdeeProfile | null;
    activityLogs: ActivityLog[];
    fastingSessions: FastingSession[];
  };
}

export const BACKUP_VERSION = 1;

export const exportAllData = async (userId: UserId): Promise<BackupPayload> => {
  const [
    foodItemsData,
    recipesData,
    waterLogsData,
    bodyMeasurementsData,
    userAchievementsData,
    stepLogsData,
    tdeeProfileData,
    activityLogsData,
    fastingSessionsData,
  ] = await Promise.all([
    getAllFoodLogs(userId),
    getAllRecipes(userId),
    getAllWaterLogs(userId),
    getAllBodyMeasurements(userId),
    userAchievements.where("userId").equals(userId).toArray(),
    getAllStepLogs(userId),
    getTdeeProfile(userId),
    getAllActivityLogs(userId),
    getAllFastingSessions(userId),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    userId,
    tables: {
      foodItems: foodItemsData,
      recipes: recipesData,
      waterLogs: waterLogsData,
      bodyMeasurements: bodyMeasurementsData,
      userAchievements: userAchievementsData,
      stepLogs: stepLogsData,
      tdeeProfile: tdeeProfileData ?? null,
      activityLogs: activityLogsData,
      fastingSessions: fastingSessionsData,
    },
  };
};

export interface ImportResult {
  imported: Record<string, number>;
  skipped: number;
}

export const importBackup = async (
  payload: BackupPayload,
  userId: UserId,
): Promise<ImportResult> => {
  const result: ImportResult = { imported: {}, skipped: 0 };
  const t = payload.tables;

  const addAll = async <T extends { id?: unknown }>(table: Table<T>, rows: T[], label: string) => {
    let count = 0;
    for (const row of rows) {
      try {
        const { id: _, ...rest } = row as T & { id?: unknown };
        await table.add({ ...rest, userId } as unknown as T);
        count++;
      } catch {
        result.skipped++;
      }
    }
    result.imported[label] = count;
  };

  await addAll(foodItems, t.foodItems, "foodItems");
  await addAll(recipes, t.recipes, "recipes");
  await addAll(waterLogs, t.waterLogs, "waterLogs");
  await addAll(bodyMeasurements, t.bodyMeasurements, "bodyMeasurements");
  await addAll(stepLogs, t.stepLogs, "stepLogs");
  await addAll(activityLogs, t.activityLogs, "activityLogs");
  await addAll(fastingSessions, t.fastingSessions, "fastingSessions");

  if (t.tdeeProfile) {
    try {
      await saveTdeeProfile({ ...t.tdeeProfile, userId, id: undefined });
      result.imported["tdeeProfile"] = 1;
    } catch {
      result.skipped++;
    }
  }

  return result;
};

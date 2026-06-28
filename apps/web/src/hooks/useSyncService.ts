import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "../state/AppState";
import { api, ApiError, isAuthenticated } from "../lib/apiClient";
import {
  type ActivityLog,
  activityLogs,
  type BodyMeasurement,
  bodyMeasurements,
  type DietProfile,
  dietProfiles,
  type FastingSession,
  fastingSessions,
  type FoodItem,
  foodItems,
  type MealTemplate,
  type MealTemplateFood,
  mealTemplates,
  type Recipe,
  recipes,
  type Reminder,
  reminders,
  saveTdeeProfile,
  type StepLog,
  stepLogs,
  syncQueue,
  type SyncQueueEntry,
  type TdeeProfile,
  tdeeProfiles,
  type WaterLog,
  waterLogs,
} from "../db/dbService";
import { decryptBlob, deriveKey, encryptBlob } from "../lib/e2eEncryption";
import { clearE2EKey, getE2EKey, setE2EKey } from "../lib/e2eKeyStore";
import type { DietPreset, ReminderType, RestrictionFlag, SyncBlobPayload, UserId } from "@/types";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/;

interface ServerFoodItem {
  id: string;
  name: string;
  calories: number;
  servingSize: number;
  protein: number;
  carbs: number;
  fat: number;
  dateLogged: string;
  mealType?: string;
  isFavorite: boolean;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerWaterLog {
  id: string;
  amount: number;
  dateLogged: string;
  loggedAt?: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerActivityLog {
  id: string;
  activityType: string;
  durationMin: number;
  caloriesBurned: number;
  dateLogged: string;
  loggedAt?: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerBodyMeasurement {
  id: string;
  weightKg?: number;
  bodyFatPct?: number;
  dateLogged: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerStepLog {
  id: string;
  steps: number;
  dateLogged: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerFastingSession {
  id: string;
  startTime: string;
  endTime?: string;
  targetHours: number;
  dateLogged: string;
  completed: boolean;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerTdeeProfile {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activityLevel: string;
  goal: string;
  updatedAt: string;
}

interface ServerRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: { foodItemId: string; quantity: number; serving: number }[];
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  createdBy: string;
  dateCreated: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerMealTemplate {
  id: string;
  name: string;
  foods: MealTemplateFood[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerReminder {
  id: string;
  type: string;
  time: string;
  daysOfWeek: number;
  enabled: boolean;
  updatedAt: string;
  deletedAt?: string;
}

interface ServerDietProfile {
  id: string;
  preset: string;
  restrictions: string[];
  updatedAt: string;
  deletedAt?: string;
}

async function pullFoodItems(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerFoodItem[]>(
    `/api/v1/food-items/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await foodItems.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await foodItems.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      name: item.name,
      calories: item.calories,
      servingSize: item.servingSize,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      dateLogged: item.dateLogged as Parameters<typeof foodItems.put>[0]["dateLogged"],
      isFavorite: item.isFavorite,
      mealType: item.mealType as Parameters<typeof foodItems.put>[0]["mealType"],
      syncId: item.id,
    };
    if (existing?.id != null) {
      await foodItems.update(existing.id, record);
    } else {
      await foodItems.add(record);
    }
  }
}

async function pullWaterLogs(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerWaterLog[]>(
    `/api/v1/water-logs/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await waterLogs.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await waterLogs.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      amount: item.amount,
      dateLogged: item.dateLogged as Parameters<typeof waterLogs.put>[0]["dateLogged"],
      loggedAt: item.loggedAt ?? item.updatedAt,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await waterLogs.update(existing.id, record);
    } else {
      await waterLogs.add(record);
    }
  }
}

async function pullActivityLogs(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerActivityLog[]>(
    `/api/v1/activity-logs/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await activityLogs.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await activityLogs.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      activityType: item.activityType,
      durationMin: item.durationMin,
      caloriesBurned: item.caloriesBurned,
      dateLogged: item.dateLogged as Parameters<typeof activityLogs.put>[0]["dateLogged"],
      loggedAt: item.loggedAt ?? item.updatedAt,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await activityLogs.update(existing.id, record);
    } else {
      await activityLogs.add(record);
    }
  }
}

async function pullBodyMeasurements(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerBodyMeasurement[]>(
    `/api/v1/body-measurements/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await bodyMeasurements.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await bodyMeasurements.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      measuredAt: item.dateLogged as Parameters<typeof bodyMeasurements.put>[0]["measuredAt"],
      weight: item.weightKg,
      bodyFat: item.bodyFatPct,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await bodyMeasurements.update(existing.id, record);
    } else {
      await bodyMeasurements.add(record);
    }
  }
}

async function pullStepLogs(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerStepLog[]>(
    `/api/v1/step-logs/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await stepLogs.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await stepLogs.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      steps: item.steps,
      dateLogged: item.dateLogged as Parameters<typeof stepLogs.put>[0]["dateLogged"],
      loggedAt: item.updatedAt,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await stepLogs.update(existing.id, record);
    } else {
      await stepLogs.add(record);
    }
  }
}

async function pullFastingSessions(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerFastingSession[]>(
    `/api/v1/fasting-sessions/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await fastingSessions.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await fastingSessions.delete(existing.id);
      continue;
    }
    const record = {
      userId,
      startTime: item.startTime,
      endTime: item.endTime ?? null,
      targetHours: item.targetHours,
      dateLogged: item.dateLogged as Parameters<typeof fastingSessions.put>[0]["dateLogged"],
      completed: item.completed,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await fastingSessions.update(existing.id, record);
    } else {
      await fastingSessions.add(record);
    }
  }
}

async function pullTdeeProfile(userId: UserId): Promise<void> {
  let profile: ServerTdeeProfile | null;
  try {
    profile = await api.get<ServerTdeeProfile>("/api/v1/tdee-profile");
  } catch {
    return;
  }
  if (!profile) return;
  const local = await tdeeProfiles.where("userId").equals(userId).first();
  const merged: TdeeProfile = {
    id: local?.id,
    userId,
    age: profile.age,
    sex: profile.sex as TdeeProfile["sex"],
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    targetWeightKg: profile.targetWeightKg,
    activityLevel: profile.activityLevel as TdeeProfile["activityLevel"],
    goal: profile.goal as TdeeProfile["goal"],
    updatedAt: profile.updatedAt,
  };
  await saveTdeeProfile(merged);
}

async function pullRecipes(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerRecipe[]>(
    `/api/v1/recipes/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await recipes.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await recipes.delete(existing.id);
      continue;
    }
    const record: Recipe = {
      userId,
      name: item.name,
      description: item.description,
      ingredients: item.ingredients.map((ing) => ({
        foodItemId: ing.foodItemId as unknown as Recipe["ingredients"][0]["foodItemId"],
        quantity: ing.quantity,
        serving: ing.serving,
      })),
      totalCalories: item.totalCalories,
      totalProtein: item.totalProtein,
      totalCarbs: item.totalCarbs,
      totalFat: item.totalFat,
      createdBy: item.createdBy as UserId,
      dateCreated: item.dateCreated,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await recipes.put({ ...record, id: existing.id });
    } else {
      await recipes.add(record);
    }
  }
}

async function pullMealTemplates(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerMealTemplate[]>(
    `/api/v1/meal-templates/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await mealTemplates.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await mealTemplates.delete(existing.id);
      continue;
    }
    const record: MealTemplate = {
      userId,
      name: item.name,
      foods: item.foods,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await mealTemplates.put({ ...record, id: existing.id });
    } else {
      await mealTemplates.add(record);
    }
  }
}

async function pullReminders(userId: UserId, since: string): Promise<void> {
  const items = await api.get<ServerReminder[]>(
    `/api/v1/reminders/changes?since=${encodeURIComponent(since)}`,
  );
  for (const item of items) {
    const existing = await reminders.where("syncId").equals(item.id).first();
    if (item.deletedAt) {
      if (existing?.id != null) await reminders.delete(existing.id);
      continue;
    }
    const record: Reminder = {
      userId,
      type: item.type as ReminderType,
      time: item.time,
      daysOfWeek: item.daysOfWeek,
      enabled: item.enabled,
      syncId: item.id,
    };
    if (existing?.id != null) {
      await reminders.update(existing.id, record);
    } else {
      await reminders.add(record);
    }
  }
}

async function pullDietProfile(userId: UserId): Promise<void> {
  let profile: ServerDietProfile | null;
  try {
    profile = await api.get<ServerDietProfile>("/api/v1/diet-profile");
  } catch {
    return;
  }
  if (!profile) return;
  const existing = await dietProfiles.where("userId").equals(userId).first();
  const record: DietProfile = {
    id: existing?.id,
    userId,
    preset: profile.preset as DietPreset,
    restrictions: profile.restrictions as RestrictionFlag[],
    updatedAt: profile.updatedAt,
    syncId: profile.id,
  };
  if (existing?.id != null) {
    await dietProfiles.put({ ...record, id: existing.id });
  } else {
    await dietProfiles.add(record);
  }
}

async function flushQueueEntry(entry: SyncQueueEntry): Promise<void> {
  const { entityType, operation, payload, syncId } = entry;

  const entityPaths: Record<string, string> = {
    foodItem: "/api/v1/food-items",
    waterLog: "/api/v1/water-logs",
    activityLog: "/api/v1/activity-logs",
    bodyMeasurement: "/api/v1/body-measurements",
    stepLog: "/api/v1/step-logs",
    fastingSession: "/api/v1/fasting-sessions",
    tdeeProfile: "/api/v1/tdee-profile",
    recipe: "/api/v1/recipes",
    mealTemplate: "/api/v1/meal-templates",
    reminder: "/api/v1/reminders",
    dietProfile: "/api/v1/diet-profile",
  };
  const basePath = entityPaths[entityType];
  if (!basePath) return;

  if (operation === "delete") {
    await api.delete(`${basePath}/${syncId}`);
  } else if (operation === "create") {
    await api.post(basePath, payload);
  } else {
    await api.put(`${basePath}/${syncId}`, payload);
  }
}

async function flushQueue(onStart?: (count: number) => void): Promise<void> {
  const entries = await syncQueue.orderBy("createdAt").toArray();
  onStart?.(entries.length);
  for (const entry of entries) {
    try {
      await flushQueueEntry(entry);
      if (entry.id != null) await syncQueue.delete(entry.id);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        if (entry.id != null) await syncQueue.delete(entry.id);
      } else {
        const retries = (entry.retries ?? 0) + 1;
        if (retries >= MAX_RETRIES) {
          if (entry.id != null) await syncQueue.delete(entry.id);
        } else if (entry.id != null) {
          await syncQueue.update(entry.id, { retries });
        }
      }
    }
  }
}

interface EncryptedBlobDto {
  clientBlobId: string;
  iv: string;
  ciphertext: string;
  updatedAt: string | null;
  isDeleted: boolean;
}

async function applyRemoteDelete(entityType: string, syncId: string): Promise<void> {
  switch (entityType) {
    case "foodItem": {
      const existing = await foodItems.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await foodItems.delete(existing.id);
      break;
    }
    case "waterLog": {
      const existing = await waterLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await waterLogs.delete(existing.id);
      break;
    }
    case "activityLog": {
      const existing = await activityLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await activityLogs.delete(existing.id);
      break;
    }
    case "bodyMeasurement": {
      const existing = await bodyMeasurements.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await bodyMeasurements.delete(existing.id);
      break;
    }
    case "stepLog": {
      const existing = await stepLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await stepLogs.delete(existing.id);
      break;
    }
    case "fastingSession": {
      const existing = await fastingSessions.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await fastingSessions.delete(existing.id);
      break;
    }
    case "recipe": {
      const existing = await recipes.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await recipes.delete(existing.id);
      break;
    }
    case "mealTemplate": {
      const existing = await mealTemplates.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await mealTemplates.delete(existing.id);
      break;
    }
    case "reminder": {
      const existing = await reminders.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await reminders.delete(existing.id);
      break;
    }
    case "dietProfile": {
      const existing = await dietProfiles.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) await dietProfiles.delete(existing.id);
      break;
    }
    default:
      break;
  }
}

async function applyRemoteUpsert(userId: UserId, decoded: SyncBlobPayload): Promise<void> {
  const { entityType, syncId, payload } = decoded;
  switch (entityType) {
    case "foodItem": {
      const record = { ...(payload as FoodItem), userId, syncId };
      const existing = await foodItems.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await foodItems.update(existing.id, record);
      } else {
        await foodItems.add(record);
      }
      break;
    }
    case "waterLog": {
      const record = { ...(payload as WaterLog), userId, syncId };
      const existing = await waterLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await waterLogs.update(existing.id, record);
      } else {
        await waterLogs.add(record);
      }
      break;
    }
    case "activityLog": {
      const record = { ...(payload as ActivityLog), userId, syncId };
      const existing = await activityLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await activityLogs.update(existing.id, record);
      } else {
        await activityLogs.add(record);
      }
      break;
    }
    case "bodyMeasurement": {
      const record = { ...(payload as BodyMeasurement), userId, syncId };
      const existing = await bodyMeasurements.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await bodyMeasurements.update(existing.id, record);
      } else {
        await bodyMeasurements.add(record);
      }
      break;
    }
    case "stepLog": {
      const record = { ...(payload as StepLog), userId, syncId };
      const existing = await stepLogs.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await stepLogs.update(existing.id, record);
      } else {
        await stepLogs.add(record);
      }
      break;
    }
    case "fastingSession": {
      const record = { ...(payload as FastingSession), userId, syncId };
      const existing = await fastingSessions.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await fastingSessions.update(existing.id, record);
      } else {
        await fastingSessions.add(record);
      }
      break;
    }
    case "recipe": {
      const record = { ...(payload as Recipe), userId, syncId };
      const existing = await recipes.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await recipes.put({ ...record, id: existing.id });
      } else {
        await recipes.add(record);
      }
      break;
    }
    case "mealTemplate": {
      const record = { ...(payload as MealTemplate), userId, syncId };
      const existing = await mealTemplates.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await mealTemplates.put({ ...record, id: existing.id });
      } else {
        await mealTemplates.add(record);
      }
      break;
    }
    case "reminder": {
      const record = { ...(payload as Reminder), userId, syncId };
      const existing = await reminders.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await reminders.put({ ...record, id: existing.id });
      } else {
        await reminders.add(record);
      }
      break;
    }
    case "dietProfile": {
      const record = { ...(payload as DietProfile), userId, syncId };
      const existing = await dietProfiles.where("syncId").equals(syncId).first();
      if (existing?.id !== undefined) {
        await dietProfiles.put({ ...record, id: existing.id });
      } else {
        await dietProfiles.add(record);
      }
      break;
    }
    default:
      break;
  }
}

async function flushQueueE2E(userId: UserId, key: CryptoKey): Promise<void> {
  const entries = await syncQueue.where("userId").equals(userId).toArray();
  if (entries.length === 0) return;

  const blobs = await Promise.all(
    entries.map(async (entry) => {
      const plaintext: SyncBlobPayload = {
        entityType: entry.entityType,
        operation: entry.operation,
        syncId: entry.syncId,
        payload: entry.payload,
      };
      const { iv, ciphertext } = await encryptBlob(key, plaintext);
      return {
        clientBlobId: `${entry.entityType}:${entry.syncId}`,
        iv,
        ciphertext,
        updatedAt: null,
        isDeleted: false,
      };
    }),
  );

  await api.post("/api/v1/sync/blobs/batch", blobs);
  await syncQueue.where("userId").equals(userId).delete();
}

async function pullBlobsE2E(userId: UserId, key: CryptoKey, since: string): Promise<void> {
  const blobs = await api.get<EncryptedBlobDto[]>(
    `/api/v1/sync/blobs?since=${encodeURIComponent(since)}`,
  );

  for (const blob of blobs) {
    if (blob.isDeleted) {
      const colonIdx = blob.clientBlobId.indexOf(":");
      const entityType = blob.clientBlobId.slice(0, colonIdx);
      const syncId = blob.clientBlobId.slice(colonIdx + 1);
      await applyRemoteDelete(entityType, syncId);
      continue;
    }
    const decoded = (await decryptBlob(key, blob.iv, blob.ciphertext)) as SyncBlobPayload;
    await applyRemoteUpsert(userId, decoded);
  }
}

async function enqueueAllLocalData(userId: UserId): Promise<void> {
  const now = new Date().toISOString();

  const [
    allFoodItems,
    allWaterLogs,
    allActivityLogs,
    allBodyMeasurements,
    allStepLogs,
    allFastingSessions,
    allRecipes,
    allMealTemplates,
    allReminders,
    allDietProfiles,
  ] = await Promise.all([
    foodItems.where("userId").equals(userId).toArray(),
    waterLogs.where("userId").equals(userId).toArray(),
    activityLogs.where("userId").equals(userId).toArray(),
    bodyMeasurements.where("userId").equals(userId).toArray(),
    stepLogs.where("userId").equals(userId).toArray(),
    fastingSessions.where("userId").equals(userId).toArray(),
    recipes.where("userId").equals(userId).toArray(),
    mealTemplates.where("userId").equals(userId).toArray(),
    reminders.where("userId").equals(userId).toArray(),
    dietProfiles.where("userId").equals(userId).toArray(),
  ]);

  type QueueEntry = Omit<SyncQueueEntry, "id" | "retries">;
  const entries: QueueEntry[] = [
    ...allFoodItems
      .filter((item) => item.syncId !== undefined)
      .map((item) => ({
        userId,
        entityType: "foodItem" as const,
        syncId: item.syncId as string,
        operation: "update" as const,
        payload: item,
        createdAt: now,
      })),
    ...allWaterLogs
      .filter((log) => log.syncId !== undefined)
      .map((log) => ({
        userId,
        entityType: "waterLog" as const,
        syncId: log.syncId as string,
        operation: "update" as const,
        payload: log,
        createdAt: now,
      })),
    ...allActivityLogs
      .filter((log) => log.syncId !== undefined)
      .map((log) => ({
        userId,
        entityType: "activityLog" as const,
        syncId: log.syncId as string,
        operation: "update" as const,
        payload: log,
        createdAt: now,
      })),
    ...allBodyMeasurements
      .filter((m) => m.syncId !== undefined)
      .map((m) => ({
        userId,
        entityType: "bodyMeasurement" as const,
        syncId: m.syncId as string,
        operation: "update" as const,
        payload: m,
        createdAt: now,
      })),
    ...allStepLogs
      .filter((log) => log.syncId !== undefined)
      .map((log) => ({
        userId,
        entityType: "stepLog" as const,
        syncId: log.syncId as string,
        operation: "update" as const,
        payload: log,
        createdAt: now,
      })),
    ...allFastingSessions
      .filter((s) => s.syncId !== undefined)
      .map((s) => ({
        userId,
        entityType: "fastingSession" as const,
        syncId: s.syncId as string,
        operation: "update" as const,
        payload: s,
        createdAt: now,
      })),
    ...allRecipes
      .filter((r) => r.syncId !== undefined)
      .map((r) => ({
        userId,
        entityType: "recipe" as const,
        syncId: r.syncId as string,
        operation: "update" as const,
        payload: r,
        createdAt: now,
      })),
    ...allMealTemplates
      .filter((t) => t.syncId !== undefined)
      .map((t) => ({
        userId,
        entityType: "mealTemplate" as const,
        syncId: t.syncId as string,
        operation: "update" as const,
        payload: t,
        createdAt: now,
      })),
    ...allReminders
      .filter((r) => r.syncId !== undefined)
      .map((r) => ({
        userId,
        entityType: "reminder" as const,
        syncId: r.syncId as string,
        operation: "update" as const,
        payload: r,
        createdAt: now,
      })),
    ...allDietProfiles
      .filter((p) => p.syncId !== undefined)
      .map((p) => ({
        userId,
        entityType: "dietProfile" as const,
        syncId: p.syncId as string,
        operation: "update" as const,
        payload: p,
        createdAt: now,
      })),
  ];

  if (entries.length === 0) return;
  await syncQueue.bulkAdd(entries.map((e) => ({ ...e, retries: 0 })));
}

/** Activates E2E encryption: stores salt, derives key, migrates all local data to ciphertext. */
export async function activateE2E(userId: UserId, passphrase: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...salt));
  await api.post("/api/v1/sync/e2e-config", { salt: saltB64 });

  const key = await deriveKey(passphrase, salt);
  setE2EKey(key);

  await api.post("/api/v1/sync/reset", {});
  await enqueueAllLocalData(userId);
  await flushQueueE2E(userId, key);

  const { setE2EEnabled, setE2EKeyReady } = useAppState.getState();
  setE2EEnabled(true);
  setE2EKeyReady(true);
}

export function useSyncService() {
  const setSyncStatus = useAppState((s) => s.setSyncStatus);
  const setLastSyncedAt = useAppState((s) => s.setLastSyncedAt);
  const setSyncError = useAppState((s) => s.setSyncError);
  const setPendingSyncCount = useAppState((s) => s.setPendingSyncCount);
  const lastSyncedAt = useAppState((s) => s.lastSyncedAt);
  const userId = useAppState((s) => s.userId);
  const fetchInitialData = useAppState((s) => s.fetchInitialData);
  const syncingRef = useRef(false);

  const runSync = useCallback(async () => {
    if (!isAuthenticated() || !userId || syncingRef.current) return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const raw = lastSyncedAt;
      const since = raw !== null && ISO_RE.test(raw) ? raw : new Date(0).toISOString();
      const { e2eEnabled } = useAppState.getState();

      if (e2eEnabled) {
        const key = getE2EKey();
        if (key === undefined) {
          setSyncStatus("idle");
          return;
        }
        await flushQueueE2E(userId, key);
        await pullBlobsE2E(userId, key, since);
      } else {
        await flushQueue((count) => setPendingSyncCount(count));
        setPendingSyncCount(0);
        await Promise.all([
          pullFoodItems(userId, since),
          pullWaterLogs(userId, since),
          pullActivityLogs(userId, since),
          pullBodyMeasurements(userId, since),
          pullStepLogs(userId, since),
          pullFastingSessions(userId, since),
          pullTdeeProfile(userId),
          pullRecipes(userId, since),
          pullMealTemplates(userId, since),
          pullReminders(userId, since),
          pullDietProfile(userId),
        ]);
      }

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await fetchInitialData(userId);
    } catch (err) {
      if (err instanceof DOMException) {
        clearE2EKey();
        setSyncError("Incorrect passphrase - unlock sync to continue");
      } else if (err instanceof ApiError && err.status === 401) {
        setSyncStatus("idle");
      } else if (!navigator.onLine) {
        setSyncStatus("offline");
      } else {
        const raw = err instanceof Error ? err.message : "";
        setSyncError(raw.length > 0 && raw.length <= 120 ? raw : "Sync failed");
      }
    } finally {
      syncingRef.current = false;
    }
  }, [
    userId,
    lastSyncedAt,
    setSyncStatus,
    setLastSyncedAt,
    setSyncError,
    setPendingSyncCount,
    fetchInitialData,
  ]);

  useEffect(() => {
    if (!isAuthenticated()) return;

    void runSync();

    const interval = setInterval(() => void runSync(), SYNC_INTERVAL_MS);

    const handleOnline = () => void runSync();
    const handleFocus = () => void runSync();
    const handleManualSync = () => void runSync();
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("gc:sync", handleManualSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("gc:sync", handleManualSync);
    };
  }, [runSync]);

  return { runSync };
}

export async function enqueueSyncOperation(
  entry: Omit<SyncQueueEntry, "id" | "retries" | "createdAt">,
): Promise<void> {
  if (!isAuthenticated()) return;
  await syncQueue.add({
    ...entry,
    retries: 0,
    createdAt: new Date().toISOString(),
  });
}

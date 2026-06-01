import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "../state/AppState";
import { api, ApiError, isAuthenticated } from "../lib/apiClient";
import {
  activityLogs,
  bodyMeasurements,
  fastingSessions,
  foodItems,
  saveTdeeProfile,
  stepLogs,
  syncQueue,
  type SyncQueueEntry,
  type TdeeProfile,
  tdeeProfiles,
  waterLogs,
} from "../db/dbService";
import type { UserId } from "@/types";

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

async function flushQueue(): Promise<void> {
  const entries = await syncQueue.orderBy("createdAt").toArray();
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

export function useSyncService() {
  const setSyncStatus = useAppState((s) => s.setSyncStatus);
  const setLastSyncedAt = useAppState((s) => s.setLastSyncedAt);
  const setSyncError = useAppState((s) => s.setSyncError);
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
      await flushQueue();
      await Promise.all([
        pullFoodItems(userId, since),
        pullWaterLogs(userId, since),
        pullActivityLogs(userId, since),
        pullBodyMeasurements(userId, since),
        pullStepLogs(userId, since),
        pullFastingSessions(userId, since),
        pullTdeeProfile(userId),
      ]);
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await fetchInitialData(userId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
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
  }, [userId, lastSyncedAt, setSyncStatus, setLastSyncedAt, setSyncError, fetchInitialData]);

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

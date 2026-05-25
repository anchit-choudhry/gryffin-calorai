import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addActivityLog,
  addFoodItemLog,
  addWaterLog,
  BACKUP_VERSION,
  type BackupPayload,
  db,
  detectConflicts,
  exportAllData,
  getOrCreateUser,
  importBackup,
  initializeDB,
  saveTdeeProfile,
  startFastingSession,
} from "./dbService";
import { ISODate, UserId } from "../types";

const userId = UserId("export-test-user");

describe("exportAllData / importBackup", () => {
  beforeAll(async () => {
    await db.delete();
    await db.open();
    await initializeDB();
    await getOrCreateUser(userId, "Export Test", "export@test.com");
  });

  afterAll(async () => {
    await db.delete();
  });

  it("exports empty data for a new user", async () => {
    const payload = await exportAllData(userId);
    expect(payload.version).toBe(BACKUP_VERSION);
    expect(payload.userId).toBe(userId);
    expect(payload.tables.foodItems).toStrictEqual([]);
    expect(payload.tables.waterLogs).toStrictEqual([]);
    expect(payload.tables.activityLogs).toStrictEqual([]);
    expect(payload.tables.fastingSessions).toStrictEqual([]);
  });

  it("exports food items", async () => {
    await addFoodItemLog({
      userId,
      name: "Banana",
      calories: 105,
      servingSize: 1,
      protein: 1,
      carbs: 27,
      fat: 0,
      dateLogged: ISODate("2026-05-20"),
      isFavorite: false,
    });

    const payload = await exportAllData(userId);
    expect(payload.tables.foodItems.length).toBeGreaterThanOrEqual(1);
    expect(payload.tables.foodItems[0]!.name).toBe("Banana");
  });

  it("exports water logs", async () => {
    await addWaterLog({
      userId,
      amount: 250,
      dateLogged: ISODate("2026-05-20"),
      loggedAt: new Date().toISOString(),
    });
    const payload = await exportAllData(userId);
    expect(payload.tables.waterLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("exports activity logs", async () => {
    await addActivityLog({
      userId,
      activityType: "Walking (moderate, 3 mph)",
      durationMin: 20,
      caloriesBurned: 85,
      dateLogged: ISODate("2026-05-20"),
      loggedAt: new Date().toISOString(),
    });
    const payload = await exportAllData(userId);
    expect(payload.tables.activityLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("exports fasting sessions", async () => {
    await startFastingSession({
      userId,
      startTime: new Date().toISOString(),
      endTime: null,
      targetHours: 14,
      dateLogged: ISODate("2026-05-20"),
      completed: false,
    });
    const payload = await exportAllData(userId);
    expect(payload.tables.fastingSessions.length).toBeGreaterThanOrEqual(1);
  });

  it("exports tdeeProfile when set", async () => {
    await saveTdeeProfile({
      userId,
      age: 28,
      sex: "female",
      heightCm: 162,
      weightKg: 58,
      activityLevel: "light",
      goal: "maintain",
      updatedAt: new Date().toISOString(),
    });
    const payload = await exportAllData(userId);
    expect(payload.tables.tdeeProfile).not.toBeNull();
    expect(payload.tables.tdeeProfile!.age).toBe(28);
  });

  it("round-trip: export then import restores food items", async () => {
    const importUser = UserId("import-test-user");
    await getOrCreateUser(importUser, "Import Test", "import@test.com");

    const payload = await exportAllData(userId);

    const result = await importBackup(payload as BackupPayload, importUser);
    expect(result.imported.foodItems).toBeGreaterThanOrEqual(1);
  });

  it("importBackup reports imported counts on repeated call", async () => {
    const importUser = UserId("import-dup-user");
    await getOrCreateUser(importUser, "Dup Test", "dup@test.com");

    const payload = await exportAllData(userId);

    const r1 = await importBackup(payload as BackupPayload, importUser);
    const r2 = await importBackup(payload as BackupPayload, importUser);

    expect(r1.imported.foodItems).toBeGreaterThanOrEqual(1);
    expect(r2.imported.foodItems).toBeGreaterThanOrEqual(1);
  });

  it("exportAllData payload has correct version", async () => {
    const payload = await exportAllData(userId);
    expect(payload.version).toBe(1);
  });
});

describe("detectConflicts", () => {
  const conflictUserId = UserId("conflict-detect-user");

  beforeAll(async () => {
    await db.delete();
    await db.open();
    await initializeDB();
    await getOrCreateUser(conflictUserId, "Conflict User", "conflict@test.com");
  });

  afterAll(async () => {
    await db.delete();
  });

  beforeAll(async () => {
    await addFoodItemLog({
      userId: conflictUserId,
      name: "Apple",
      calories: 80,
      servingSize: 1,
      protein: 0,
      carbs: 20,
      fat: 0,
      dateLogged: ISODate("2026-05-20"),
      isFavorite: false,
    });
    await addFoodItemLog({
      userId: conflictUserId,
      name: "Rice",
      calories: 200,
      servingSize: 1,
      protein: 4,
      carbs: 45,
      fat: 0,
      dateLogged: ISODate("2026-05-21"),
      isFavorite: false,
    });
    await addWaterLog({
      userId: conflictUserId,
      amount: 300,
      dateLogged: ISODate("2026-05-20"),
      loggedAt: new Date().toISOString(),
    });
  });

  it("returns incoming counts matching the backup payload", async () => {
    const payload = await exportAllData(conflictUserId);
    const summary = await detectConflicts(payload as BackupPayload, conflictUserId);
    expect(summary.foodItems.incoming).toBe(2);
    expect(summary.waterLogs.incoming).toBe(1);
  });

  it("returns existing counts for the current user", async () => {
    const payload = await exportAllData(conflictUserId);
    const summary = await detectConflicts(payload as BackupPayload, conflictUserId);
    expect(summary.foodItems.existing).toBeGreaterThanOrEqual(2);
    expect(summary.waterLogs.existing).toBeGreaterThanOrEqual(1);
  });

  it("returns zero incoming for empty backup tables", async () => {
    const payload = await exportAllData(conflictUserId);
    const summary = await detectConflicts(payload as BackupPayload, conflictUserId);
    expect(summary.recipes.incoming).toBe(0);
    expect(summary.bodyMeasurements.incoming).toBe(0);
    expect(summary.stepLogs.incoming).toBe(0);
    expect(summary.activityLogs.incoming).toBe(0);
    expect(summary.fastingSessions.incoming).toBe(0);
  });

  it("returns zero existing for a user with no data", async () => {
    const newUserId = UserId("conflict-new-user");
    await getOrCreateUser(newUserId, "New User", "new@conflict.com");
    const emptyPayload: BackupPayload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      userId: newUserId,
      tables: {
        foodItems: [],
        recipes: [],
        waterLogs: [],
        bodyMeasurements: [],
        userAchievements: [],
        stepLogs: [],
        tdeeProfile: null,
        activityLogs: [],
        fastingSessions: [],
      },
    };
    const summary = await detectConflicts(emptyPayload, newUserId);
    expect(summary.foodItems.existing).toBe(0);
    expect(summary.recipes.existing).toBe(0);
  });
});

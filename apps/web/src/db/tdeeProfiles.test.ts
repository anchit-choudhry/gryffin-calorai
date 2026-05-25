import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, getTdeeProfile, initializeDB, saveTdeeProfile } from "./dbService";
import { UserId } from "../types";

const userId = UserId("tdee-test-user");

describe("tdeeProfiles DB", () => {
  beforeAll(async () => {
    await db.delete();
    await db.open();
    await initializeDB();
  });

  afterAll(async () => {
    await db.delete();
  });

  it("returns undefined when no profile exists", async () => {
    const result = await getTdeeProfile(userId);
    expect(result).toBeUndefined();
  });

  it("saves and retrieves a profile", async () => {
    await saveTdeeProfile({
      userId,
      age: 30,
      sex: "male",
      heightCm: 175,
      weightKg: 70,
      activityLevel: "moderate",
      goal: "maintain",
      updatedAt: new Date().toISOString(),
    });

    const result = await getTdeeProfile(userId);
    expect(result).toBeDefined();
    expect(result!.age).toBe(30);
    expect(result!.sex).toBe("male");
    expect(result!.heightCm).toBe(175);
    expect(result!.weightKg).toBe(70);
    expect(result!.activityLevel).toBe("moderate");
    expect(result!.goal).toBe("maintain");
  });

  it("upserts profile on second save (unique userId)", async () => {
    await saveTdeeProfile({
      userId,
      age: 35,
      sex: "male",
      heightCm: 175,
      weightKg: 75,
      activityLevel: "active",
      goal: "lose",
      updatedAt: new Date().toISOString(),
    });

    const result = await getTdeeProfile(userId);
    expect(result!.age).toBe(35);
    expect(result!.weightKg).toBe(75);
    expect(result!.activityLevel).toBe("active");
    expect(result!.goal).toBe("lose");
  });

  it("different users have independent profiles", async () => {
    const other = UserId("tdee-other-user");
    await saveTdeeProfile({
      userId: other,
      age: 25,
      sex: "female",
      heightCm: 160,
      weightKg: 55,
      activityLevel: "light",
      goal: "gain",
      updatedAt: new Date().toISOString(),
    });

    const resultOther = await getTdeeProfile(other);
    const resultMain = await getTdeeProfile(userId);

    expect(resultOther!.age).toBe(25);
    expect(resultMain!.age).toBe(35);
  });
});

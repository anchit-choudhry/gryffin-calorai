import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type ActivityLog,
  addActivityLog,
  db,
  deleteActivityLog,
  getAllActivityLogs,
  getDailyActivityLogs,
  initializeDB,
} from "./dbService";
import { ActivityLogId, ISODate, UserId } from "../types";

const userId = UserId("activity-test-user");

const makeLog = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  userId,
  activityType: "Running (6 mph)",
  durationMin: 30,
  caloriesBurned: 360,
  dateLogged: ISODate("2026-05-20"),
  loggedAt: new Date().toISOString(),
  ...overrides,
});

describe("activityLogs DB", () => {
  beforeAll(async () => {
    await db.delete();
    await db.open();
    await initializeDB();
  });

  afterAll(async () => {
    await db.delete();
  });

  it("adds and retrieves a daily activity log", async () => {
    await addActivityLog(makeLog());
    const logs = await getDailyActivityLogs(userId, ISODate("2026-05-20"));
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]!.activityType).toBe("Running (6 mph)");
  });

  it("daily query only returns logs for that date", async () => {
    await addActivityLog(makeLog({ dateLogged: ISODate("2026-05-19") }));
    const logs = await getDailyActivityLogs(userId, ISODate("2026-05-20"));
    const allOnDate = logs.every((l) => l.dateLogged === "2026-05-20");
    expect(allOnDate).toBe(true);
  });

  it("getAllActivityLogs returns all logs for user", async () => {
    const all = await getAllActivityLogs(userId);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("deleteActivityLog removes the entry", async () => {
    const id = await addActivityLog(makeLog({ durationMin: 45, caloriesBurned: 540 }));
    const before = await getAllActivityLogs(userId);
    const beforeCount = before.length;

    await deleteActivityLog(ActivityLogId(id as number), userId);
    const after = await getAllActivityLogs(userId);
    expect(after.length).toBe(beforeCount - 1);
  });

  it("does not return logs for other users", async () => {
    const other = UserId("activity-other-user");
    await addActivityLog(makeLog({ userId: other }));

    const logs = await getAllActivityLogs(userId);
    const onlyMine = logs.every((l) => l.userId === userId);
    expect(onlyMine).toBe(true);
  });

  it("returned logs include caloriesBurned", async () => {
    const logs = await getDailyActivityLogs(userId, ISODate("2026-05-20"));
    for (const log of logs) {
      expect(log.caloriesBurned).toBeGreaterThan(0);
    }
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  db,
  endFastingSession,
  type FastingSession,
  getActiveFastingSession,
  getAllFastingSessions,
  initializeDB,
  startFastingSession,
} from "./dbService";
import { FastingSessionId, ISODate, UserId } from "../types";

const userId = UserId("fasting-test-user");

const makeSession = (overrides: Partial<FastingSession> = {}): FastingSession => ({
  userId,
  startTime: new Date().toISOString(),
  endTime: null,
  targetHours: 16,
  dateLogged: ISODate("2026-05-20"),
  completed: false,
  ...overrides,
});

describe("fastingSessions DB", () => {
  beforeAll(async () => {
    await db.delete();
    await db.open();
    await initializeDB();
  });

  afterAll(async () => {
    await db.delete();
  });

  it("returns null when no active session", async () => {
    const result = await getActiveFastingSession(userId);
    expect(result).toBeNull();
  });

  it("starts a session and retrieves it as active", async () => {
    await startFastingSession(makeSession());
    const active = await getActiveFastingSession(userId);
    expect(active).not.toBeNull();
    expect(active!.targetHours).toBe(16);
    expect(active!.endTime).toBeNull();
  });

  it("ends a session and marks it completed", async () => {
    const active = await getActiveFastingSession(userId);
    expect(active?.id).toBeDefined();

    await endFastingSession(FastingSessionId(active!.id as number), userId, true);
    const afterEnd = await getActiveFastingSession(userId);
    expect(afterEnd).toBeNull();
  });

  it("getAllFastingSessions returns all sessions for user", async () => {
    await startFastingSession(makeSession({ dateLogged: ISODate("2026-05-19") }));
    await endFastingSession(
      FastingSessionId((await getActiveFastingSession(userId))!.id as number),
      userId,
      false,
    );

    const all = await getAllFastingSessions(userId);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("completed session has endTime set", async () => {
    const all = await getAllFastingSessions(userId);
    const completed = all.filter((s) => s.completed);
    expect(completed.length).toBeGreaterThanOrEqual(1);
    expect(completed[0]!.endTime).not.toBeNull();
  });

  it("does not return sessions for other users", async () => {
    const other = UserId("fasting-other-user");
    await startFastingSession(makeSession({ userId: other }));

    const mine = await getAllFastingSessions(userId);
    const onlyMine = mine.every((s) => s.userId === userId);
    expect(onlyMine).toBe(true);
  });

  it("can start a new session after ending previous", async () => {
    const active1 = await getActiveFastingSession(userId);
    if (active1) {
      await endFastingSession(FastingSessionId(active1.id as number), userId, false);
    }

    await startFastingSession(makeSession({ targetHours: 18 }));
    const active2 = await getActiveFastingSession(userId);
    expect(active2).not.toBeNull();
    expect(active2!.targetHours).toBe(18);
  });
});

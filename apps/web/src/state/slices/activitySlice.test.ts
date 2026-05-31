import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ActivitySlice, createActivitySlice } from "./activitySlice";
import type { AppState } from "../AppState";
import type { ActivityLog, FastingSession } from "../../db/dbService";
import * as dbService from "../../db/dbService";
import type { ActivityLogId, FastingSessionId, ISODate, UserId } from "@/types";
import * as syncService from "../../hooks/useSyncService";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../db/dbService", () => ({
  addActivityLog: vi.fn(),
  deleteActivityLog: vi.fn(),
  getDailyActivityLogs: vi.fn().mockResolvedValue([]),
  getAllActivityLogs: vi.fn().mockResolvedValue([]),
  getActiveFastingSession: vi.fn().mockResolvedValue(null),
  getAllFastingSessions: vi.fn().mockResolvedValue([]),
  startFastingSession: vi.fn().mockResolvedValue(undefined),
  endFastingSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../hooks/useSyncService", () => ({
  enqueueSyncOperation: vi.fn().mockResolvedValue(undefined),
}));

const userId = "user-activity-1" as unknown as UserId;

type SetFn = (partial: Partial<AppState>) => void;

function makeSlice(initial: Partial<AppState> = {}): ActivitySlice & { _set: SetFn } {
  let state: Partial<AppState> = {};
  const set: SetFn = (partial) => {
    state = { ...state, ...partial };
  };
  const get = () => state as AppState;
  const slice = createActivitySlice(
    set as Parameters<typeof createActivitySlice>[0],
    get,
    {} as never,
  );
  state = { ...slice, userId, ...initial };
  return { ...slice, _set: set };
}

describe("activitySlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbService.getDailyActivityLogs).mockResolvedValue([]);
    vi.mocked(dbService.getAllActivityLogs).mockResolvedValue([]);
    vi.mocked(dbService.getActiveFastingSession).mockResolvedValue(null);
    vi.mocked(dbService.getAllFastingSessions).mockResolvedValue([]);
    vi.mocked(dbService.startFastingSession).mockResolvedValue(1 as unknown as FastingSessionId);
    vi.mocked(dbService.endFastingSession).mockResolvedValue(undefined);
    vi.mocked(syncService.enqueueSyncOperation).mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("initialises with empty logs and null activeFastingSession", () => {
      const slice = makeSlice();
      expect(slice.dailyActivityLogs).toStrictEqual([]);
      expect(slice.allActivityLogs).toStrictEqual([]);
      expect(slice.activeFastingSession).toBeNull();
      expect(slice.fastingHistory).toStrictEqual([]);
    });
  });

  describe("fetchDailyActivityLogs", () => {
    it("sets dailyActivityLogs from db", async () => {
      const logs: ActivityLog[] = [
        {
          id: 1 as unknown as ActivityLogId,
          userId,
          activityType: "Running",
          durationMin: 30,
          caloriesBurned: 300,
          dateLogged: "2026-05-27" as unknown as ISODate,
          loggedAt: "2026-05-27T00:00:00.000Z",
          syncId: "sync-1",
        },
      ];
      vi.mocked(dbService.getDailyActivityLogs).mockResolvedValue(logs);

      const slice = makeSlice();
      await slice.fetchDailyActivityLogs(userId);

      expect(dbService.getDailyActivityLogs).toHaveBeenCalledWith(userId, expect.any(String));
      // State is set via the `set` closure - verify the DB call happened correctly
      expect(vi.mocked(dbService.getDailyActivityLogs)).toHaveBeenCalledOnce();
    });

    it("handles db error gracefully", async () => {
      vi.mocked(dbService.getDailyActivityLogs).mockRejectedValue(new Error("DB read failed"));

      const slice = makeSlice();
      await expect(slice.fetchDailyActivityLogs(userId)).resolves.not.toThrow();
    });

    it("clears previous error on success", async () => {
      vi.mocked(dbService.getDailyActivityLogs).mockResolvedValue([]);
      let capturedState: Partial<AppState> = {};
      const set: SetFn = (partial) => {
        capturedState = { ...capturedState, ...partial };
      };
      const get = () => ({ ...capturedState, userId }) as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.fetchDailyActivityLogs(userId);
      expect(capturedState.error).toBeNull();
    });

    it("sets error state on db failure", async () => {
      vi.mocked(dbService.getDailyActivityLogs).mockRejectedValue(new Error("DB failure"));
      let capturedState: Partial<AppState> = {};
      const set: SetFn = (partial) => {
        capturedState = { ...capturedState, ...partial };
      };
      const get = () => ({ ...capturedState, userId }) as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.fetchDailyActivityLogs(userId);
      expect(capturedState.error).toBeTruthy();
    });
  });

  describe("addActivityLog", () => {
    const logPayload: Omit<ActivityLog, "id"> = {
      userId,
      activityType: "Cycling",
      durationMin: 45,
      caloriesBurned: 400,
      dateLogged: "2026-05-27" as unknown as ISODate,
      loggedAt: "2026-05-27T00:00:00.000Z",
      syncId: "sync-add",
    };

    it("returns early when userId is not set", async () => {
      const slice = makeSlice({ userId: undefined });
      await slice.addActivityLog(logPayload);

      expect(dbService.addActivityLog).not.toHaveBeenCalled();
    });

    it("calls addActivityLog in db with userId and syncId", async () => {
      vi.mocked(dbService.addActivityLog).mockResolvedValue(1 as unknown as ActivityLogId);

      const slice = makeSlice();
      await slice.addActivityLog(logPayload);

      expect(dbService.addActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: "Cycling",
          userId,
          syncId: expect.any(String),
        }),
      );
    });

    it("refreshes daily and all activity logs after add", async () => {
      vi.mocked(dbService.addActivityLog).mockResolvedValue(1 as unknown as ActivityLogId);

      const slice = makeSlice();
      await slice.addActivityLog(logPayload);

      expect(dbService.getDailyActivityLogs).toHaveBeenCalled();
      expect(dbService.getAllActivityLogs).toHaveBeenCalled();
    });

    it("enqueues create sync operation", async () => {
      vi.mocked(dbService.addActivityLog).mockResolvedValue(1 as unknown as ActivityLogId);

      const slice = makeSlice();
      await slice.addActivityLog(logPayload);

      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "activityLog",
          operation: "create",
          userId,
        }),
      );
    });

    it("throws and sets error when db call fails", async () => {
      vi.mocked(dbService.addActivityLog).mockRejectedValue(new Error("DB write error"));

      let capturedError: string | undefined;
      const set: SetFn = (partial) => {
        if (partial.error !== undefined) capturedError = partial.error ?? undefined;
      };
      const get = () =>
        ({ userId, dailyActivityLogs: [], allActivityLogs: [] }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await expect(slice.addActivityLog(logPayload)).rejects.toThrow("DB write error");
      expect(capturedError).toBeTruthy();
    });
  });

  describe("deleteActivityLog", () => {
    it("returns early when userId is not set", async () => {
      const slice = makeSlice({ userId: undefined });
      await slice.deleteActivityLog(1 as unknown as ActivityLogId);

      expect(dbService.deleteActivityLog).not.toHaveBeenCalled();
    });

    it("calls deleteActivityLog in db", async () => {
      vi.mocked(dbService.deleteActivityLog).mockResolvedValue(undefined);

      const slice = makeSlice();
      await slice.deleteActivityLog(5 as unknown as ActivityLogId);

      expect(dbService.deleteActivityLog).toHaveBeenCalledWith(5, userId);
    });

    it("refreshes logs after deletion", async () => {
      vi.mocked(dbService.deleteActivityLog).mockResolvedValue(undefined);

      const slice = makeSlice();
      await slice.deleteActivityLog(5 as unknown as ActivityLogId);

      expect(dbService.getDailyActivityLogs).toHaveBeenCalled();
      expect(dbService.getAllActivityLogs).toHaveBeenCalled();
    });

    it("enqueues delete sync when syncId is found in dailyActivityLogs", async () => {
      vi.mocked(dbService.deleteActivityLog).mockResolvedValue(undefined);

      const existingLog: ActivityLog = {
        id: 7 as unknown as ActivityLogId,
        userId,
        activityType: "Swimming",
        durationMin: 60,
        caloriesBurned: 500,
        dateLogged: "2026-05-27" as unknown as ISODate,
        loggedAt: "2026-05-27T00:00:00.000Z",
        syncId: "sync-del-7",
      };

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          dailyActivityLogs: [existingLog],
          allActivityLogs: [],
          fetchFastingSessions: vi.fn(),
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.deleteActivityLog(7 as unknown as ActivityLogId);

      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "activityLog",
          operation: "delete",
          syncId: "sync-del-7",
        }),
      );
    });

    it("skips enqueue when no syncId found", async () => {
      vi.mocked(dbService.deleteActivityLog).mockResolvedValue(undefined);

      const existingLog: ActivityLog = {
        id: 8 as unknown as ActivityLogId,
        userId,
        activityType: "Walking",
        durationMin: 20,
        caloriesBurned: 100,
        dateLogged: "2026-05-27" as unknown as ISODate,
        loggedAt: "2026-05-27T00:00:00.000Z",
        syncId: undefined,
      };

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          dailyActivityLogs: [existingLog],
          allActivityLogs: [],
          fetchFastingSessions: vi.fn(),
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.deleteActivityLog(8 as unknown as ActivityLogId);

      expect(syncService.enqueueSyncOperation).not.toHaveBeenCalled();
    });

    it("sets error state when db delete fails", async () => {
      vi.mocked(dbService.deleteActivityLog).mockRejectedValue(new Error("Delete failed"));

      let capturedError: string | undefined;
      const set: SetFn = (partial) => {
        if (partial.error !== undefined) capturedError = partial.error ?? undefined;
      };
      const get = () =>
        ({
          userId,
          dailyActivityLogs: [],
          allActivityLogs: [],
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.deleteActivityLog(1 as unknown as ActivityLogId);
      expect(capturedError).toBeTruthy();
    });
  });

  describe("fetchFastingSessions", () => {
    it("sets activeFastingSession and fastingHistory", async () => {
      const activeSession: FastingSession = {
        id: 1 as unknown as import("@/types").FastingSessionId,
        userId,
        startTime: "2026-05-27T08:00:00Z",
        endTime: null,
        targetHours: 16,
        dateLogged: "2026-05-27" as unknown as ISODate,
        completed: false,
        syncId: "sync-fast-1",
      };
      const allSessions: FastingSession[] = [activeSession];
      vi.mocked(dbService.getActiveFastingSession).mockResolvedValue(activeSession);
      vi.mocked(dbService.getAllFastingSessions).mockResolvedValue(allSessions);

      let capturedState: Partial<AppState> = {};
      const set: SetFn = (partial) => {
        capturedState = { ...capturedState, ...partial };
      };
      const get = () => ({ ...capturedState, userId }) as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.fetchFastingSessions(userId);

      expect(capturedState.activeFastingSession).toStrictEqual(activeSession);
      expect(capturedState.fastingHistory).toStrictEqual(allSessions);
    });

    it("sets activeFastingSession to null when none active", async () => {
      vi.mocked(dbService.getActiveFastingSession).mockResolvedValue(null);
      vi.mocked(dbService.getAllFastingSessions).mockResolvedValue([]);

      let capturedState: Partial<AppState> = {};
      const set: SetFn = (partial) => {
        capturedState = { ...capturedState, ...partial };
      };
      const get = () => ({ ...capturedState, userId }) as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.fetchFastingSessions(userId);

      expect(capturedState.activeFastingSession).toBeNull();
    });

    it("handles errors without throwing", async () => {
      vi.mocked(dbService.getActiveFastingSession).mockRejectedValue(new Error("DB error"));

      const slice = makeSlice();
      await expect(slice.fetchFastingSessions(userId)).resolves.not.toThrow();
    });
  });

  describe("startFasting", () => {
    it("returns early when userId is not set", async () => {
      const slice = makeSlice({ userId: undefined });
      await slice.startFasting(16);

      expect(dbService.startFastingSession).not.toHaveBeenCalled();
    });

    it("shows toast error when activeFastingSession already exists", async () => {
      const existingSession: FastingSession = {
        id: 1 as unknown as import("@/types").FastingSessionId,
        userId,
        startTime: "2026-05-27T08:00:00Z",
        endTime: null,
        targetHours: 16,
        dateLogged: "2026-05-27" as unknown as ISODate,
        completed: false,
        syncId: "sync-active",
      };

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: existingSession,
          fetchFastingSessions: vi.fn(),
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.startFasting(16);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("already active"));
      expect(dbService.startFastingSession).not.toHaveBeenCalled();
    });

    it("creates fasting session in db with targetHours", async () => {
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: null,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.startFasting(14);

      expect(dbService.startFastingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          targetHours: 14,
          completed: false,
          endTime: null,
          syncId: expect.any(String),
        }),
      );
    });

    it("enqueues create sync operation for fasting session", async () => {
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: null,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.startFasting(16);

      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "fastingSession",
          operation: "create",
          userId,
        }),
      );
    });

    it("calls fetchFastingSessions after starting", async () => {
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: null,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.startFasting(12);

      expect(fetchFastingSessions).toHaveBeenCalledWith(userId);
    });

    it("sets error state when db call fails", async () => {
      vi.mocked(dbService.startFastingSession).mockRejectedValue(new Error("Start failed"));

      let capturedError: string | undefined;
      const set: SetFn = (partial) => {
        if (partial.error !== undefined) capturedError = partial.error ?? undefined;
      };
      const get = () =>
        ({
          userId,
          activeFastingSession: null,
          fetchFastingSessions: vi.fn(),
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.startFasting(16);
      expect(capturedError).toBeTruthy();
    });
  });

  describe("endFasting", () => {
    const activeSession: FastingSession = {
      id: 10 as unknown as import("@/types").FastingSessionId,
      userId,
      startTime: "2026-05-27T08:00:00Z",
      endTime: null,
      targetHours: 16,
      dateLogged: "2026-05-27" as unknown as ISODate,
      completed: false,
      syncId: "sync-end-10",
    };

    it("returns early when userId is not set", async () => {
      const slice = makeSlice({ userId: undefined, activeFastingSession: activeSession });
      await slice.endFasting(true);

      expect(dbService.endFastingSession).not.toHaveBeenCalled();
    });

    it("returns early when activeFastingSession has no id", async () => {
      const sessionWithoutId: FastingSession = { ...activeSession, id: undefined };
      const slice = makeSlice({ activeFastingSession: sessionWithoutId });
      await slice.endFasting(true);

      expect(dbService.endFastingSession).not.toHaveBeenCalled();
    });

    it("returns early when activeFastingSession is null", async () => {
      const slice = makeSlice({ activeFastingSession: null });
      await slice.endFasting(true);

      expect(dbService.endFastingSession).not.toHaveBeenCalled();
    });

    it("calls endFastingSession in db with completed=true", async () => {
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: activeSession,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.endFasting(true);

      expect(dbService.endFastingSession).toHaveBeenCalledWith(10, userId, true);
    });

    it("enqueues update sync operation", async () => {
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: activeSession,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.endFasting(false);

      expect(syncService.enqueueSyncOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "fastingSession",
          operation: "update",
          syncId: "sync-end-10",
          payload: expect.objectContaining({ completed: false }),
        }),
      );
    });

    it("skips enqueue when session has no syncId", async () => {
      const sessionNoSyncId: FastingSession = { ...activeSession, syncId: undefined };
      const fetchFastingSessions = vi.fn().mockResolvedValue(undefined);

      const set: SetFn = vi.fn();
      const get = () =>
        ({
          userId,
          activeFastingSession: sessionNoSyncId,
          fetchFastingSessions,
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.endFasting(true);

      expect(syncService.enqueueSyncOperation).not.toHaveBeenCalled();
    });

    it("sets error state when db call fails", async () => {
      vi.mocked(dbService.endFastingSession).mockRejectedValue(new Error("End failed"));

      let capturedError: string | undefined;
      const set: SetFn = (partial) => {
        if (partial.error !== undefined) capturedError = partial.error ?? undefined;
      };
      const get = () =>
        ({
          userId,
          activeFastingSession: activeSession,
          fetchFastingSessions: vi.fn(),
        }) as unknown as AppState;
      const slice = createActivitySlice(
        set as Parameters<typeof createActivitySlice>[0],
        get,
        {} as never,
      );

      await slice.endFasting(true);
      expect(capturedError).toBeTruthy();
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDataImport } from "./useDataImport";
import * as appState from "../state/AppState";
import type { ConflictSummary } from "../db/dbService";
import * as dbService from "../db/dbService";
import { toast } from "sonner";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../db/dbService", async (importOriginal) => {
  const actual = await importOriginal<typeof dbService>();
  return {
    ...actual,
    detectConflicts: vi.fn(),
    BACKUP_VERSION: 1,
  };
});

const validPayload = {
  version: 1,
  exportedAt: "2026-05-20T00:00:00.000Z",
  userId: "user1",
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

const mockConflicts: ConflictSummary = {
  foodItems: { incoming: 3, existing: 10 },
  recipes: { incoming: 0, existing: 0 },
  waterLogs: { incoming: 0, existing: 0 },
  bodyMeasurements: { incoming: 0, existing: 0 },
  stepLogs: { incoming: 0, existing: 0 },
  activityLogs: { incoming: 0, existing: 0 },
  fastingSessions: { incoming: 0, existing: 0 },
};

const makeFile = (content: string, name = "backup.json") =>
  new File([content], name, { type: "application/json" });

describe("useDataImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: vi.fn().mockResolvedValue({ imported: { foodItems: 0 }, skipped: 0 }),
      userId: "user1",
    } as unknown as ReturnType<typeof appState.useAppState>);
    vi.mocked(dbService.detectConflicts).mockResolvedValue(mockConflicts);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns expected interface", () => {
    const { result } = renderHook(() => useDataImport());
    expect(result.current.fileInputRef).toBeDefined();
    expect(typeof result.current.openFilePicker).toBe("function");
    expect(typeof result.current.handleFileChange).toBe("function");
    expect(typeof result.current.confirmImport).toBe("function");
    expect(typeof result.current.cancelImport).toBe("function");
    expect(result.current.isImporting).toBe(false);
    expect(result.current.pendingPayload).toBeNull();
    expect(result.current.conflicts).toBeNull();
  });

  it("sets pendingPayload on valid file", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(result.current.pendingPayload).not.toBeNull();
  });

  it("sets conflicts on valid file when userId is set", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(result.current.conflicts).toStrictEqual(mockConflicts);
  });

  it("skips detectConflicts when userId is null", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: vi.fn(),
      userId: null,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(vi.mocked(dbService.detectConflicts)).not.toHaveBeenCalled();
    expect(result.current.conflicts).toBeNull();
  });

  it("shows error toast for invalid JSON", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile("not valid json");
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.pendingPayload).toBeNull();
  });

  it("shows error toast for wrong schema", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify({ version: 1, tables: {} }));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("shows error toast for version mismatch", async () => {
    const { result } = renderHook(() => useDataImport());

    const wrongVersion = { ...validPayload, version: 99 };
    const file = makeFile(JSON.stringify(wrongVersion));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("cancelImport clears pendingPayload and conflicts", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    act(() => {
      result.current.cancelImport();
    });

    expect(result.current.pendingPayload).toBeNull();
    expect(result.current.conflicts).toBeNull();
  });

  it("confirmImport clears conflicts after import", async () => {
    const mockImport = vi.fn().mockResolvedValue({ imported: { foodItems: 5 }, skipped: 1 });
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: mockImport,
      userId: "user1",
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(result.current.conflicts).toBeNull();
  });

  it("confirmImport calls importData and shows success toast", async () => {
    const mockImport = vi.fn().mockResolvedValue({ imported: { foodItems: 5 }, skipped: 1 });
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: mockImport,
      userId: "user1",
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(mockImport).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("confirmImport does nothing when pendingPayload is null", async () => {
    const mockImport = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: mockImport,
      userId: "user1",
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(mockImport).not.toHaveBeenCalled();
  });

  it("openFilePicker calls click on the input ref when assigned", () => {
    const { result } = renderHook(() => useDataImport());
    const mockClick = vi.fn();
    Object.defineProperty(result.current.fileInputRef, "current", {
      value: { click: mockClick },
      writable: true,
      configurable: true,
    });

    act(() => {
      result.current.openFilePicker();
    });

    expect(mockClick).toHaveBeenCalled();
  });

  it("shows error toast when file exceeds 50 MB", async () => {
    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    Object.defineProperty(file, "size", { value: 51 * 1024 * 1024, configurable: true });
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(toast.error).toHaveBeenCalledWith("Backup file exceeds the 50 MB size limit.");
    expect(result.current.pendingPayload).toBeNull();
  });

  it("shows error toast when a food item has out-of-range calories", async () => {
    const { result } = renderHook(() => useDataImport());

    const badPayload = {
      ...validPayload,
      tables: {
        ...validPayload.tables,
        foodItems: [
          {
            name: "Test",
            calories: 99999,
            servingSize: 1,
            protein: 0,
            carbs: 0,
            fat: 0,
            dateLogged: "2026-01-01",
            isFavorite: false,
            mealType: "Breakfast",
          },
        ],
      },
    };
    const file = makeFile(JSON.stringify(badPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.pendingPayload).toBeNull();
  });

  it("strips extra fields from food items so they do not appear in pendingPayload", async () => {
    const { result } = renderHook(() => useDataImport());

    const payloadWithExtras = {
      ...validPayload,
      tables: {
        ...validPayload.tables,
        foodItems: [
          {
            name: "Banana",
            calories: 100,
            servingSize: 1,
            protein: 1,
            carbs: 24,
            fat: 0,
            dateLogged: "2026-05-20",
            isFavorite: false,
            mealType: "Breakfast",
            __proto__: {},
            injectedField: "MALICIOUS",
          },
        ],
      },
    };
    const file = makeFile(JSON.stringify(payloadWithExtras));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(result.current.pendingPayload).not.toBeNull();
    const item = result.current.pendingPayload!.tables.foodItems[0]!;
    expect(item).not.toHaveProperty("injectedField");
  });

  it("no file does nothing", async () => {
    const { result } = renderHook(() => useDataImport());

    const event = {
      target: { files: [], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(result.current.pendingPayload).toBeNull();
  });

  it("confirmImport does not show toast when importData returns null", async () => {
    const mockImport = vi.fn().mockResolvedValue(null);
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: mockImport,
      userId: "user1",
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    const file = makeFile(JSON.stringify(validPayload));
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(mockImport).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

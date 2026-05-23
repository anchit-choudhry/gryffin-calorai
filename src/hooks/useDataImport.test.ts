import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDataImport } from "./useDataImport";
import * as appState from "../state/AppState";
import { toast } from "sonner";

vi.mock("sonner");
vi.mock("../state/AppState");

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

const makeFile = (content: string, name = "backup.json") =>
  new File([content], name, { type: "application/json" });

describe("useDataImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: vi.fn().mockResolvedValue({ imported: { foodItems: 0 }, skipped: 0 }),
    } as unknown as ReturnType<typeof appState.useAppState>);
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

  it("cancelImport clears pendingPayload", async () => {
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
  });

  it("confirmImport calls importData and shows success toast", async () => {
    const mockImport = vi.fn().mockResolvedValue({ imported: { foodItems: 5 }, skipped: 1 });
    vi.mocked(appState).useAppState.mockReturnValue({
      importData: mockImport,
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
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataImport());

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(mockImport).not.toHaveBeenCalled();
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { toCSV, useDataExport } from "./useDataExport";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");

const makePayload = () => ({
  version: 1 as const,
  exportedAt: "2026-05-20T00:00:00.000Z",
  userId: "user1",
  tables: {
    foodItems: [{ id: 1, name: "Apple", calories: 95 }],
    recipes: [],
    waterLogs: [],
    bodyMeasurements: [],
    userAchievements: [],
    stepLogs: [],
    tdeeProfile: null,
    activityLogs: [],
    fastingSessions: [],
  },
});

describe("useDataExport", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLMock = vi.fn().mockReturnValue("blob:test");
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();

    globalThis.URL.createObjectURL = createObjectURLMock as unknown as (
      obj: Blob | MediaSource,
    ) => string;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock as unknown as (url: string) => void;

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        el.click = clickMock as () => void;
      }
      return el;
    });

    vi.mocked(appState).useAppState.mockReturnValue({
      exportData: vi.fn().mockResolvedValue(makePayload()),
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns downloadJSON, downloadCSVZip, isExporting", () => {
    const { result } = renderHook(() => useDataExport());
    expect(typeof result.current.downloadJSON).toBe("function");
    expect(typeof result.current.downloadCSVZip).toBe("function");
    expect(result.current.isExporting).toBe(false);
  });

  it("downloadJSON creates a blob and triggers download", async () => {
    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.downloadJSON();
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:test");
  });

  it("downloadCSVZip creates a zip blob and triggers download", async () => {
    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.downloadCSVZip();
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });

  it("isExporting is true during export then false after", async () => {
    let exportingDuringCall = false;
    vi.mocked(appState).useAppState.mockReturnValue({
      exportData: vi.fn().mockImplementation(async () => {
        exportingDuringCall = true;
        return makePayload();
      }),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.downloadJSON();
    });

    expect(exportingDuringCall).toBe(true);
    expect(result.current.isExporting).toBe(false);
  });

  it("toCSV returns empty string for empty array", () => {
    expect(toCSV([])).toBe("");
  });

  it("toCSV produces correct header and value rows", () => {
    const csv = toCSV([{ name: "Apple", calories: 95 }]);
    expect(csv).toBe("name,calories\nApple,95");
  });

  it("toCSV neutralizes formula-injection characters with a quoted tab prefix", () => {
    const rows = [{ a: "=NOW()" }, { a: "+cmd" }, { a: "-cmd" }, { a: "@SUM" }];
    const lines = toCSV(rows).split("\n");
    // Values are always double-quoted when tab-prefixed so spreadsheets cannot evaluate them.
    expect(lines[1]).toBe('"\t=NOW()"');
    expect(lines[2]).toBe('"\t+cmd"');
    expect(lines[3]).toBe('"\t-cmd"');
    expect(lines[4]).toBe('"\t@SUM"');
  });

  it("toCSV wraps values containing commas or quotes in double quotes", () => {
    const csv = toCSV([{ a: 'say "hello"', b: "a,b" }]);
    const [, dataLine] = csv.split("\n");
    expect(dataLine).toBe('"say ""hello""","a,b"');
  });

  it("does nothing when exportData returns null", async () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      exportData: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.downloadJSON();
    });

    expect(clickMock).not.toHaveBeenCalled();
  });
});

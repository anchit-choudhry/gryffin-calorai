import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderStreakCard, renderHarvestCard, shareOrDownloadCard } from "./shareCard";
import type { StreakCardData, HarvestCardData } from "./shareCard";

const mockBlob = new Blob(["png"], { type: "image/png" });

function setupCanvasMock(): void {
  const mockCtx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    letterSpacing: "",
    font: "",
    textAlign: "",
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
  };

  const mockCanvas = {
    getContext: vi.fn().mockReturnValue(mockCtx),
    toBlob: vi.fn().mockImplementation((cb: (b: Blob | null) => void) => {
      cb(mockBlob);
    }),
    width: 0,
    height: 0,
  };

  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
    return document.createElement(tag);
  });
}

describe("renderStreakCard", () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const streakData: StreakCardData = {
    currentStreak: 7,
    longestStreak: 21,
    loggedDates: new Set(["2026-06-10", "2026-06-11", "2026-06-12"]),
  };

  it("returns a Blob", async () => {
    const result = await renderStreakCard(streakData);
    expect(result).toBeInstanceOf(Blob);
  });

  it("resolves even with empty loggedDates", async () => {
    const result = await renderStreakCard({ ...streakData, loggedDates: new Set() });
    expect(result).toBeInstanceOf(Blob);
  });

  it("resolves with zero streaks", async () => {
    const result = await renderStreakCard({
      currentStreak: 0,
      longestStreak: 0,
      loggedDates: new Set(),
    });
    expect(result).toBeInstanceOf(Blob);
  });
});

describe("renderHarvestCard", () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const harvestData: HarvestCardData = {
    averageCalories: 2100,
    daysOnTarget: 5,
    consistency: 71,
    currentStreak: 7,
    calorieGoal: 2000,
  };

  it("returns a Blob", async () => {
    const result = await renderHarvestCard(harvestData);
    expect(result).toBeInstanceOf(Blob);
  });

  it("resolves with strong week (daysOnTarget >= 5)", async () => {
    const result = await renderHarvestCard({ ...harvestData, daysOnTarget: 6 });
    expect(result).toBeInstanceOf(Blob);
  });

  it("resolves with decent start (daysOnTarget 3-4)", async () => {
    const result = await renderHarvestCard({ ...harvestData, daysOnTarget: 3 });
    expect(result).toBeInstanceOf(Blob);
  });

  it("resolves with low progress (daysOnTarget < 3)", async () => {
    const result = await renderHarvestCard({ ...harvestData, daysOnTarget: 1 });
    expect(result).toBeInstanceOf(Blob);
  });
});

describe("shareOrDownloadCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("calls navigator.share when canShare is supported", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { canShare: mockCanShare, share: mockShare });

    await shareOrDownloadCard(mockBlob, "test.png");
    expect(mockShare).toHaveBeenCalledOnce();
    const shareCall = mockShare.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(shareCall.title).toBe("Gryffin Calorai");
  });

  it("falls back to anchor download when canShare returns false", async () => {
    vi.stubGlobal("navigator", { canShare: vi.fn().mockReturnValue(false) });

    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    await shareOrDownloadCard(mockBlob, "streak.png");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
    expect(mockAnchor.download).toBe("streak.png");
  });

  it("falls back to download when canShare is undefined", async () => {
    vi.stubGlobal("navigator", {});

    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    await shareOrDownloadCard(mockBlob, "harvest.png");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });
});

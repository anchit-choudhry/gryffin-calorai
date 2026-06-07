import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRecentFoods } from "./useRecentFoods";
import type { FoodItem } from "../db/dbService";
import type { UserId } from "../types";

const mockGetRecentFoodItems = vi.hoisted(() => vi.fn());
const mockUseAppState = vi.hoisted(() => vi.fn());

vi.mock("../db/dbService", () => ({
  getRecentFoodItems: mockGetRecentFoodItems,
}));

vi.mock("../state/AppState", () => ({
  useAppState: mockUseAppState,
}));

function makeFood(name: string, dateLogged: string): FoodItem {
  return {
    name,
    calories: 100,
    servingSize: 1,
    dateLogged,
    isFavorite: false,
    mealType: "Lunch",
  } as unknown as FoodItem;
}

const USER_ID = "user-1" as UserId;

describe("useRecentFoods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockImplementation((selector: (s: { userId: UserId }) => unknown) =>
      selector({ userId: USER_ID }),
    );
  });

  it("returns an empty array initially", () => {
    mockGetRecentFoodItems.mockResolvedValue([]);
    const { result } = renderHook(() => useRecentFoods());
    expect(result.current).toStrictEqual([]);
  });

  it("does not call getRecentFoodItems when userId is null", () => {
    mockUseAppState.mockImplementation((selector: (s: { userId: null }) => unknown) =>
      selector({ userId: null }),
    );
    mockGetRecentFoodItems.mockResolvedValue([]);
    renderHook(() => useRecentFoods());
    expect(mockGetRecentFoodItems).not.toHaveBeenCalled();
  });

  it("calls getRecentFoodItems with userId and 14 days", async () => {
    mockGetRecentFoodItems.mockResolvedValue([]);
    renderHook(() => useRecentFoods());
    expect(mockGetRecentFoodItems).toHaveBeenCalledWith(USER_ID, 14);
  });

  it("returns deduplicated foods keyed by lowercased name", async () => {
    const items = [
      makeFood("Apple", "2026-05-25"),
      makeFood("apple", "2026-05-28"),
      makeFood("Banana", "2026-05-26"),
    ];
    mockGetRecentFoodItems.mockResolvedValue(items);

    let result!: ReturnType<typeof renderHook<FoodItem[], never>>["result"];
    await act(async () => {
      ({ result } = renderHook(() => useRecentFoods()));
    });

    // Only one entry per lowercased name.
    const names = result.current.map((f) => f.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
    expect(names).toHaveLength(2);
  });

  it("keeps the most-recent entry when deduplicating (reverse order wins)", async () => {
    // Items are returned oldest-first; after .reverse() the most-recent item appears first.
    const older = makeFood("Apple", "2026-05-20");
    const newer = makeFood("Apple", "2026-05-28");
    // Simulate DB returning oldest first.
    mockGetRecentFoodItems.mockResolvedValue([older, newer]);

    let result!: ReturnType<typeof renderHook<FoodItem[], never>>["result"];
    await act(async () => {
      ({ result } = renderHook(() => useRecentFoods()));
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.dateLogged).toBe("2026-05-28");
  });

  it("returns an empty array silently when getRecentFoodItems rejects", async () => {
    mockGetRecentFoodItems.mockRejectedValue(new Error("IndexedDB error"));

    let result!: ReturnType<typeof renderHook<FoodItem[], never>>["result"];
    await act(async () => {
      ({ result } = renderHook(() => useRecentFoods()));
    });

    expect(result.current).toStrictEqual([]);
  });
});

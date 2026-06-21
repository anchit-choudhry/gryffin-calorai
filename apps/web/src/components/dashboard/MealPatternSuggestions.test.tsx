import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as appState from "@/state/AppState";
import { MealPatternSuggestions } from "./MealPatternSuggestions";
import type { UserId } from "@/types";

vi.mock("@/state/AppState");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockGetMealSuggestions = vi.fn();

vi.mock("@/lib/mealPatterns", () => ({
  getMealSuggestions: (...args: unknown[]) => mockGetMealSuggestions(...args),
  getCurrentMealType: () => "Breakfast",
}));

const { toast } = await import("sonner");

const mockAddFoodLog = vi.fn().mockResolvedValue(undefined);

function makeSuggestion(name: string, calories = 300) {
  return { name, mealType: "Breakfast" as const, calories, servingSize: 1, count: 3 };
}

function mockStoreWith(overrides: { userId?: UserId | null; allFoodItems?: unknown[] }) {
  vi.mocked(appState).useAppState.mockReturnValue({
    userId: overrides.userId !== undefined ? overrides.userId : ("u1" as UserId),
    allFoodItems: overrides.allFoodItems ?? [],
    addFoodLog: mockAddFoodLog,
  } as unknown as ReturnType<typeof appState.useAppState>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAddFoodLog.mockResolvedValue(undefined);
  mockGetMealSuggestions.mockReturnValue([]);
  mockStoreWith({});
});

describe("MealPatternSuggestions", () => {
  it("renders nothing when there are no suggestions", () => {
    mockGetMealSuggestions.mockReturnValue([]);
    const { container } = render(<MealPatternSuggestions />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when userId is null", () => {
    mockStoreWith({ userId: null });
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal")]);
    const { container } = render(<MealPatternSuggestions />);
    expect(container.firstChild).toBeNull();
  });

  it("renders suggestion chips when patterns exist", () => {
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal"), makeSuggestion("Eggs")]);
    render(<MealPatternSuggestions />);
    expect(screen.getByRole("button", { name: /log oatmeal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log eggs/i })).toBeInTheDocument();
  });

  it("shows the current meal type label", () => {
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal")]);
    render(<MealPatternSuggestions />);
    expect(screen.getByText(/usually at breakfast/i)).toBeInTheDocument();
  });

  it("calls addFoodLog with correct fields on chip click", async () => {
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal", 350)]);
    render(<MealPatternSuggestions />);
    fireEvent.click(screen.getByRole("button", { name: /log oatmeal/i }));
    await waitFor(() => {
      expect(mockAddFoodLog).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Oatmeal",
          calories: 350,
          mealType: "Breakfast",
          userId: "u1",
        }),
      );
    });
  });

  it("shows a success toast after logging", async () => {
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal")]);
    render(<MealPatternSuggestions />);
    fireEvent.click(screen.getByRole("button", { name: /log oatmeal/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Oatmeal"));
    });
  });

  it("shows calories in each chip", () => {
    mockGetMealSuggestions.mockReturnValue([makeSuggestion("Oatmeal", 280)]);
    render(<MealPatternSuggestions />);
    expect(screen.getByText("280")).toBeInTheDocument();
  });

  it("renders at most 4 chips", () => {
    mockGetMealSuggestions.mockReturnValue([
      makeSuggestion("A"),
      makeSuggestion("B"),
      makeSuggestion("C"),
      makeSuggestion("D"),
      makeSuggestion("E"),
    ]);
    render(<MealPatternSuggestions />);
    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(4);
  });
});

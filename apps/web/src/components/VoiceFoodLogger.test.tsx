import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import VoiceFoodLogger from "./VoiceFoodLogger";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { useAppState } from "../state/AppState";
import { FoodItemId, fuzzyMatchFoodName, ISODate, UserId } from "../types";
import type { FoodItem } from "../db/dbService";

vi.mock("../hooks/useVoiceCapture", () => ({
  useVoiceCapture: vi.fn(),
}));
vi.mock("../state/AppState", () => ({
  useAppState: vi.fn(),
}));
vi.mock("../types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../types")>();
  return { ...actual, fuzzyMatchFoodName: vi.fn() };
});

const mockStart = vi.fn();
const mockStop = vi.fn();

function makeVoiceCapture(overrides: Partial<ReturnType<typeof useVoiceCapture>> = {}) {
  return {
    isSupported: true,
    isListening: false,
    transcript: null as string | null,
    error: null as string | null,
    startListening: mockStart,
    stopListening: mockStop,
    ...overrides,
  };
}

function makeFood(partial: Partial<FoodItem> & { name: string; calories: number }): FoodItem {
  return {
    id: FoodItemId(1),
    userId: UserId("user-1"),
    servingSize: 100,
    protein: 10,
    carbs: 20,
    fat: 5,
    dateLogged: ISODate("2026-05-17"),
    isFavorite: false,
    ...partial,
  };
}

describe("VoiceFoodLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useVoiceCapture).mockReturnValue(makeVoiceCapture());
    vi.mocked(useAppState).mockReturnValue({
      allFoodItems: [],
      favoriteFoods: [],
    } as unknown as ReturnType<typeof useAppState>);
    vi.mocked(fuzzyMatchFoodName).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("idle state (not listening, no transcript)", () => {
    it("shows 'Click to start listening' when voice is supported", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/click to start listening/i)).toBeDefined();
    });

    it("shows 'Not supported in this browser' when voice is not supported", () => {
      vi.mocked(useVoiceCapture).mockReturnValue(makeVoiceCapture({ isSupported: false }));
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/not supported in this browser/i)).toBeDefined();
    });

    it("enables the Speak Food button when supported", () => {
      render(<VoiceFoodLogger />);
      const btn = screen.getByRole("button", { name: /speak food/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("disables the Speak Food button when not supported", () => {
      vi.mocked(useVoiceCapture).mockReturnValue(makeVoiceCapture({ isSupported: false }));
      render(<VoiceFoodLogger />);
      const btn = screen.getByRole("button", { name: /speak food/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("calls startListening when Speak Food is clicked", () => {
      render(<VoiceFoodLogger />);
      fireEvent.click(screen.getByRole("button", { name: /speak food/i }));
      expect(mockStart).toHaveBeenCalledOnce();
    });
  });

  describe("listening state", () => {
    beforeEach(() => {
      vi.mocked(useVoiceCapture).mockReturnValue(makeVoiceCapture({ isListening: true }));
    });

    it("shows the Listening indicator", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Listening")).toBeDefined();
    });

    it("shows a Stop Listening button", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByRole("button", { name: /stop listening/i })).toBeDefined();
    });

    it("calls stopListening when Stop Listening is clicked", () => {
      render(<VoiceFoodLogger />);
      fireEvent.click(screen.getByRole("button", { name: /stop listening/i }));
      expect(mockStop).toHaveBeenCalledOnce();
    });

    it("does not show the Speak Food button while listening", () => {
      render(<VoiceFoodLogger />);
      expect(screen.queryByRole("button", { name: /speak food/i })).toBeNull();
    });
  });

  describe("error display", () => {
    it("renders the error message when error is set", () => {
      vi.mocked(useVoiceCapture).mockReturnValue(
        makeVoiceCapture({ error: "Microphone access denied" }),
      );
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Microphone access denied")).toBeDefined();
    });

    it("shows error even while in idle state", () => {
      vi.mocked(useVoiceCapture).mockReturnValue(
        makeVoiceCapture({ error: "Permission error", isSupported: true }),
      );
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Permission error")).toBeDefined();
      expect(screen.getByText(/click to start listening/i)).toBeDefined();
    });
  });

  describe("transcript state - no matches", () => {
    beforeEach(() => {
      vi.mocked(useVoiceCapture).mockReturnValue(
        makeVoiceCapture({ transcript: "unknown xyz food", isListening: false }),
      );
      vi.mocked(fuzzyMatchFoodName).mockReturnValue([]);
    });

    it("displays the spoken transcript", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/unknown xyz food/i)).toBeDefined();
    });

    it("shows the 'You said' section header", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/you said/i)).toBeDefined();
    });

    it("shows 'No matching foods found' message", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/no matching foods found/i)).toBeDefined();
    });

    it("shows the Try Again button", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByRole("button", { name: /try again/i })).toBeDefined();
    });

    it("calls startListening when Try Again is clicked", () => {
      render(<VoiceFoodLogger />);
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
      expect(mockStart).toHaveBeenCalledOnce();
    });

    it("does not show the idle UI when transcript is set", () => {
      render(<VoiceFoodLogger />);
      expect(screen.queryByRole("button", { name: /speak food/i })).toBeNull();
    });
  });

  describe("transcript state - with food matches", () => {
    const match = makeFood({ name: "Grilled Chicken", calories: 165 });

    beforeEach(() => {
      vi.mocked(useVoiceCapture).mockReturnValue(
        makeVoiceCapture({ transcript: "chicken", isListening: false }),
      );
      vi.mocked(fuzzyMatchFoodName).mockReturnValue([match]);
    });

    it("renders the matched food name", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Grilled Chicken")).toBeDefined();
    });

    it("renders the calorie count for the matched food", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/165 kcal/i)).toBeDefined();
    });

    it("calls onTranscriptMatched with the food name when a match is clicked", () => {
      const onMatched = vi.fn();
      render(<VoiceFoodLogger onTranscriptMatched={onMatched} />);
      fireEvent.click(screen.getByText("Grilled Chicken"));
      expect(onMatched).toHaveBeenCalledWith("Grilled Chicken");
    });

    it("does not throw when a match is clicked without onTranscriptMatched prop", () => {
      render(<VoiceFoodLogger />);
      expect(() => {
        fireEvent.click(screen.getByText("Grilled Chicken"));
      }).not.toThrow();
    });

    it("does not show 'No matching foods found' when there are matches", () => {
      render(<VoiceFoodLogger />);
      expect(screen.queryByText(/no matching foods found/i)).toBeNull();
    });

    it("renders multiple matched foods when available", () => {
      const second = makeFood({ id: FoodItemId(2), name: "Chicken Salad", calories: 120 });
      vi.mocked(fuzzyMatchFoodName).mockReturnValue([match, second]);
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Grilled Chicken")).toBeDefined();
      expect(screen.getByText("Chicken Salad")).toBeDefined();
    });

    it("uses food id as key when id is present, falling back to name", () => {
      const noId = makeFood({ id: undefined, name: "Mystery Dish", calories: 300 });
      vi.mocked(fuzzyMatchFoodName).mockReturnValue([noId]);
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Mystery Dish")).toBeDefined();
    });
  });

  describe("corpus building", () => {
    const favFood = makeFood({ id: FoodItemId(1), name: "Apple", calories: 95, isFavorite: true });
    const otherFood = makeFood({ id: FoodItemId(2), name: "Banana", calories: 105 });

    beforeEach(() => {
      vi.mocked(useVoiceCapture).mockReturnValue(
        makeVoiceCapture({ transcript: "fruit", isListening: false }),
      );
    });

    it("passes favorites first in the corpus to fuzzyMatchFoodName", () => {
      vi.mocked(useAppState).mockReturnValue({
        allFoodItems: [otherFood, favFood],
        favoriteFoods: [favFood],
      } as unknown as ReturnType<typeof useAppState>);

      render(<VoiceFoodLogger />);

      const [, corpus] = vi.mocked(fuzzyMatchFoodName).mock.calls[0]!;
      expect((corpus as FoodItem[])[0]?.name).toBe("Apple");
    });

    it("deduplicates items that appear in both favorites and allFoodItems", () => {
      vi.mocked(useAppState).mockReturnValue({
        allFoodItems: [favFood, otherFood],
        favoriteFoods: [favFood],
      } as unknown as ReturnType<typeof useAppState>);

      render(<VoiceFoodLogger />);

      const [, corpus] = vi.mocked(fuzzyMatchFoodName).mock.calls[0]!;
      const items = corpus as FoodItem[];
      expect(items.filter((f) => f.name === "Apple")).toHaveLength(1);
      expect(items.filter((f) => f.name === "Banana")).toHaveLength(1);
    });

    it("passes the transcript and limit=3 to fuzzyMatchFoodName", () => {
      vi.mocked(useAppState).mockReturnValue({
        allFoodItems: [],
        favoriteFoods: [],
      } as unknown as ReturnType<typeof useAppState>);

      render(<VoiceFoodLogger />);

      expect(vi.mocked(fuzzyMatchFoodName)).toHaveBeenCalledWith("fruit", [], 3);
    });

    it("does not call fuzzyMatchFoodName when transcript is null", () => {
      vi.mocked(useVoiceCapture).mockReturnValue(makeVoiceCapture({ transcript: null }));
      render(<VoiceFoodLogger />);
      expect(vi.mocked(fuzzyMatchFoodName)).not.toHaveBeenCalled();
    });
  });
});

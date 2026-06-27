import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VoiceFoodLogger from "./VoiceFoodLogger";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { FoodItemId, fuzzyMatchFoodName, ISODate, UserId } from "../types";
import type { FoodItem } from "../db/dbService";
import type { RecognizedFoodItem } from "../lib/aiLoggingApi";

const mockUseVoiceCapture = vi.hoisted(() => vi.fn());
const mockUseAppState = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useVoiceCapture", () => ({
  useVoiceCapture: mockUseVoiceCapture,
}));
vi.mock("../state/AppState", () => ({
  useAppState: mockUseAppState,
}));
vi.mock("../types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../types")>();
  return { ...actual, fuzzyMatchFoodName: vi.fn() };
});
vi.mock("../lib/aiLoggingApi", () => ({
  parseText: vi.fn(),
}));

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

function makeNonAiState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    allFoodItems: [],
    favoriteFoods: [],
    aiEnabled: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseVoiceCapture.mockReturnValue(makeVoiceCapture());
  mockUseAppState.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = makeNonAiState();
    return selector ? selector(state) : state;
  });
  vi.mocked(fuzzyMatchFoodName).mockReturnValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("VoiceFoodLogger", () => {
  describe("idle state (not listening, no transcript)", () => {
    it("shows 'Click to start listening' when voice is supported", () => {
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/click to start listening/i)).toBeDefined();
    });

    it("shows 'Not supported in this browser' when voice is not supported", () => {
      mockUseVoiceCapture.mockReturnValue(makeVoiceCapture({ isSupported: false }));
      render(<VoiceFoodLogger />);
      expect(screen.getByText(/not supported in this browser/i)).toBeDefined();
    });

    it("enables the Speak Food button when supported", () => {
      render(<VoiceFoodLogger />);
      const btn = screen.getByRole("button", { name: /speak food/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("disables the Speak Food button when not supported", () => {
      mockUseVoiceCapture.mockReturnValue(makeVoiceCapture({ isSupported: false }));
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
      mockUseVoiceCapture.mockReturnValue(makeVoiceCapture({ isListening: true }));
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
      mockUseVoiceCapture.mockReturnValue(makeVoiceCapture({ error: "Microphone access denied" }));
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Microphone access denied")).toBeDefined();
    });

    it("shows error even while in idle state", () => {
      mockUseVoiceCapture.mockReturnValue(
        makeVoiceCapture({ error: "Permission error", isSupported: true }),
      );
      render(<VoiceFoodLogger />);
      expect(screen.getByText("Permission error")).toBeDefined();
      expect(screen.getByText(/click to start listening/i)).toBeDefined();
    });
  });

  describe("transcript state - no matches", () => {
    beforeEach(() => {
      mockUseVoiceCapture.mockReturnValue(
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
      mockUseVoiceCapture.mockReturnValue(
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
      mockUseVoiceCapture.mockReturnValue(
        makeVoiceCapture({ transcript: "fruit", isListening: false }),
      );
    });

    it("passes favorites first in the corpus to fuzzyMatchFoodName", () => {
      mockUseAppState.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) => {
        const state = makeNonAiState({
          allFoodItems: [otherFood, favFood],
          favoriteFoods: [favFood],
        });
        return selector ? selector(state) : state;
      });

      render(<VoiceFoodLogger />);

      const [, corpus] = vi.mocked(fuzzyMatchFoodName).mock.calls[0]!;
      expect((corpus as FoodItem[])[0]?.name).toBe("Apple");
    });

    it("deduplicates items that appear in both favorites and allFoodItems", () => {
      mockUseAppState.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) => {
        const state = makeNonAiState({
          allFoodItems: [favFood, otherFood],
          favoriteFoods: [favFood],
        });
        return selector ? selector(state) : state;
      });

      render(<VoiceFoodLogger />);

      const [, corpus] = vi.mocked(fuzzyMatchFoodName).mock.calls[0]!;
      const items = corpus as FoodItem[];
      expect(items.filter((f) => f.name === "Apple")).toHaveLength(1);
      expect(items.filter((f) => f.name === "Banana")).toHaveLength(1);
    });

    it("passes the transcript and limit=3 to fuzzyMatchFoodName", () => {
      render(<VoiceFoodLogger />);
      expect(vi.mocked(fuzzyMatchFoodName)).toHaveBeenCalledWith("fruit", [], 3);
    });

    it("does not call fuzzyMatchFoodName when transcript is null", () => {
      mockUseVoiceCapture.mockReturnValue(makeVoiceCapture({ transcript: null }));
      render(<VoiceFoodLogger />);
      expect(vi.mocked(fuzzyMatchFoodName)).not.toHaveBeenCalled();
    });
  });
});

describe("VoiceFoodLogger AI mode (aiEnabled=true)", () => {
  const AI_ITEM: RecognizedFoodItem = {
    name: "Margherita Pizza",
    confidence: 1.0,
    source: "off_match",
    offProductId: "001",
    calories: 250,
    protein: 11,
    carbs: 33,
    fat: 8,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockUseVoiceCapture.mockReturnValue({
      isSupported: true,
      isListening: false,
      transcript: "",
      error: null,
      startListening: vi.fn(),
      stopListening: vi.fn(),
    });
    mockUseAppState.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) => {
      const state: Record<string, unknown> = {
        allFoodItems: [],
        favoriteFoods: [],
        selectedDate: ISODate("2026-06-22"),
        userId: UserId("user-1"),
        addFoodLog: vi.fn().mockResolvedValue(undefined),
        aiEnabled: true,
        aiModelConsented: true,
      };
      return selector ? selector(state) : state;
    });
  });

  it("renders text area when aiEnabled is true", () => {
    render(<VoiceFoodLogger />);
    expect(screen.getByRole("textbox", { name: /describe your meal/i })).toBeInTheDocument();
  });

  it("Parse Meal button calls parseText with text area content", async () => {
    const { parseText } = await import("../lib/aiLoggingApi");
    vi.mocked(parseText).mockResolvedValue([]);

    render(<VoiceFoodLogger />);
    const textarea = screen.getByRole("textbox", { name: /describe your meal/i });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "I had pizza for lunch" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /parse meal/i }));
    });
    await waitFor(() => expect(vi.mocked(parseText)).toHaveBeenCalledWith("I had pizza for lunch"));
  });

  it("shows FoodReviewRow when parseText returns results", async () => {
    const { parseText } = await import("../lib/aiLoggingApi");
    vi.mocked(parseText).mockResolvedValue([AI_ITEM]);

    render(<VoiceFoodLogger />);
    const textarea = screen.getByRole("textbox", { name: /describe your meal/i });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "pizza" } });
      fireEvent.click(screen.getByRole("button", { name: /parse meal/i }));
    });
    await waitFor(() => expect(screen.getByDisplayValue("Margherita Pizza")).toBeInTheDocument());
  });

  it("shows no-foods-found message when parseText returns empty", async () => {
    const { parseText } = await import("../lib/aiLoggingApi");
    vi.mocked(parseText).mockResolvedValue([]);

    render(<VoiceFoodLogger />);
    const textarea = screen.getByRole("textbox", { name: /describe your meal/i });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "zzzz" } });
      fireEvent.click(screen.getByRole("button", { name: /parse meal/i }));
    });
    await waitFor(() => expect(screen.getByText(/no foods found/i)).toBeInTheDocument());
  });
});

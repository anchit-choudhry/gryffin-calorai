import "fake-indexeddb/auto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FoodReviewRow } from "./FoodReviewRow";
import { useAppState } from "@/state/AppState";
import { todayISO, UserId } from "@/types";
import type { RecognizedFoodItem } from "@/lib/aiLoggingApi";

const TEST_USER = UserId("review-test-user");

const OFF_MATCH_ITEM: RecognizedFoodItem = {
  name: "Margherita Pizza",
  confidence: 0.87,
  source: "off_match",
  offProductId: "001",
  calories: 250,
  protein: 11,
  carbs: 33,
  fat: 8,
};

const ESTIMATE_ITEM: RecognizedFoodItem = {
  name: "quinoa bowl",
  confidence: 1.0,
  source: "estimate",
};

beforeEach(() => {
  useAppState.setState({
    userId: TEST_USER,
    selectedDate: todayISO(),
    addFoodLog: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FoodReviewRow - off_match", () => {
  it("renders name and pre-filled calories for off_match item", () => {
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByDisplayValue("250")).toBeInTheDocument();
  });

  it("Log this food button is enabled for off_match item", () => {
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /log this food/i })).not.toBeDisabled();
  });

  it("shows confidence percentage for off_match", () => {
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByText(/87% match/i)).toBeInTheDocument();
  });

  it("calls addFoodLog with correct captureMethod on Log click", async () => {
    const onLogged = vi.fn();
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={vi.fn()}
        onLogged={onLogged}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log this food/i }));
    });
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    const addFoodLog = useAppState.getState().addFoodLog as ReturnType<typeof vi.fn>;
    expect(addFoodLog).toHaveBeenCalledWith(
      expect.objectContaining({ captureMethod: "photo_ai", calories: 250 }),
    );
  });

  it("calls onRemove when Remove button clicked", () => {
    const onRemove = vi.fn();
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={onRemove}
        onLogged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("shows inline error and does not call onLogged when addFoodLog throws", async () => {
    const onLogged = vi.fn();
    useAppState.setState({
      addFoodLog: vi.fn().mockRejectedValue(new Error("DB error")),
    });
    render(
      <FoodReviewRow
        item={OFF_MATCH_ITEM}
        captureMethod="photo_ai"
        onRemove={vi.fn()}
        onLogged={onLogged}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log this food/i }));
    });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/failed to log food/i));
    expect(onLogged).not.toHaveBeenCalled();
  });
});

describe("FoodReviewRow - estimate", () => {
  it("renders name with empty calories field for estimate item", () => {
    render(
      <FoodReviewRow
        item={ESTIMATE_ITEM}
        captureMethod="text_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("quinoa bowl")).toBeInTheDocument();
    const calInput = screen.getByLabelText(/calories/i) as HTMLInputElement;
    expect(calInput.value).toBe("");
  });

  it("Log this food button is disabled for estimate with empty calories", () => {
    render(
      <FoodReviewRow
        item={ESTIMATE_ITEM}
        captureMethod="text_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /log this food/i })).toBeDisabled();
  });

  it("enables Log button after user fills in calories", async () => {
    render(
      <FoodReviewRow
        item={ESTIMATE_ITEM}
        captureMethod="text_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    const calInput = screen.getByLabelText(/calories/i);
    await act(async () => {
      fireEvent.change(calInput, { target: { value: "400" } });
    });
    expect(screen.getByRole("button", { name: /log this food/i })).not.toBeDisabled();
  });

  it("shows no-database-match note for estimate items", () => {
    render(
      <FoodReviewRow
        item={ESTIMATE_ITEM}
        captureMethod="voice_ai"
        onRemove={vi.fn()}
        onLogged={vi.fn()}
      />,
    );
    expect(screen.getByText(/no database match/i)).toBeInTheDocument();
  });
});

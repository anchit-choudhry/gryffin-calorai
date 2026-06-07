import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import type { FoodItem } from "../db/dbService";

// fuzzyMatchFoodName is a real utility - use the actual implementation.
// FoodItem corpus factory:
function makeFood(name: string, calories = 100): FoodItem {
  return {
    name,
    calories,
    servingSize: 1,
    dateLogged: "2026-06-01",
    isFavorite: false,
    mealType: "Lunch",
  } as unknown as FoodItem;
}

const CORPUS: FoodItem[] = [
  makeFood("Chicken Breast", 165),
  makeFood("Chicken Salad", 200),
  makeFood("Apple", 95),
  makeFood("Banana", 105),
  makeFood("Brown Rice", 215),
];

describe("FoodSearchCombobox", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when query is shorter than 2 characters", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox query="c" corpus={CORPUS} onSelect={onSelect} inputRef={inputRef} />
      </div>,
    );
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("returns null when query has no fuzzy matches", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="zzzzzz"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders a listbox with matching options for a valid query", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByText("Chicken Breast")).toBeTruthy();
    expect(screen.getByText("Chicken Salad")).toBeTruthy();
  });

  it("shows calorie count alongside each match", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    expect(screen.getByText("165 kcal")).toBeTruthy();
    expect(screen.getByText("200 kcal")).toBeTruthy();
  });

  it("calls onSelect when a match item is mouse-downed", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox query="apple" corpus={CORPUS} onSelect={onSelect} inputRef={inputRef} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByText("Apple").closest("button")!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "Apple" }));
  });

  it("ArrowDown on the input moves active index to first item", async () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <div>
        <input ref={inputRef} data-testid="name-input" />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    const input = container.querySelector("input")!;
    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    // First option should be aria-selected
    const options = screen.getAllByRole("option");
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("Enter on the input selects the active item", async () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    const input = container.querySelector("input")!;
    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("Escape key resets the active index without calling onSelect", async () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    const input = container.querySelector("input")!;
    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    expect(onSelect).not.toHaveBeenCalled();
    // All options should no longer be selected.
    const options = screen.getAllByRole("option");
    options.forEach((opt) => {
      expect(opt.getAttribute("aria-selected")).toBe("false");
    });
  });

  it("sets ARIA attributes on the input element when matches are visible", () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={CORPUS}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    const input = container.querySelector("input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
  });

  it("limits results to a maximum of 6 items", () => {
    const largeCorpus: FoodItem[] = Array.from({ length: 20 }, (_, i) => makeFood(`Chicken ${i}`));
    const inputRef = createRef<HTMLInputElement>();
    render(
      <div>
        <input ref={inputRef} />
        <FoodSearchCombobox
          query="chicken"
          corpus={largeCorpus}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      </div>,
    );
    const options = screen.getAllByRole("option");
    expect(options.length).toBeLessThanOrEqual(6);
  });
});

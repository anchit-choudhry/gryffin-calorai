import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import type { FoodItem } from "../db/dbService";
import type { OffProductResponse } from "../lib/offProductApi";

// Hoist so the variable is available inside the vi.mock() factory.
const mockSearchOff = vi.hoisted(() =>
  vi.fn<() => Promise<OffProductResponse[]>>(() => Promise.resolve([])),
);

vi.mock("../lib/offProductApi", () => ({
  searchOff: mockSearchOff,
  offProductToFoodItem: (p: OffProductResponse): unknown => ({
    name: p.productName ?? `Product ${p.code}`,
    calories: Math.round(p.energyKcal100g ?? 0),
    servingSize: 1,
    dateLogged: "",
    userId: "",
    isFavorite: false,
  }),
}));

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

function makeOffProduct(name: string, calories: number): OffProductResponse {
  return {
    code: `off-${name}`,
    productName: name,
    brands: null,
    servingSize: null,
    servingSizeG: null,
    nutritionGrade: null,
    mainCategory: null,
    imageSmallUrl: null,
    allergensTags: null,
    tracesTags: null,
    energyKcal100g: calories,
    energyKj100g: null,
    proteins100g: null,
    carbohydrates100g: null,
    sugars100g: null,
    fat100g: null,
    saturatedFat100g: null,
    transFat100g: null,
    monounsaturatedFat100g: null,
    polyunsaturatedFat100g: null,
    omega3Fat100g: null,
    cholesterol100g: null,
    fiber100g: null,
    sodium100g: null,
    calcium100g: null,
    iron100g: null,
    potassium100g: null,
    magnesium100g: null,
    phosphorus100g: null,
    zinc100g: null,
    selenium100g: null,
    copper100g: null,
    manganese100g: null,
    iodine100g: null,
    vitaminA100g: null,
    vitaminB1100g: null,
    vitaminB2100g: null,
    vitaminB6100g: null,
    vitaminB9100g: null,
    vitaminB12100g: null,
    vitaminC100g: null,
    vitaminD100g: null,
    vitaminE100g: null,
    vitaminK100g: null,
    offLastModifiedAt: null,
  };
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
    // resetAllMocks clears the mockResolvedValueOnce queue (clearAllMocks does not).
    vi.resetAllMocks();
    mockSearchOff.mockResolvedValue([]);
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

  it("returns null when query has no fuzzy matches and OFF returns nothing", () => {
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
    // Debounce not yet fired - initial render has no local or OFF results.
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

  describe("OFF search fallback", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows OFF results under a section header when local corpus has no matches", async () => {
      mockSearchOff.mockResolvedValueOnce([
        makeOffProduct("Quinoa Puffs", 380),
        makeOffProduct("Millet Crackers", 420),
      ]);
      const inputRef = createRef<HTMLInputElement>();
      render(
        <div>
          <input ref={inputRef} />
          <FoodSearchCombobox
            query="quinoa"
            corpus={CORPUS}
            onSelect={onSelect}
            inputRef={inputRef}
          />
        </div>,
      );
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByRole("listbox")).toBeTruthy();
      expect(screen.getByText("Open Food Facts")).toBeTruthy();
      expect(screen.getByText("Quinoa Puffs")).toBeTruthy();
      expect(screen.getByText("380 kcal")).toBeTruthy();
    });

    it("does not trigger OFF search before the 300ms debounce elapses", () => {
      mockSearchOff.mockResolvedValueOnce([makeOffProduct("Quinoa Puffs", 380)]);
      const inputRef = createRef<HTMLInputElement>();
      render(
        <div>
          <input ref={inputRef} />
          <FoodSearchCombobox
            query="quinoa"
            corpus={CORPUS}
            onSelect={onSelect}
            inputRef={inputRef}
          />
        </div>,
      );
      vi.advanceTimersByTime(299);
      expect(mockSearchOff).not.toHaveBeenCalled();
    });

    it("does not show OFF section when local matches exist", async () => {
      mockSearchOff.mockResolvedValueOnce([makeOffProduct("Chicken Soup", 80)]);
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
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });
      expect(screen.queryByText("Open Food Facts")).toBeNull();
      expect(screen.getByText("Chicken Breast")).toBeTruthy();
    });

    it("selects an OFF result on mousedown", async () => {
      mockSearchOff.mockResolvedValueOnce([makeOffProduct("Quinoa Puffs", 380)]);
      const inputRef = createRef<HTMLInputElement>();
      render(
        <div>
          <input ref={inputRef} />
          <FoodSearchCombobox
            query="quinoa"
            corpus={CORPUS}
            onSelect={onSelect}
            inputRef={inputRef}
          />
        </div>,
      );
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
        await Promise.resolve();
      });
      fireEvent.mouseDown(screen.getByText("Quinoa Puffs").closest("button")!);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "Quinoa Puffs" }));
    });

    it("ArrowDown navigates into OFF items when local matches are empty", async () => {
      mockSearchOff.mockResolvedValueOnce([
        makeOffProduct("Quinoa Puffs", 380),
        makeOffProduct("Millet Crackers", 420),
      ]);
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(
        <div>
          <input ref={inputRef} />
          <FoodSearchCombobox
            query="quinoa"
            corpus={CORPUS}
            onSelect={onSelect}
            inputRef={inputRef}
          />
        </div>,
      );
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
        await Promise.resolve();
      });
      const input = container.querySelector("input")!;
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });
      const options = screen.getAllByRole("option");
      expect(options[0]?.getAttribute("aria-selected")).toBe("true");
      expect(options[1]?.getAttribute("aria-selected")).toBe("false");
    });

    it("clears OFF results when query re-renders with local matches", async () => {
      mockSearchOff.mockResolvedValueOnce([makeOffProduct("Quinoa Puffs", 380)]);
      const inputRef = createRef<HTMLInputElement>();
      const { rerender } = render(
        <div>
          <input ref={inputRef} />
          <FoodSearchCombobox
            query="quinoa"
            corpus={CORPUS}
            onSelect={onSelect}
            inputRef={inputRef}
          />
        </div>,
      );
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText("Open Food Facts")).toBeTruthy();

      rerender(
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
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByText("Open Food Facts")).toBeNull();
      expect(screen.getByText("Chicken Breast")).toBeTruthy();
    });

    it("returns null after debounce fires when OFF also returns empty", async () => {
      mockSearchOff.mockResolvedValueOnce([]);
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
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});

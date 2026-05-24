import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRecurringMealForm } from "./useRecurringMealForm";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");

const baseMock = {
  addRecurringMeal: vi.fn(),
  allFoodItems: [],
};

const validFoods = [
  {
    name: "Oats",
    calories: 150,
    servingSize: 40,
    protein: 5,
    carbs: 27,
    fat: 3,
    mealType: "Breakfast" as const,
  },
];

describe("useRecurringMealForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns form and onSubmit", () => {
    const { result } = renderHook(() => useRecurringMealForm());
    expect(result.current.form).toBeDefined();
    expect(typeof result.current.onSubmit).toBe("function");
  });

  it("has correct default values", () => {
    const { result } = renderHook(() => useRecurringMealForm());
    const values = result.current.form.getValues();
    expect(values.name).toBe("");
    expect(values.dayMask).toBe(0b1111111);
    expect(values.mealType).toBe("Breakfast");
    expect(values.scheduledTime).toBe("08:00");
    expect(values.foods).toStrictEqual([]);
  });

  it("calls addRecurringMeal with form values on valid submit", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addRecurringMeal: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm());

    await act(async () => {
      result.current.form.setValue("name", "Morning Oats");
      result.current.form.setValue("dayMask", 0b0011111);
      result.current.form.setValue("foods", validFoods);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Morning Oats",
        dayMask: 0b0011111,
        mealType: "Breakfast",
        scheduledTime: "08:00",
        foods: validFoods,
      }),
    );
  });

  it("resets form after successful submit", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addRecurringMeal: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm());

    await act(async () => {
      result.current.form.setValue("name", "Evening Snack");
      result.current.form.setValue("foods", validFoods);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("foods")).toStrictEqual([]);
  });

  it("calls onSuccess callback after successful submit", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addRecurringMeal: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm(onSuccess));

    await act(async () => {
      result.current.form.setValue("name", "Morning Oats");
      result.current.form.setValue("foods", validFoods);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not submit when name is empty (validation fails)", async () => {
    const mockAdd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addRecurringMeal: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm());

    await act(async () => {
      result.current.form.setValue("foods", validFoods);
      // name stays empty - schema requires min(1)
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("does not submit when foods array is empty (validation fails)", async () => {
    const mockAdd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addRecurringMeal: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm());

    await act(async () => {
      result.current.form.setValue("name", "Morning Oats");
      // foods stays empty - schema requires min(1)
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("exposes allFoodItems from state", () => {
    const items = [{ name: "Apple", calories: 80 }];
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      allFoodItems: items,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useRecurringMealForm());
    expect(result.current.allFoodItems).toStrictEqual(items);
  });
});

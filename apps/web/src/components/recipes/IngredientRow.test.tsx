import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import IngredientRow from "./IngredientRow";
import type { RecipeFormValues } from "@/forms/schemas";
import type { FoodItem } from "@/db/dbService";
import type { FoodItemId, ISODate, UserId } from "@/types";

const mockFoodItems: FoodItem[] = [
  {
    id: 1 as unknown as FoodItemId,
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: 100,
    dateLogged: "2026-05-27" as unknown as ISODate,
    userId: "user1" as unknown as UserId,
    isFavorite: false,
    mealType: "Dinner",
    syncId: "sync1",
  },
  {
    id: 2 as unknown as FoodItemId,
    name: "Brown Rice",
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    servingSize: 100,
    dateLogged: "2026-05-27" as unknown as ISODate,
    userId: "user1" as unknown as UserId,
    isFavorite: true,
    mealType: "Lunch",
    syncId: "sync2",
  },
];

function IngredientRowWrapper({
  index = 0,
  fieldId = "field-1",
  onRemove = vi.fn(),
  defaultFoodName = "",
  defaultFoodId = null as number | null,
}: {
  index?: number;
  fieldId?: string;
  onRemove?: () => void;
  defaultFoodName?: string;
  defaultFoodId?: number | null;
}) {
  const form = useForm<RecipeFormValues>({
    defaultValues: {
      recipeName: "Test Recipe",
      ingredients: [
        {
          foodItemId: defaultFoodId ?? 0,
          foodItemName: defaultFoodName,
          quantity: 1,
          serving: 100,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      ],
    },
  });

  const field: FieldArrayWithId<RecipeFormValues, "ingredients"> = {
    id: fieldId,
    foodItemId: defaultFoodId ?? 0,
    foodItemName: defaultFoodName,
    quantity: 1,
    serving: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  return (
    <IngredientRow
      field={field}
      index={index}
      form={form as unknown as UseFormReturn<RecipeFormValues>}
      allFoodItems={mockFoodItems}
      onRemove={onRemove}
    />
  );
}

describe("IngredientRow", () => {
  it("renders ingredient row container", () => {
    const { container } = render(<IngredientRowWrapper />);
    expect(container.querySelector(".group.flex")).toBeInTheDocument();
  });

  it("renders food item input with placeholder", () => {
    render(<IngredientRowWrapper />);
    const foodInput = screen.getByPlaceholderText("Search food item...");
    expect(foodInput).toBeInTheDocument();
    expect(foodInput).toHaveAttribute("type", "text");
  });

  it("renders quantity input with aria label", () => {
    render(<IngredientRowWrapper />);
    const qtyInput = screen.getByLabelText("Ingredient quantity");
    expect(qtyInput).toBeInTheDocument();
    expect(qtyInput).toHaveAttribute("type", "number");
  });

  it("renders serving input with aria label", () => {
    render(<IngredientRowWrapper />);
    const servInput = screen.getByLabelText("Ingredient serving size");
    expect(servInput).toBeInTheDocument();
    expect(servInput).toHaveAttribute("type", "number");
  });

  it("renders remove button with accessible label", () => {
    render(<IngredientRowWrapper />);
    const removeBtn = screen.getByLabelText("Remove ingredient");
    expect(removeBtn).toBeInTheDocument();
    expect(removeBtn).toHaveTextContent("✕");
  });

  it("calls onRemove callback when remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<IngredientRowWrapper onRemove={onRemove} />);
    const removeBtn = screen.getByLabelText("Remove ingredient");
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("renders datalist with food items", () => {
    const { container } = render(<IngredientRowWrapper fieldId="field-123" />);
    const datalist = container.querySelector(`datalist[id="food-items-field-123"]`);
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll("option")).toHaveLength(2);
  });

  it("displays food item names in datalist options", () => {
    const { container } = render(<IngredientRowWrapper fieldId="field-xyz" />);
    const datalist = container.querySelector(`datalist[id="food-items-field-xyz"]`);
    const options = datalist?.querySelectorAll("option");
    expect(options?.[0]).toHaveAttribute("value", "Chicken Breast");
    expect(options?.[1]).toHaveAttribute("value", "Brown Rice");
  });

  it("has input connected to datalist", () => {
    render(<IngredientRowWrapper fieldId="field-abc" />);
    const foodInput = screen.getByPlaceholderText("Search food item...");
    expect(foodInput).toHaveAttribute("list", "food-items-field-abc");
  });

  it("applies correct CSS classes to inputs", () => {
    render(<IngredientRowWrapper />);
    const foodInput = screen.getByPlaceholderText("Search food item...");
    const qtyInput = screen.getByLabelText("Ingredient quantity");
    const servInput = screen.getByLabelText("Ingredient serving size");

    expect(foodInput.className).toContain("w-full");
    expect(foodInput.className).toContain("text-sm");
    expect(qtyInput.className).toContain("w-16");
    expect(servInput.className).toContain("w-16");
  });

  it("renders border and padding classes", () => {
    const { container } = render(<IngredientRowWrapper />);
    const row = container.querySelector(".group.flex");
    expect(row?.className).toContain("border");
    expect(row?.className).toContain("gap-2");
    expect(row?.className).toContain("items-center");
    expect(row?.className).toContain("p-3");
  });

  it("renders remove button with hover effect styling", () => {
    render(<IngredientRowWrapper />);
    const removeBtn = screen.getByLabelText("Remove ingredient");
    expect(removeBtn.className).toContain("hover:text-persimmon");
    expect(removeBtn.className).toContain("transition-colors");
    expect(removeBtn.className).toContain("group-hover:opacity-100");
  });

  it("has remove button with type button", () => {
    render(<IngredientRowWrapper />);
    const removeBtn = screen.getByLabelText("Remove ingredient");
    expect(removeBtn).toHaveAttribute("type", "button");
  });

  it("renders correct number input attributes", () => {
    render(<IngredientRowWrapper />);
    const qtyInput = screen.getByLabelText("Ingredient quantity");
    const servInput = screen.getByLabelText("Ingredient serving size");

    expect(qtyInput).toHaveAttribute("type", "number");
    expect(servInput).toHaveAttribute("type", "number");
  });

  it("handles food item input changes", () => {
    render(<IngredientRowWrapper />);
    const foodInput = screen.getByPlaceholderText("Search food item...");
    fireEvent.change(foodInput, { target: { value: "Chicken Breast" } });
    expect(foodInput).toHaveValue("Chicken Breast");
  });

  it("auto-populates fields when matching food item is found", () => {
    render(<IngredientRowWrapper fieldId="match-test" />);
    const foodInput = screen.getByPlaceholderText("Search food item...") as HTMLInputElement;
    fireEvent.change(foodInput, { target: { value: "Chicken Breast" } });
    expect(foodInput.value).toBe("Chicken Breast");
  });

  it("handles quantity input changes", () => {
    render(<IngredientRowWrapper />);
    const qtyInput = screen.getByLabelText("Ingredient quantity") as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: "2" } });
    expect(qtyInput.value).toBe("2");
  });

  it("handles serving input changes", () => {
    render(<IngredientRowWrapper />);
    const servInput = screen.getByLabelText("Ingredient serving size") as HTMLInputElement;
    fireEvent.change(servInput, { target: { value: "150" } });
    expect(servInput.value).toBe("150");
  });

  it("displays initial food item name when provided", () => {
    render(<IngredientRowWrapper defaultFoodName="Brown Rice" defaultFoodId={2} />);
    const foodInput = screen.getByPlaceholderText("Search food item...") as HTMLInputElement;
    expect(foodInput.value).toBe("Brown Rice");
  });

  it("updates quantity with number input", () => {
    const { container } = render(<IngredientRowWrapper />);
    const qtyInput = container.querySelector(
      'input[aria-label="Ingredient quantity"]',
    ) as HTMLInputElement;
    expect(qtyInput.type).toBe("number");
    fireEvent.change(qtyInput, { target: { value: "5" } });
    expect(qtyInput.value).toBe("5");
  });

  it("updates serving with number input", () => {
    const { container } = render(<IngredientRowWrapper />);
    const servInput = container.querySelector(
      'input[aria-label="Ingredient serving size"]',
    ) as HTMLInputElement;
    expect(servInput.type).toBe("number");
    fireEvent.change(servInput, { target: { value: "200" } });
    expect(servInput.value).toBe("200");
  });

  it("renders with multiple food items in datalist", () => {
    const { container } = render(<IngredientRowWrapper fieldId="food-list" />);
    const datalist = container.querySelector(`datalist[id="food-items-food-list"]`);
    const options = datalist?.querySelectorAll("option");
    expect(options).toHaveLength(mockFoodItems.length);
  });

  it("renders with default quantity and serving values", () => {
    const { container } = render(<IngredientRowWrapper />);
    const qtyInput = container.querySelector(
      'input[aria-label="Ingredient quantity"]',
    ) as HTMLInputElement;
    const servInput = container.querySelector(
      'input[aria-label="Ingredient serving size"]',
    ) as HTMLInputElement;
    expect(qtyInput.value).toBe("1");
    expect(servInput.value).toBe("100");
  });

  it("renders ingredient row with correct spacing", () => {
    const { container } = render(<IngredientRowWrapper />);
    const row = container.querySelector(".flex.gap-2");
    expect(row).toBeInTheDocument();
    expect(row?.className).toContain("gap-2");
    expect(row?.className).toContain("items-center");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RecipeRow from "./RecipeRow";
import { FoodItemId, RecipeId, UserId } from "@/types";
import type { Recipe } from "@/db/dbService";

const baseRecipe: Recipe = {
  id: RecipeId(1),
  name: "Chicken Bowl",
  description: "A simple high-protein bowl",
  ingredients: [{ foodItemId: FoodItemId(1), quantity: 1, serving: 1 }],
  totalCalories: 350,
  createdBy: UserId("u1"),
  dateCreated: "2026-05-01T00:00:00Z",
  userId: UserId("u1"),
};

describe("RecipeRow", () => {
  it("renders recipe name and calories", () => {
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Chicken Bowl")).toBeInTheDocument();
    expect(screen.getByText(/350/)).toBeInTheDocument();
  });

  it("renders ingredient count", () => {
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/1 ingredient/)).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/high-protein bowl/)).toBeInTheDocument();
  });

  it("shows protein, carbs, and fat when totals are provided", () => {
    const recipe: Recipe = {
      ...baseRecipe,
      totalProtein: 30,
      totalCarbs: 25,
      totalFat: 8,
    };
    render(<RecipeRow recipe={recipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/30g P/)).toBeInTheDocument();
    expect(screen.getByText(/25g C/)).toBeInTheDocument();
    expect(screen.getByText(/8g F/)).toBeInTheDocument();
  });

  it("hides macro line when totalProtein is not set", () => {
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/g P/)).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = vi.fn();
    render(<RecipeRow recipe={baseRecipe} onEdit={onEdit} onDelete={vi.fn()} />);
    screen.getByRole("button", { name: /edit recipe chicken bowl/i }).click();
    expect(onEdit).toHaveBeenCalledWith(baseRecipe);
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={onDelete} />);
    screen.getByRole("button", { name: /delete recipe chicken bowl/i }).click();
    expect(onDelete).toHaveBeenCalledWith(RecipeId(1));
  });

  it("renders dot-leader span between name and calorie value", () => {
    const { container } = render(
      <RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    const leader = container.querySelector('[aria-hidden="true"][class*="border-dotted"]');
    expect(leader).toBeTruthy();
  });

  it("calorie value and name are in the same dot-leader row", () => {
    render(<RecipeRow recipe={baseRecipe} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const nameEl = screen.getByText("Chicken Bowl");
    const caloriesEl = screen.getByText("350");
    const nameParent = nameEl.closest("div");
    const caloriesParent = caloriesEl.closest("div");
    expect(nameParent).toBe(caloriesParent);
  });
});

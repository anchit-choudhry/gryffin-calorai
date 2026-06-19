import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeShareSheet } from "./RecipeShareSheet";
import type { Recipe } from "@/db/dbService";

vi.mock("../../state/AppState", () => ({
  useAppState: vi.fn().mockReturnValue({ allFoodItems: [] }),
}));

vi.mock("../../lib/recipeShare", () => ({
  buildShareUrl: vi.fn().mockReturnValue("https://example.com/#recipes?share=abc123"),
}));

vi.mock("qr-creator", () => ({
  default: { render: vi.fn() },
}));

const baseRecipe: Recipe = {
  id: 1 as unknown as Recipe["id"],
  name: "Granola Bowl",
  description: "High protein breakfast",
  totalCalories: 420,
  totalProtein: 22,
  totalCarbs: 55,
  totalFat: 10,
  ingredients: [],
  userId: "user-1" as Recipe["userId"],
  createdBy: "user-1" as Recipe["userId"],
  dateCreated: "2026-01-01" as Recipe["dateCreated"],
};

describe("RecipeShareSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the recipe name as dialog heading", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /granola bowl/i })).toBeTruthy();
  });

  it("has dialog role with aria-label", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toContain("Granola Bowl");
  });

  it("renders 'Share Recipe' kicker", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByText(/share recipe/i)).toBeTruthy();
  });

  it("renders a canvas element for the QR code", () => {
    const { container } = render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders Copy Link button", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeTruthy();
  });

  it("renders close button with aria-label", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /close share sheet/i })).toBeTruthy();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<RecipeShareSheet recipe={baseRecipe} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close share sheet/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<RecipeShareSheet recipe={baseRecipe} onClose={onClose} />);
    const backdrop = container.querySelector("[aria-hidden='true']");
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows truncated share URL in caption", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByText(/recipes\?share=/)).toBeTruthy();
  });

  it("shows import instruction text", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByText(/recipient opens/i)).toBeTruthy();
  });

  it("does not render native Share button when navigator.share is absent", () => {
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /^share$/i })).toBeNull();
  });

  it("renders native Share button when navigator.share is present", () => {
    vi.stubGlobal("navigator", { share: vi.fn() });
    render(<RecipeShareSheet recipe={baseRecipe} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^share$/i })).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

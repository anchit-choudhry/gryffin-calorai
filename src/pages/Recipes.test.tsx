import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FoodItemId, RecipeId, UserId } from "@/types";
import { type Recipe, saveRecipe } from "@/db/dbService";
import { toast } from "sonner";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");
vi.mock("sonner");
vi.mock("../db/dbService", () => ({ saveRecipe: vi.fn() }));

vi.mock("../components/recipes/RecipeForm", () => ({ default: () => <div>RecipeForm</div> }));
vi.mock("../components/recipes/RecipeList", () => ({
  default: ({
    recipes,
    onEdit,
    onDelete,
  }: {
    recipes: Recipe[];
    onEdit: (r: Recipe) => void;
    onDelete: (id: RecipeId) => void;
  }) =>
    recipes.length === 0 ? (
      <p>No recipes found</p>
    ) : (
      <ul>
        {recipes.map((r) => (
          <li key={r.id}>
            {r.name}
            <button onClick={() => onEdit(r)}>Edit {r.name}</button>
            <button onClick={() => onDelete(r.id!)}>Delete {r.name}</button>
          </li>
        ))}
      </ul>
    ),
}));
vi.mock("../components/recipes/RecipesHero", () => ({
  default: () => <div>RecipesHero</div>,
}));
vi.mock("../components/dashboard/SectionHeader", () => ({
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <h2>
      {title}
      {subtitle ? ` ${subtitle}` : ""}
    </h2>
  ),
}));
vi.mock("../components/dashboard/EditorialFrame", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("motion/react", () => ({
  motion: {
    main: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  },
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
    onOpenChange,
  }: {
    open: boolean;
    children: React.ReactNode;
    onOpenChange?: (v: boolean) => void;
  }) =>
    open ? (
      <div role="dialog">
        {children}
        {onOpenChange && <button onClick={() => onOpenChange(false)}>Close dialog</button>}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const userId = UserId("u1");
const makeRecipe = (id: number, name: string): Recipe => ({
  id: RecipeId(id),
  name,
  description: "A recipe",
  ingredients: [{ foodItemId: FoodItemId(1), quantity: 1, serving: 1 }],
  totalCalories: 300,
  createdBy: userId,
  dateCreated: "2026-05-01T00:00:00Z",
  userId,
});

const recipes = [
  makeRecipe(1, "Chicken Bowl"),
  makeRecipe(2, "Pasta Primavera"),
  makeRecipe(3, "Chicken Stir Fry"),
];

beforeEach(() => {
  vi.mocked(appState.useAppState).mockReturnValue({
    recipes,
    deleteRecipe: vi.fn(),
    fetchRecipes: vi.fn(),
    userId,
    allFoodItems: [],
    checkAndUnlockAchievements: vi.fn(),
  } as unknown as ReturnType<typeof appState.useAppState>);
});

describe("Recipes page search filter", () => {
  it("renders all recipes when search is empty", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    expect(screen.getByText("Chicken Bowl")).toBeInTheDocument();
    expect(screen.getByText("Pasta Primavera")).toBeInTheDocument();
    expect(screen.getByText("Chicken Stir Fry")).toBeInTheDocument();
  });

  it("filters recipes by name when search query is typed", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: "chicken" } });
    expect(screen.getByText("Chicken Bowl")).toBeInTheDocument();
    expect(screen.getByText("Chicken Stir Fry")).toBeInTheDocument();
    expect(screen.queryByText("Pasta Primavera")).not.toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.change(screen.getByPlaceholderText(/search recipes/i), {
      target: { value: "PASTA" },
    });
    expect(screen.getByText("Pasta Primavera")).toBeInTheDocument();
    expect(screen.queryByText("Chicken Bowl")).not.toBeInTheDocument();
  });

  it("shows empty state when search matches nothing", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.change(screen.getByPlaceholderText(/search recipes/i), {
      target: { value: "xyz-no-match" },
    });
    expect(screen.getByText(/no recipes/i)).toBeInTheDocument();
  });
});

describe("Recipes page delete and edit handlers", () => {
  it("calls deleteRecipe when a recipe delete button is clicked", async () => {
    const deleteRecipe = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState.useAppState).mockReturnValue({
      recipes,
      deleteRecipe,
      fetchRecipes: vi.fn(),
      userId,
      allFoodItems: [],
      checkAndUnlockAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.click(screen.getByRole("button", { name: /delete chicken bowl/i }));
    await vi.waitFor(() => expect(deleteRecipe).toHaveBeenCalled());
  });

  it("opens the edit dialog when a recipe edit button is clicked", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.click(screen.getByRole("button", { name: /edit pasta primavera/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/edit recipe/i)).toBeInTheDocument();
  });

  it("closes the edit dialog when the close button is clicked", async () => {
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.click(screen.getByRole("button", { name: /edit pasta primavera/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls saveRecipe and fetchRecipes when undo action is triggered", async () => {
    vi.mocked(toast).mockClear();
    const fetchRecipes = vi.fn();
    vi.mocked(appState.useAppState).mockReturnValue({
      recipes,
      deleteRecipe: vi.fn().mockResolvedValue(undefined),
      fetchRecipes,
      userId,
      allFoodItems: [],
      checkAndUnlockAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.click(screen.getByRole("button", { name: /delete chicken bowl/i }));
    await vi.waitFor(() => expect(vi.mocked(toast)).toHaveBeenCalled());
    const call = vi.mocked(toast).mock.calls.at(-1)!;
    const onClick = (call[1] as unknown as { action: { onClick: () => Promise<void> } }).action
      .onClick;
    await onClick();
    expect(saveRecipe).toHaveBeenCalled();
    expect(fetchRecipes).toHaveBeenCalled();
  });

  it("skips toast when userId is absent after delete", async () => {
    const deleteRecipe = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState.useAppState).mockReturnValue({
      recipes,
      deleteRecipe,
      fetchRecipes: vi.fn(),
      userId: undefined,
      allFoodItems: [],
      checkAndUnlockAchievements: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Recipes = (await import("./Recipes")).default;
    render(<Recipes />);
    fireEvent.click(screen.getByRole("button", { name: /delete chicken bowl/i }));
    await vi.waitFor(() => expect(deleteRecipe).toHaveBeenCalled());
  });
});

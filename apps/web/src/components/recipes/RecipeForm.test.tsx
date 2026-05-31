import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RecipeForm from "./RecipeForm";
import * as appState from "../../state/AppState";
import * as recipeFormHook from "../../hooks/useRecipeForm";
import * as recipeImportHook from "../../hooks/useRecipeImport";
import { FoodItemId, ISODate, UserId } from "@/types";
import type { FoodItem } from "../../db/dbService";

vi.mock("../../state/AppState");
vi.mock("../../hooks/useRecipeForm");
vi.mock("../../hooks/useRecipeImport");
vi.mock("sonner");
vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({ render }: { render: (p: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({ field: { value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() } }),
  FormItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));

const makeFood = (id: number, name: string): FoodItem => ({
  id: FoodItemId(id),
  name,
  calories: 100,
  servingSize: 1,
  protein: 0,
  carbs: 0,
  fat: 0,
  dateLogged: ISODate("2026-05-01"),
  userId: UserId("user-1"),
  isFavorite: false,
});

const defaultFormReturn = () => ({
  form: {
    register: vi.fn(() => ({})),
    getValues: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => []),
    handleSubmit: vi.fn((fn: unknown) => (e: unknown) => {
      if (e && typeof e === "object" && "preventDefault" in e) {
        (e as { preventDefault: () => void }).preventDefault();
      }
      return fn;
    }),
    control: {},
    formState: { errors: {}, isSubmitting: false },
    reset: vi.fn(),
  } as unknown as ReturnType<typeof recipeFormHook.useRecipeForm>["form"],
  fields: [],
  append: vi.fn(),
  remove: vi.fn(),
  isLoading: false,
  saveRecipeForm: vi.fn().mockResolvedValue(true),
  mode: "create" as const,
});

const defaultImportReturn = () => ({
  url: "",
  setUrl: vi.fn(),
  isLoading: false,
  error: null,
  importedRecipe: null,
  importFromUrl: vi.fn(),
  clearImport: vi.fn(),
});

describe("RecipeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(appState).useAppState.mockReturnValue({
      userId: UserId("user-1"),
      allFoodItems: [makeFood(1, "chicken breast"), makeFood(2, "brown rice")],
    } as unknown as ReturnType<typeof appState.useAppState>);

    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue(defaultFormReturn());
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue(defaultImportReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders recipe name input label", () => {
    render(<RecipeForm />);
    expect(screen.getByText("Recipe Name")).toBeTruthy();
  });

  it("renders description input label", () => {
    render(<RecipeForm />);
    expect(screen.getByText("Description")).toBeTruthy();
  });

  it("renders Save Recipe button in create mode", () => {
    render(<RecipeForm />);
    expect(screen.getByText("Save Recipe")).toBeTruthy();
  });

  it("renders Update Recipe button in edit mode", () => {
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      mode: "edit",
    });
    render(<RecipeForm />);
    expect(screen.getByText("Update Recipe")).toBeTruthy();
  });

  it("renders import from URL input", () => {
    render(<RecipeForm />);
    expect(screen.getByPlaceholderText(/paste a recipe url/i)).toBeTruthy();
  });

  it("renders Import button", () => {
    render(<RecipeForm />);
    expect(screen.getByRole("button", { name: /import/i })).toBeTruthy();
  });

  it("calls setUrl when URL input changes", () => {
    const setUrl = vi.fn();
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      setUrl,
    });

    render(<RecipeForm />);
    const input = screen.getByPlaceholderText(/paste a recipe url/i);
    fireEvent.change(input, { target: { value: "https://example.com/recipe" } });
    expect(setUrl).toHaveBeenCalledWith("https://example.com/recipe");
  });

  it("calls importFromUrl when Import button is clicked", () => {
    const importFromUrl = vi.fn();
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      url: "https://example.com/recipe",
      importFromUrl,
    });

    render(<RecipeForm />);
    fireEvent.click(screen.getByRole("button", { name: /^import$/i }));
    expect(importFromUrl).toHaveBeenCalled();
  });

  it("shows error message when import has an error", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      error: "No recipe data found on this page.",
    });

    render(<RecipeForm />);
    expect(screen.getByText("No recipe data found on this page.")).toBeTruthy();
  });

  it("shows loading state on Import button while importing", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      isLoading: true,
    });

    render(<RecipeForm />);
    expect(screen.getByRole("button", { name: /importing/i })).toBeTruthy();
  });

  it("shows import success indicator when importedRecipe is set", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      importedRecipe: {
        name: "Chicken Bowl",
        description: "Quick meal",
        ingredients: [],
      },
    });

    render(<RecipeForm />);
    expect(screen.getByText(/imported/i)).toBeTruthy();
  });

  it("disables import button when url is empty", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      url: "",
    });

    render(<RecipeForm />);
    const importBtn = screen.getByRole("button", { name: /^import$/i });
    expect(importBtn).toHaveProperty("disabled", true);
  });

  it("enables import button when url is non-empty", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      url: "https://example.com/recipe",
    });

    render(<RecipeForm />);
    const importBtn = screen.getByRole("button", { name: /^import$/i });
    expect(importBtn).toHaveProperty("disabled", false);
  });

  it("calls onSuccess when form submission succeeds", async () => {
    const onSuccess = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      saveRecipeForm: vi.fn().mockResolvedValue(true),
    });

    render(<RecipeForm onSuccess={onSuccess} />);
    const form = document.querySelector("form")!;
    await import("@testing-library/react").then(({ act }) =>
      act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does not call onSuccess when form submission fails", async () => {
    const onSuccess = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      saveRecipeForm: vi.fn().mockResolvedValue(false),
    });

    render(<RecipeForm onSuccess={onSuccess} />);
    const form = document.querySelector("form")!;
    await import("@testing-library/react").then(({ act }) =>
      act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("renders ingredients section when fields are provided", () => {
    const append = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      fields: [
        {
          id: "field-1",
          foodItemId: 1,
          foodItemName: "chicken",
          quantity: 1,
          serving: 100,
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
        },
      ],
      append,
    });

    render(<RecipeForm />);
    expect(screen.getByText("Ingredients")).toBeInTheDocument();
  });

  it("renders Add Ingredient button", () => {
    const append = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      fields: [],
      append,
    });

    render(<RecipeForm />);
    const addBtn = screen.getByText("+ Add Ingredient");
    expect(addBtn).toBeInTheDocument();
  });

  it("calls append when Add Ingredient button is clicked", () => {
    const append = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      fields: [],
      append,
    });

    render(<RecipeForm />);
    const addBtn = screen.getByText("+ Add Ingredient");
    fireEvent.click(addBtn);
    expect(append).toHaveBeenCalledWith({
      foodItemId: 0,
      foodItemName: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      quantity: 1,
      serving: 1,
    });
  });

  it("shows loading state on submit button while saving", () => {
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      isLoading: true,
    });

    render(<RecipeForm />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders import URL section with correct text", () => {
    render(<RecipeForm />);
    expect(screen.getByText("Import from URL")).toBeInTheDocument();
    expect(screen.getByText(/recipe urls are fetched via corsproxy/i)).toBeInTheDocument();
  });

  it("disables import button when url is only whitespace", () => {
    vi.mocked(recipeImportHook).useRecipeImport.mockReturnValue({
      ...defaultImportReturn(),
      url: "   ",
    });

    render(<RecipeForm />);
    const importBtn = screen.getByRole("button", { name: /^import$/i });
    expect(importBtn).toHaveProperty("disabled", true);
  });

  it("renders form element with space-y-6", () => {
    render(<RecipeForm />);
    const form = document.querySelector("form");
    expect(form?.className).toContain("space-y-6");
  });

  it("handles textarea for description field", () => {
    render(<RecipeForm />);
    const textarea = document.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("rows", "3");
    expect(textarea).toHaveAttribute("placeholder", "Briefly describe the meal's purpose.");
  });

  it("calls remove when ingredient remove button is clicked", () => {
    const remove = vi.fn();
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      fields: [
        {
          id: "field-1",
          foodItemId: 1,
          foodItemName: "chicken",
          quantity: 1,
          serving: 100,
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
        },
      ],
      remove,
    });

    render(<RecipeForm />);
    const removeBtn = screen.getByLabelText("Remove ingredient");
    fireEvent.click(removeBtn);
    expect(remove).toHaveBeenCalledWith(0);
  });

  it("renders button with disabled state when loading", () => {
    vi.mocked(recipeFormHook).useRecipeForm.mockReturnValue({
      ...defaultFormReturn(),
      isLoading: true,
    });

    render(<RecipeForm />);
    const submitBtn = document.querySelector("button[type='submit']");
    expect(submitBtn).toHaveProperty("disabled", true);
  });

  it("renders form section with border styling", () => {
    render(<RecipeForm />);
    const importSection = document.querySelector(".border.border-rule");
    expect(importSection).toBeInTheDocument();
  });
});

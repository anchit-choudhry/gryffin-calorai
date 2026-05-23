import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { parseRecipeFromHtml, useRecipeImport } from "./useRecipeImport";
import type { FoodItem } from "../db/dbService";
import { FoodItemId, ISODate, UserId } from "@/types";

const makeFood = (id: number, name: string, calories: number): FoodItem => ({
  id: FoodItemId(id),
  name,
  calories,
  servingSize: 1,
  protein: 0,
  carbs: 0,
  fat: 0,
  dateLogged: ISODate("2026-05-01"),
  userId: UserId("user-1"),
  isFavorite: false,
});

const foods: FoodItem[] = [
  makeFood(1, "chicken breast", 165),
  makeFood(2, "brown rice", 216),
  makeFood(3, "olive oil", 119),
  makeFood(4, "garlic", 4),
];

const makeJsonLdHtml = (recipe: Record<string, unknown>) => `
  <html>
    <head>
      <script type="application/ld+json">
        ${JSON.stringify(recipe)}
      </script>
    </head>
    <body></body>
  </html>
`;

describe("parseRecipeFromHtml", () => {
  it("returns null when HTML has no JSON-LD script", () => {
    expect(parseRecipeFromHtml("<html><body>no schema</body></html>", foods)).toBeNull();
  });

  it("returns null when JSON-LD type is not Recipe", () => {
    const html = makeJsonLdHtml({ "@type": "Article", name: "test" });
    expect(parseRecipeFromHtml(html, foods)).toBeNull();
  });

  it("returns null when JSON is malformed", () => {
    const html = `<script type="application/ld+json">{ invalid json }</script>`;
    expect(parseRecipeFromHtml(html, foods)).toBeNull();
  });

  it("extracts recipe name from JSON-LD", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Chicken and Rice",
      description: "A simple meal",
      recipeIngredient: [],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.name).toBe("Chicken and Rice");
  });

  it("extracts description from JSON-LD", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Test",
      description: "High protein meal for athletes",
      recipeIngredient: [],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.description).toBe("High protein meal for athletes");
  });

  it("returns empty ingredients when recipeIngredient is missing", () => {
    const html = makeJsonLdHtml({ "@type": "Recipe", name: "Test" });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.ingredients).toStrictEqual([]);
  });

  it("maps ingredient strings to known food items via fuzzy match", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Simple Meal",
      recipeIngredient: ["200g chicken breast", "1 cup brown rice"],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.ingredients[0]?.foodItemId).toBe(1);
    expect(result?.ingredients[0]?.foodItemName).toBe("chicken breast");
    expect(result?.ingredients[0]?.calories).toBe(165);
    expect(result?.ingredients[1]?.foodItemId).toBe(2);
  });

  it("sets foodItemId to 0 when no food item matches", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Mystery Meal",
      recipeIngredient: ["xylitol powder"],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.ingredients[0]?.foodItemId).toBe(0);
    expect(result?.ingredients[0]?.calories).toBe(0);
  });

  it("preserves raw ingredient name when no match found", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Test",
      recipeIngredient: ["1 tsp unicorn dust"],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.ingredients[0]?.rawName).toBe("1 tsp unicorn dust");
  });

  it("uses empty string for name when name is missing", () => {
    const html = makeJsonLdHtml({ "@type": "Recipe", recipeIngredient: [] });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.name).toBe("");
  });

  it("uses empty string for description when description is missing", () => {
    const html = makeJsonLdHtml({ "@type": "Recipe", name: "Test" });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.description).toBe("");
  });

  it("handles @graph array containing Recipe object", () => {
    const html = makeJsonLdHtml({
      "@graph": [
        { "@type": "WebPage", name: "page" },
        {
          "@type": "Recipe",
          name: "Garlic Rice",
          description: "Simple garlic rice",
          recipeIngredient: ["2 cloves garlic"],
        },
      ],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.name).toBe("Garlic Rice");
  });

  it("sets default quantity and serving to 1 for each ingredient", () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Test",
      recipeIngredient: ["chicken breast"],
    });
    const result = parseRecipeFromHtml(html, foods);
    expect(result?.ingredients[0]?.quantity).toBe(1);
    expect(result?.ingredients[0]?.serving).toBe(1);
  });
});

describe("useRecipeImport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with empty url and null importedRecipe", () => {
    const { result } = renderHook(() => useRecipeImport(foods));
    expect(result.current.url).toBe("");
    expect(result.current.importedRecipe).toBeNull();
  });

  it("starts with isLoading false and error null", () => {
    const { result } = renderHook(() => useRecipeImport(foods));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("setUrl updates url", () => {
    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    expect(result.current.url).toBe("https://example.com/recipe");
  });

  it("clearImport resets importedRecipe, error, and url", async () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Fetched",
      description: "Desc",
      recipeIngredient: [],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());
    expect(result.current.importedRecipe).not.toBeNull();

    act(() => result.current.clearImport());
    expect(result.current.importedRecipe).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.url).toBe("");
  });

  it("importFromUrl calls fetch with CORS proxy URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => makeJsonLdHtml({ "@type": "Recipe", name: "Test" }),
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = fetchSpy.mock.calls[0]![0] as string;
    expect(decodeURIComponent(calledUrl)).toContain("example.com/recipe");
  });

  it("importFromUrl sets importedRecipe on success", async () => {
    const html = makeJsonLdHtml({
      "@type": "Recipe",
      name: "Chicken Rice Bowl",
      description: "Quick meal",
      recipeIngredient: ["chicken breast"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(result.current.importedRecipe).not.toBeNull();
    expect(result.current.importedRecipe?.name).toBe("Chicken Rice Bowl");
  });

  it("importFromUrl sets error when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(result.current.error).toBeTruthy();
    expect(result.current.importedRecipe).toBeNull();
  });

  it("importFromUrl sets error when response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "",
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(result.current.error).toBeTruthy();
    expect(result.current.importedRecipe).toBeNull();
  });

  it("importFromUrl sets error when no Recipe JSON-LD found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><body>just a page</body></html>",
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(result.current.error).toBeTruthy();
    expect(result.current.importedRecipe).toBeNull();
  });

  it("importFromUrl does nothing when url is empty", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useRecipeImport(foods));
    await act(async () => result.current.importFromUrl());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("importFromUrl sets isLoading to false after completion", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => makeJsonLdHtml({ "@type": "Recipe", name: "Test" }),
    } as Response);

    const { result } = renderHook(() => useRecipeImport(foods));
    act(() => result.current.setUrl("https://example.com/recipe"));
    await act(async () => result.current.importFromUrl());

    expect(result.current.isLoading).toBe(false);
  });
});

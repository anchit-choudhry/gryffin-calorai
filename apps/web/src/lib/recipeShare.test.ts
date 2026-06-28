import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildShareableRecipe,
  buildShareUrl,
  decodeSharePayload,
  encodeSharePayload,
  importSharedRecipe,
  RECIPE_SHARE_SCHEMA_VERSION,
  type ShareableRecipe,
} from "./recipeShare";
import type { FoodItem, Recipe } from "@/db/dbService";
import { addFoodItemLog, saveRecipe } from "@/db/dbService";
import type { UserId } from "@/types";

vi.mock("@/db/dbService", () => ({
  addFoodItemLog: vi.fn().mockResolvedValue("new-food-id"),
  saveRecipe: vi.fn().mockResolvedValue("new-recipe-id"),
}));

const mockAddFoodItemLog = addFoodItemLog as ReturnType<typeof vi.fn>;
const mockSaveRecipe = saveRecipe as ReturnType<typeof vi.fn>;

const baseFood = (overrides: Partial<FoodItem> = {}): FoodItem =>
  ({
    id: 1 as unknown as FoodItem["id"],
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    dateLogged: "2026-01-01" as FoodItem["dateLogged"],
    userId: "user-1" as FoodItem["userId"],
    isFavorite: false,
    captureMethod: "manual",
    ...overrides,
  }) as FoodItem;

const baseRecipe = (overrides: Partial<Recipe> = {}): Recipe =>
  ({
    id: "rec-1",
    name: "Protein Bowl",
    description: "High protein meal",
    totalCalories: 400,
    totalProtein: 50,
    totalCarbs: 30,
    totalFat: 8,
    ingredients: [{ foodItemId: 1 as FoodItem["id"], quantity: 1, serving: 100 }],
    userId: "user-1" as Recipe["userId"],
    createdBy: "user-1" as Recipe["userId"],
    dateCreated: "2026-01-01" as Recipe["dateCreated"],
    ...overrides,
  }) as Recipe;

describe("buildShareableRecipe", () => {
  it("resolves ingredient names from food map", () => {
    const recipe = baseRecipe();
    const result = buildShareableRecipe(recipe, [baseFood()]);
    expect(result.ingredients[0]?.name).toBe("Chicken Breast");
    expect(result.ingredients[0]?.calories).toBe(165);
  });

  it("uses 'Unknown ingredient' when food not found", () => {
    const recipe = baseRecipe();
    const result = buildShareableRecipe(recipe, []);
    expect(result.ingredients[0]?.name).toBe("Unknown ingredient");
    expect(result.ingredients[0]?.calories).toBe(0);
  });

  it("copies recipe metadata", () => {
    const recipe = baseRecipe();
    const result = buildShareableRecipe(recipe, [baseFood()]);
    expect(result.name).toBe("Protein Bowl");
    expect(result.description).toBe("High protein meal");
    expect(result.totalCalories).toBe(400);
    expect(result.v).toBe(RECIPE_SHARE_SCHEMA_VERSION);
  });

  it("includes optional macro fields when present", () => {
    const result = buildShareableRecipe(baseRecipe(), [baseFood()]);
    expect(result.totalProtein).toBe(50);
    expect(result.totalCarbs).toBe(30);
    expect(result.totalFat).toBe(8);
  });

  it("copies ingredient macros from food item", () => {
    const result = buildShareableRecipe(baseRecipe(), [baseFood()]);
    expect(result.ingredients[0]?.protein).toBe(31);
    expect(result.ingredients[0]?.carbs).toBe(0);
    expect(result.ingredients[0]?.fat).toBe(3.6);
  });
});

describe("encodeSharePayload / decodeSharePayload round-trip", () => {
  const payload: ShareableRecipe = {
    v: RECIPE_SHARE_SCHEMA_VERSION,
    name: "Test Recipe",
    description: "A test",
    totalCalories: 500,
    ingredients: [{ name: "Oats", quantity: 1, serving: 80, calories: 300 }],
  };

  it("encodes to a non-empty string with no spaces or slashes", async () => {
    const encoded = await encodeSharePayload(payload);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded).not.toContain(" ");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("decodes back to original payload", async () => {
    const encoded = await encodeSharePayload(payload);
    const decoded = await decodeSharePayload(encoded);
    expect(decoded?.name).toBe(payload.name);
    expect(decoded?.totalCalories).toBe(payload.totalCalories);
    expect(decoded?.ingredients[0]?.name).toBe("Oats");
  });

  it("returns undefined for invalid base64 input", async () => {
    expect(await decodeSharePayload("!!!notbase64!!!")).toBeUndefined();
  });

  it("returns undefined for valid base64 that lacks required fields", async () => {
    const bad = btoa(JSON.stringify({ foo: "bar" }));
    expect(await decodeSharePayload(bad)).toBeUndefined();
  });

  it("returns undefined for empty string", async () => {
    expect(await decodeSharePayload("")).toBeUndefined();
  });
});

describe("buildShareUrl", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { origin: "https://app.example.com", pathname: "/" },
      writable: true,
    });
  });

  it("returns a URL containing #recipes?share=", async () => {
    const url = await buildShareUrl(baseRecipe(), [baseFood()]);
    expect(url).toContain("#recipes?share=");
  });

  it("URL is decodable back to original recipe name", async () => {
    const url = await buildShareUrl(baseRecipe(), [baseFood()]);
    const encoded = url.split("share=")[1]!;
    const decoded = await decodeSharePayload(encoded);
    expect(decoded?.name).toBe("Protein Bowl");
  });
});

describe("importSharedRecipe", () => {
  const userId = "user-42" as UserId;
  const payload: ShareableRecipe = {
    v: RECIPE_SHARE_SCHEMA_VERSION,
    name: "Imported Bowl",
    description: "From a friend",
    totalCalories: 350,
    ingredients: [
      { name: "Rice", quantity: 1, serving: 150, calories: 200 },
      { name: "Tuna", quantity: 1, serving: 100, calories: 150, protein: 28 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddFoodItemLog.mockResolvedValue("new-food-id");
    mockSaveRecipe.mockResolvedValue("new-recipe-id");
  });

  it("calls addFoodItemLog once per ingredient", async () => {
    await importSharedRecipe(payload, userId);
    expect(mockAddFoodItemLog).toHaveBeenCalledTimes(2);
  });

  it("passes ingredient data to addFoodItemLog", async () => {
    await importSharedRecipe(payload, userId);
    const firstCall = mockAddFoodItemLog.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(firstCall.name).toBe("Rice");
    expect(firstCall.calories).toBe(200);
    expect(firstCall.userId).toBe(userId);
  });

  it("calls saveRecipe with assembled recipe", async () => {
    await importSharedRecipe(payload, userId);
    expect(mockSaveRecipe).toHaveBeenCalledOnce();
    const saved = mockSaveRecipe.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(saved.name).toBe("Imported Bowl");
    expect(saved.totalCalories).toBe(350);
  });

  it("returns recipe with the saved ID", async () => {
    const result = await importSharedRecipe(payload, userId);
    expect(result.id).toBe("new-recipe-id");
    expect(result.name).toBe("Imported Bowl");
  });
});

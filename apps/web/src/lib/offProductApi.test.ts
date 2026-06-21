import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./apiClient";
import { lookupBarcode, offProductToFoodItem, searchOff } from "./offProductApi";
import type { OffProductResponse } from "./offProductApi";

const mockApiGet = vi.hoisted(() => vi.fn());

vi.mock("./apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./apiClient")>();
  return {
    ...actual,
    api: {
      get: mockApiGet,
    },
  };
});

const MINIMAL_PRODUCT: OffProductResponse = {
  code: "3017620422003",
  productName: "Nutella",
  brands: "Ferrero",
  servingSize: "15g",
  servingSizeG: 15,
  nutritionGrade: "e",
  mainCategory: "spreads",
  imageSmallUrl: null,
  allergensTags: null,
  tracesTags: null,
  energyKcal100g: 539,
  energyKj100g: 2252,
  proteins100g: 6.3,
  carbohydrates100g: 57.5,
  sugars100g: 56.3,
  fat100g: 30.9,
  saturatedFat100g: 10.6,
  transFat100g: null,
  monounsaturatedFat100g: null,
  polyunsaturatedFat100g: null,
  omega3Fat100g: null,
  cholesterol100g: null,
  fiber100g: null,
  sodium100g: 0.107,
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
  offLastModifiedAt: "2024-01-15T12:00:00Z",
};

const FULL_PRODUCT: OffProductResponse = {
  ...MINIMAL_PRODUCT,
  transFat100g: 0.001,
  cholesterol100g: 0.05,
  fiber100g: 3.5,
  calcium100g: 0.12,
  iron100g: 0.003,
  potassium100g: 0.35,
  magnesium100g: 0.025,
  phosphorus100g: 0.18,
  zinc100g: 0.002,
  selenium100g: 0.000012,
  copper100g: 0.0004,
  iodine100g: 0.000015,
  vitaminA100g: 0.0008,
  vitaminB1100g: 0.0011,
  vitaminB6100g: 0.00015,
  vitaminB9100g: 0.000025,
  vitaminB12100g: 0.0000006,
  vitaminC100g: 0.006,
  vitaminD100g: 0.0000025,
  vitaminE100g: 0.0015,
  vitaminK100g: 0.000008,
};

describe("lookupBarcode", () => {
  it("returns the product when the API responds successfully", async () => {
    mockApiGet.mockResolvedValueOnce(MINIMAL_PRODUCT);

    const result = await lookupBarcode("3017620422003");

    expect(result).toStrictEqual(MINIMAL_PRODUCT);
    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/off-products/barcode/3017620422003");
  });

  it("URL-encodes the barcode in the path", async () => {
    mockApiGet.mockResolvedValueOnce(MINIMAL_PRODUCT);

    await lookupBarcode("301762 042/2003");

    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/off-products/barcode/301762%20042%2F2003");
  });

  it("returns null on a 404 response", async () => {
    mockApiGet.mockRejectedValueOnce(new ApiError(404, "Product not found"));

    const result = await lookupBarcode("0000000000000");

    expect(result).toBeNull();
  });

  it("re-throws non-404 API errors", async () => {
    mockApiGet.mockRejectedValueOnce(new ApiError(500, "Server error"));

    await expect(lookupBarcode("3017620422003")).rejects.toBeInstanceOf(ApiError);
  });

  it("re-throws network errors that are not ApiError instances", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("Network timeout"));

    await expect(lookupBarcode("3017620422003")).rejects.toThrow("Network timeout");
  });
});

describe("offProductToFoodItem", () => {
  it("maps name, calories, macros, and serving size", () => {
    const item = offProductToFoodItem(MINIMAL_PRODUCT);

    expect(item.name).toBe("Nutella");
    expect(item.calories).toBe(539);
    expect(item.servingSize).toBe(1);
    expect(item.protein).toBe(6.3);
    expect(item.carbs).toBe(57.5);
    expect(item.fat).toBe(30.9);
  });

  it("falls back to Product {code} when productName is null", () => {
    const item = offProductToFoodItem({ ...MINIMAL_PRODUCT, productName: null });

    expect(item.name).toBe("Product 3017620422003");
  });

  it("rounds calories to the nearest integer", () => {
    const item = offProductToFoodItem({ ...MINIMAL_PRODUCT, energyKcal100g: 539.7 });

    expect(item.calories).toBe(540);
  });

  it("defaults calories to 0 when energyKcal100g is null", () => {
    const item = offProductToFoodItem({ ...MINIMAL_PRODUCT, energyKcal100g: null });

    expect(item.calories).toBe(0);
  });

  it("converts sodium g/100g to mg (×1000)", () => {
    const item = offProductToFoodItem(MINIMAL_PRODUCT);

    expect(item.nutritionData?.sodium).toBeCloseTo(107, 5);
  });

  it("converts selenium g/100g to mcg (×1_000_000)", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.selenium).toBeCloseTo(12, 5);
  });

  it("converts vitaminD g/100g to mcg (×1_000_000)", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.vitaminD).toBeCloseTo(2.5, 5);
  });

  it("converts calcium g/100g to mg (×1000)", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.calcium).toBeCloseTo(120, 5);
  });

  it("maps fiber, sugar, saturatedFat as-is (g → g)", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.fiber).toBe(3.5);
    expect(item.nutritionData?.sugar).toBe(56.3);
    expect(item.nutritionData?.saturatedFat).toBe(10.6);
  });

  it("maps vitaminB1 to thiamine in mg", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.thiamine).toBeCloseTo(1.1, 5);
  });

  it("maps vitaminB9 to folate in mcg", () => {
    const item = offProductToFoodItem(FULL_PRODUCT);

    expect(item.nutritionData?.folate).toBeCloseTo(25, 5);
  });

  it("leaves nutrition fields undefined when OFF source is null", () => {
    const item = offProductToFoodItem(MINIMAL_PRODUCT);

    expect(item.nutritionData?.fiber).toBeUndefined();
    expect(item.nutritionData?.calcium).toBeUndefined();
    expect(item.nutritionData?.vitaminA).toBeUndefined();
    expect(item.nutritionData?.selenium).toBeUndefined();
  });

  it("sets dummy userId and dateLogged (not used by useFoodForm on submit)", () => {
    const item = offProductToFoodItem(MINIMAL_PRODUCT);

    expect(item.userId).toBe("");
    expect(item.dateLogged).toBe("");
    expect(item.isFavorite).toBe(false);
  });

  it("does not set an id field (prevents edit mode in useFoodForm)", () => {
    const item = offProductToFoodItem(MINIMAL_PRODUCT);

    expect((item as unknown as Record<string, unknown>)["id"]).toBeUndefined();
  });
});

describe("searchOff", () => {
  it("calls the search endpoint with the encoded query and default limit", async () => {
    mockApiGet.mockResolvedValueOnce([MINIMAL_PRODUCT]);

    const result = await searchOff("nutella");

    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/off-products/search?q=nutella&limit=6");
    expect(result).toStrictEqual([MINIMAL_PRODUCT]);
  });

  it("URL-encodes special characters in the query", async () => {
    mockApiGet.mockResolvedValueOnce([]);

    await searchOff("peanut butter & jelly");

    expect(mockApiGet).toHaveBeenCalledWith(
      "/api/v1/off-products/search?q=peanut%20butter%20%26%20jelly&limit=6",
    );
  });

  it("forwards a custom limit to the endpoint", async () => {
    mockApiGet.mockResolvedValueOnce([]);

    await searchOff("oat", 10);

    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/off-products/search?q=oat&limit=10");
  });

  it("returns an empty array on a 401 error", async () => {
    mockApiGet.mockRejectedValueOnce(new ApiError(401, "Unauthorized"));

    const result = await searchOff("nutella");

    expect(result).toStrictEqual([]);
  });

  it("returns an empty array on a 500 server error", async () => {
    mockApiGet.mockRejectedValueOnce(new ApiError(500, "Internal Server Error"));

    const result = await searchOff("nutella");

    expect(result).toStrictEqual([]);
  });

  it("returns an empty array on a network error", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("Network timeout"));

    const result = await searchOff("nutella");

    expect(result).toStrictEqual([]);
  });

  it("returns the full array when multiple products match", async () => {
    mockApiGet.mockResolvedValueOnce([MINIMAL_PRODUCT, FULL_PRODUCT]);

    const result = await searchOff("ferrero");

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual(MINIMAL_PRODUCT);
    expect(result[1]).toStrictEqual(FULL_PRODUCT);
  });
});

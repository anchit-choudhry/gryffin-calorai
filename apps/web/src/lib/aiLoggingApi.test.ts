import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FoodClassification } from "./localFoodClassifier";
import type { OffProductResponse } from "./offProductApi";

vi.mock("./localFoodClassifier", () => ({
  classifyFood: vi.fn(),
}));

vi.mock("./offProductApi", () => ({
  searchOff: vi.fn(),
}));

function makeOffResult(overrides?: Partial<OffProductResponse>): OffProductResponse {
  return {
    code: "001",
    productName: "Margherita Pizza",
    brands: null,
    servingSize: null,
    servingSizeG: null,
    nutritionGrade: null,
    mainCategory: null,
    imageSmallUrl: null,
    allergensTags: null,
    tracesTags: null,
    energyKcal100g: 250,
    energyKj100g: null,
    proteins100g: 11,
    carbohydrates100g: 33,
    sugars100g: null,
    fat100g: 8,
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
    ...overrides,
  };
}

describe("recognizePhoto", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns off_match item when classifier hits and searchOff finds a result", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { searchOff } = await import("./offProductApi");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockResolvedValue([{ label: "pizza", score: 0.87 }]);
    vi.mocked(searchOff).mockResolvedValue([makeOffResult()]);

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toStrictEqual([
      {
        name: "Margherita Pizza",
        confidence: 0.87,
        source: "off_match",
        offProductId: "001",
        calories: 250,
        protein: 11,
        carbs: 33,
        fat: 8,
      },
    ]);
  });

  it("returns estimate item when classifier hits but searchOff returns empty", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { searchOff } = await import("./offProductApi");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockResolvedValue([{ label: "grilled salmon", score: 0.72 }]);
    vi.mocked(searchOff).mockResolvedValue([]);

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toStrictEqual([
      { name: "grilled salmon", confidence: 0.72, source: "estimate" },
    ]);
  });

  it("filters out classifications with score <= 0.10", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { searchOff } = await import("./offProductApi");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockResolvedValue([
      { label: "pizza", score: 0.85 },
      { label: "pasta", score: 0.09 },
    ] satisfies FoodClassification[]);
    vi.mocked(searchOff).mockResolvedValue([makeOffResult()]);

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Margherita Pizza");
  });

  it("returns [] when classifier throws", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockRejectedValue(new Error("model error"));

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toStrictEqual([]);
  });

  it("returns [] when searchOff throws", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { searchOff } = await import("./offProductApi");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockResolvedValue([{ label: "pizza", score: 0.85 }]);
    vi.mocked(searchOff).mockRejectedValue(new Error("network error"));

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toStrictEqual([]);
  });

  it("deduplicates results by offProductId", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const { searchOff } = await import("./offProductApi");
    const { recognizePhoto } = await import("./aiLoggingApi");

    vi.mocked(classifyFood).mockResolvedValue([
      { label: "cheese pizza", score: 0.85 },
      { label: "pizza", score: 0.75 },
    ] satisfies FoodClassification[]);
    // Both labels resolve to same OFF product
    vi.mocked(searchOff).mockResolvedValue([makeOffResult()]);

    const results = await recognizePhoto("data:image/png;base64,x");
    expect(results).toHaveLength(1);
  });
});

describe("parseText", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns off_match item with confidence 1.0 for text tokens", async () => {
    const { searchOff } = await import("./offProductApi");
    const { parseText } = await import("./aiLoggingApi");

    vi.mocked(searchOff).mockResolvedValue([makeOffResult()]);

    const results = await parseText("I had pizza for lunch");
    expect(results[0]?.source).toBe("off_match");
    expect(results[0]?.confidence).toBe(1.0);
  });

  it("returns estimate when searchOff returns empty for a token", async () => {
    const { searchOff } = await import("./offProductApi");
    const { parseText } = await import("./aiLoggingApi");

    vi.mocked(searchOff).mockResolvedValue([]);

    const results = await parseText("quinoa bowl");
    expect(results[0]?.source).toBe("estimate");
    expect(results[0]?.name).toBe("quinoa bowl");
  });

  it("returns [] for text that is only stop words", async () => {
    const { parseText } = await import("./aiLoggingApi");
    const results = await parseText("I had some for breakfast");
    expect(results).toStrictEqual([]);
  });

  it("returns [] for empty string", async () => {
    const { parseText } = await import("./aiLoggingApi");
    const results = await parseText("");
    expect(results).toStrictEqual([]);
  });

  it("returns [] on any thrown error", async () => {
    const { searchOff } = await import("./offProductApi");
    const { parseText } = await import("./aiLoggingApi");

    vi.mocked(searchOff).mockRejectedValue(new Error("network error"));

    const results = await parseText("pizza");
    expect(results).toStrictEqual([]);
  });

  it("uses bigram 'orange juice' instead of separate tokens", async () => {
    const { searchOff } = await import("./offProductApi");
    const { parseText } = await import("./aiLoggingApi");

    vi.mocked(searchOff).mockResolvedValue([]);

    await parseText("orange juice");
    // searchOff should be called with "orange juice" (bigram), not "orange" and "juice"
    const { searchOff: searchOffActual } = await import("./offProductApi");
    const calls = vi.mocked(searchOffActual).mock.calls.map((c) => c[0]);
    expect(calls).toContain("orange juice");
    expect(calls).not.toContain("orange");
    expect(calls).not.toContain("juice");
  });
});

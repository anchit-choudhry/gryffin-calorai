// src/db/nutrition.test.ts
import "fake-indexeddb/auto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addFoodItemLog,
  addFoodPhoto,
  clearDatabase,
  db,
  deleteFoodPhoto,
  type FoodItem,
  type FoodPhoto,
  getAllFoodLogs,
  getDailyFoodLogs,
  getFoodPhoto,
  getFoodPhotosByUser,
  getOrCreateUser,
  initializeDB,
  updateFoodItem,
} from "./dbService";
import {
  ISODate,
  MICRONUTRIENT_KEYS,
  MICRONUTRIENT_LABELS,
  MICRONUTRIENT_RDA,
  MICRONUTRIENT_UNITS,
  type NutritionData,
  type NutritionKey,
  todayISO,
  UserId,
} from "../types";
import { BackupSchema, FoodFormSchema, NutritionDataSchema } from "../forms/schemas";

const TEST_USER = UserId("nutrition-test-user");
const TODAY = todayISO();

function baseFood(overrides: Partial<FoodItem> = {}): Omit<FoodItem, "id"> {
  return {
    name: "Test Food",
    calories: 200,
    servingSize: 1,
    protein: 10,
    carbs: 25,
    fat: 5,
    dateLogged: TODAY,
    userId: TEST_USER,
    isFavorite: false,
    mealType: "Breakfast",
    ...overrides,
  };
}

beforeAll(async () => {
  await initializeDB();
  await getOrCreateUser(TEST_USER, "NutritionTestUser", "nutrition@test.com");
});

afterAll(async () => {
  await clearDatabase();
  db.close();
});

// --- NutritionData type constants ---

describe("MICRONUTRIENT_KEYS", () => {
  it("contains exactly 25 keys", () => {
    expect(MICRONUTRIENT_KEYS).toHaveLength(25);
  });

  it("includes all vitamin keys", () => {
    const vitamins: NutritionKey[] = [
      "vitaminA",
      "vitaminB12",
      "vitaminB6",
      "vitaminC",
      "vitaminD",
      "vitaminE",
      "vitaminK",
      "folate",
      "niacin",
      "thiamine",
    ];
    for (const key of vitamins) {
      expect(MICRONUTRIENT_KEYS).toContain(key);
    }
  });

  it("includes all mineral keys", () => {
    const minerals: NutritionKey[] = [
      "calcium",
      "iron",
      "magnesium",
      "potassium",
      "sodium",
      "zinc",
      "copper",
      "iodine",
      "phosphorus",
      "selenium",
    ];
    for (const key of minerals) {
      expect(MICRONUTRIENT_KEYS).toContain(key);
    }
  });

  it("includes all other nutrition keys", () => {
    const others: NutritionKey[] = ["fiber", "sugar", "saturatedFat", "transFat", "cholesterol"];
    for (const key of others) {
      expect(MICRONUTRIENT_KEYS).toContain(key);
    }
  });

  it("has no duplicate keys", () => {
    const unique = new Set(MICRONUTRIENT_KEYS);
    expect(unique.size).toStrictEqual(MICRONUTRIENT_KEYS.length);
  });
});

describe("MICRONUTRIENT_LABELS", () => {
  it("has a label for every key", () => {
    for (const key of MICRONUTRIENT_KEYS) {
      expect(MICRONUTRIENT_LABELS[key]).toBeTruthy();
    }
  });

  it("labels are human-readable strings", () => {
    expect(MICRONUTRIENT_LABELS.vitaminA).toBe("Vitamin A");
    expect(MICRONUTRIENT_LABELS.vitaminB12).toBe("Vitamin B12");
    expect(MICRONUTRIENT_LABELS.saturatedFat).toBe("Saturated Fat");
    expect(MICRONUTRIENT_LABELS.cholesterol).toBe("Cholesterol");
  });
});

describe("MICRONUTRIENT_UNITS", () => {
  it("has a unit for every key", () => {
    for (const key of MICRONUTRIENT_KEYS) {
      expect(MICRONUTRIENT_UNITS[key]).toBeTruthy();
    }
  });

  it("vitamins use correct units", () => {
    expect(MICRONUTRIENT_UNITS.vitaminA).toBe("mcg");
    expect(MICRONUTRIENT_UNITS.vitaminC).toBe("mg");
    expect(MICRONUTRIENT_UNITS.vitaminD).toBe("mcg");
  });

  it("minerals use correct units", () => {
    expect(MICRONUTRIENT_UNITS.calcium).toBe("mg");
    expect(MICRONUTRIENT_UNITS.selenium).toBe("mcg");
    expect(MICRONUTRIENT_UNITS.iodine).toBe("mcg");
  });

  it("other nutrients use correct units", () => {
    expect(MICRONUTRIENT_UNITS.fiber).toBe("g");
    expect(MICRONUTRIENT_UNITS.sodium).toBe("mg");
    expect(MICRONUTRIENT_UNITS.cholesterol).toBe("mg");
  });
});

describe("MICRONUTRIENT_RDA", () => {
  it("has an RDA value for every key", () => {
    for (const key of MICRONUTRIENT_KEYS) {
      expect(typeof MICRONUTRIENT_RDA[key]).toBe("number");
      expect(MICRONUTRIENT_RDA[key]).toBeGreaterThan(0);
    }
  });

  it("has correct reference values for key nutrients", () => {
    expect(MICRONUTRIENT_RDA.vitaminC).toBe(90);
    expect(MICRONUTRIENT_RDA.calcium).toBe(1300);
    expect(MICRONUTRIENT_RDA.iron).toBe(18);
    expect(MICRONUTRIENT_RDA.sodium).toBe(2300);
    expect(MICRONUTRIENT_RDA.fiber).toBe(28);
  });
});

// --- NutritionDataSchema validation ---

describe("NutritionDataSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(() => NutritionDataSchema.parse({})).not.toThrow();
  });

  it("accepts valid partial nutrition data", () => {
    const result = NutritionDataSchema.parse({
      vitaminC: 60,
      calcium: 200,
      fiber: 5,
      sodium: 400,
    });
    expect(result.vitaminC).toBe(60);
    expect(result.calcium).toBe(200);
    expect(result.fiber).toBe(5);
    expect(result.sodium).toBe(400);
  });

  it("accepts all 25 fields populated", () => {
    const full: NutritionData = {
      vitaminA: 100,
      vitaminB12: 1.5,
      vitaminB6: 0.5,
      vitaminC: 30,
      vitaminD: 5,
      vitaminE: 2,
      vitaminK: 50,
      folate: 80,
      niacin: 5,
      thiamine: 0.3,
      calcium: 100,
      iron: 2,
      magnesium: 30,
      potassium: 300,
      sodium: 250,
      zinc: 1,
      copper: 0.1,
      iodine: 30,
      phosphorus: 150,
      selenium: 10,
      fiber: 3,
      sugar: 8,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 15,
    };
    expect(() => NutritionDataSchema.parse(full)).not.toThrow();
  });

  it("rejects negative values", () => {
    expect(() => NutritionDataSchema.parse({ vitaminC: -1 })).toThrow();
    expect(() => NutritionDataSchema.parse({ sodium: -10 })).toThrow();
    expect(() => NutritionDataSchema.parse({ fiber: -0.1 })).toThrow();
  });

  it("rejects values exceeding max for vitamins", () => {
    expect(() => NutritionDataSchema.parse({ vitaminA: 20000 })).toThrow();
    expect(() => NutritionDataSchema.parse({ vitaminC: 3000 })).toThrow();
    expect(() => NutritionDataSchema.parse({ vitaminD: 2000 })).toThrow();
  });

  it("rejects values exceeding max for minerals", () => {
    expect(() => NutritionDataSchema.parse({ calcium: 10000 })).toThrow();
    expect(() => NutritionDataSchema.parse({ iron: 1000 })).toThrow();
    expect(() => NutritionDataSchema.parse({ potassium: 20000 })).toThrow();
  });

  it("rejects values exceeding max for other nutrients", () => {
    expect(() => NutritionDataSchema.parse({ fiber: 500 })).toThrow();
    expect(() => NutritionDataSchema.parse({ cholesterol: 10000 })).toThrow();
    expect(() => NutritionDataSchema.parse({ transFat: 200 })).toThrow();
  });
});

// --- FoodFormSchema with nutritionData ---

describe("FoodFormSchema.nutritionData", () => {
  const validBase = {
    name: "Salmon",
    calories: 300,
    servingSize: 1,
    protein: 35,
    carbs: 0,
    fat: 14,
    mealType: "Lunch" as const,
  };

  it("accepts food without nutritionData", () => {
    expect(() => FoodFormSchema.parse(validBase)).not.toThrow();
  });

  it("accepts food with partial nutritionData", () => {
    const result = FoodFormSchema.parse({
      ...validBase,
      nutritionData: { vitaminD: 15, selenium: 40, sodium: 75 },
    });
    expect(result.nutritionData?.vitaminD).toBe(15);
    expect(result.nutritionData?.selenium).toBe(40);
  });

  it("rejects nutritionData with negative values", () => {
    expect(() => FoodFormSchema.parse({ ...validBase, nutritionData: { vitaminC: -5 } })).toThrow();
  });
});

// --- FoodItem persistence with nutritionData ---

describe("FoodItem DB - nutritionData persistence", () => {
  it("stores and retrieves a food item without nutritionData", async () => {
    const id = await addFoodItemLog(baseFood());
    const items = await getDailyFoodLogs(TEST_USER, TODAY);
    const stored = items.find((i) => i.id === id);
    expect(stored).toBeDefined();
    expect(stored!.nutritionData).toBeUndefined();
  });

  it("stores and retrieves a food item with full nutritionData", async () => {
    const nutrition: Partial<NutritionData> = {
      vitaminC: 45,
      calcium: 120,
      iron: 3,
      fiber: 4,
      sodium: 180,
      potassium: 450,
    };
    const id = await addFoodItemLog(baseFood({ name: "Spinach", nutritionData: nutrition }));
    const items = await getAllFoodLogs(TEST_USER);
    const stored = items.find((i) => i.id === id);
    expect(stored).toBeDefined();
    expect(stored!.nutritionData?.vitaminC).toBe(45);
    expect(stored!.nutritionData?.calcium).toBe(120);
    expect(stored!.nutritionData?.iron).toBe(3);
    expect(stored!.nutritionData?.fiber).toBe(4);
    expect(stored!.nutritionData?.sodium).toBe(180);
    expect(stored!.nutritionData?.potassium).toBe(450);
  });

  it("updates nutritionData on an existing item", async () => {
    const id = await addFoodItemLog(baseFood({ name: "Broccoli" }));
    await updateFoodItem(id, { nutritionData: { vitaminC: 89, calcium: 47 } }, TEST_USER);
    const items = await getAllFoodLogs(TEST_USER);
    const updated = items.find((i) => i.id === id);
    expect(updated!.nutritionData?.vitaminC).toBe(89);
    expect(updated!.nutritionData?.calcium).toBe(47);
  });

  it("legacy items without nutritionData remain accessible", async () => {
    const legacyFood: Omit<FoodItem, "id"> = {
      name: "Legacy Oats",
      calories: 150,
      servingSize: 1,
      protein: 5,
      carbs: 27,
      fat: 3,
      dateLogged: ISODate("2024-01-01"),
      userId: TEST_USER,
      isFavorite: false,
      mealType: "Breakfast",
    };
    const id = await addFoodItemLog(legacyFood);
    const items = await getAllFoodLogs(TEST_USER);
    const legacy = items.find((i) => i.id === id);
    expect(legacy).toBeDefined();
    expect(legacy!.name).toBe("Legacy Oats");
    expect(legacy!.nutritionData).toBeUndefined();
    expect(legacy!.calories).toBe(150);
  });

  it("stores only the provided partial fields in nutritionData", async () => {
    const partial: Partial<NutritionData> = { vitaminA: 200, folate: 50 };
    const id = await addFoodItemLog(baseFood({ name: "Carrot", nutritionData: partial }));
    const items = await getAllFoodLogs(TEST_USER);
    const stored = items.find((i) => i.id === id);
    expect(stored!.nutritionData?.vitaminA).toBe(200);
    expect(stored!.nutritionData?.folate).toBe(50);
    expect(stored!.nutritionData?.vitaminC).toBeUndefined();
    expect(stored!.nutritionData?.calcium).toBeUndefined();
  });
});

// --- BackupSchema with nutritionData ---

describe("BackupSchema - nutritionData in foodItems", () => {
  const minimalBackup = {
    version: 1 as const,
    exportedAt: "2026-01-01T00:00:00.000Z",
    userId: "test-user",
    tables: {
      foodItems: [],
      recipes: [],
      waterLogs: [],
      bodyMeasurements: [],
      userAchievements: [],
      stepLogs: [],
      tdeeProfile: null,
      activityLogs: [],
      fastingSessions: [],
    },
  };

  it("accepts backup with foodItems lacking nutritionData", () => {
    const backup = {
      ...minimalBackup,
      tables: {
        ...minimalBackup.tables,
        foodItems: [
          {
            name: "Rice",
            calories: 200,
            servingSize: 1,
            protein: 4,
            carbs: 44,
            fat: 0.5,
            dateLogged: "2026-01-01",
            isFavorite: false,
            mealType: "Lunch" as const,
          },
        ],
      },
    };
    expect(() => BackupSchema.parse(backup)).not.toThrow();
  });

  it("accepts backup foodItems with nutritionData", () => {
    const backup = {
      ...minimalBackup,
      tables: {
        ...minimalBackup.tables,
        foodItems: [
          {
            name: "Salmon",
            calories: 300,
            servingSize: 1,
            protein: 35,
            carbs: 0,
            fat: 14,
            dateLogged: "2026-01-01",
            isFavorite: false,
            mealType: "Dinner" as const,
            nutritionData: { vitaminD: 15, selenium: 40, sodium: 75 },
          },
        ],
      },
    };
    const result = BackupSchema.parse(backup);
    expect(result.tables.foodItems[0]?.nutritionData?.vitaminD).toBe(15);
  });

  it("rejects backup with invalid nutritionData values", () => {
    const backup = {
      ...minimalBackup,
      tables: {
        ...minimalBackup.tables,
        foodItems: [
          {
            name: "Bad Food",
            calories: 100,
            servingSize: 1,
            protein: 5,
            carbs: 10,
            fat: 2,
            dateLogged: "2026-01-01",
            isFavorite: false,
            nutritionData: { vitaminC: -50 },
          },
        ],
      },
    };
    expect(() => BackupSchema.parse(backup)).toThrow();
  });
});

// --- Photo CRUD ---

describe("Photo CRUD", () => {
  const photoBase: Omit<FoodPhoto, "id"> = {
    userId: TEST_USER,
    imageData: "data:image/png;base64,original",
    thumbnailData: "data:image/png;base64,thumb",
    mimeType: "image/png",
    createdAt: `${TODAY}T12:00:00.000Z`,
  };

  // Share a single inserted photo across read tests to avoid auto-increment issues
  let sharedId: Awaited<ReturnType<typeof addFoodPhoto>>;

  beforeAll(async () => {
    sharedId = await addFoodPhoto(photoBase);
  });

  it("addFoodPhoto returns a numeric FoodPhotoId", () => {
    expect(typeof sharedId).toBe("number");
    expect(sharedId).toBeGreaterThan(0);
  });

  it("getFoodPhoto retrieves the stored photo", async () => {
    const photo = await getFoodPhoto(sharedId, TEST_USER);
    expect(photo).toBeDefined();
    expect(photo?.imageData).toBe("data:image/png;base64,original");
    expect(photo?.thumbnailData).toBe("data:image/png;base64,thumb");
  });

  it("getFoodPhoto returns undefined for wrong userId", async () => {
    const photo = await getFoodPhoto(sharedId, UserId("other-user-x"));
    expect(photo).toBeUndefined();
  });

  it("getFoodPhotosByUser returns photos for the given user and date", async () => {
    const result = await getFoodPhotosByUser(TEST_USER, TODAY);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.userId === TEST_USER)).toBe(true);
  });

  it("getFoodPhotosByUser returns empty array for a date with no photos", async () => {
    const result = await getFoodPhotosByUser(TEST_USER, ISODate("2000-01-01"));
    expect(result).toStrictEqual([]);
  });

  it("deleteFoodPhoto removes the photo", async () => {
    await deleteFoodPhoto(sharedId, TEST_USER);
    const photo = await getFoodPhoto(sharedId, TEST_USER);
    expect(photo).toBeUndefined();
  });
});

// --- DB schema version ---

describe("DB schema version", () => {
  it("is at version 20", () => {
    expect(db.verno).toBe(20);
  });
});

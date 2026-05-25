import { describe, expect, it } from "vitest";
import {
  FoodFormSchema,
  IngredientSchema,
  makeBodySchema,
  RecipeFormSchema,
  StepSchema,
  WaterSchema,
} from "./schemas";

describe("FoodFormSchema", () => {
  const validFood = {
    name: "Apple",
    calories: 95,
    servingSize: 1,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    mealType: "Breakfast" as const,
  };

  it("should accept valid food data", () => {
    const result = FoodFormSchema.safeParse(validFood);
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject name exceeding 100 characters", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject name with invalid characters", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      name: "Apple@#$",
    });
    expect(result.success).toBe(false);
  });

  it("should accept name with allowed punctuation", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      name: "Chicken-Broth (Low-Sodium)",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative calories", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      calories: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject calories exceeding 10000", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      calories: 10001,
    });
    expect(result.success).toBe(false);
  });

  it("should reject zero serving size", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      servingSize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject serving size exceeding 100", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      servingSize: 101,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative protein", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      protein: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject protein exceeding 500g", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      protein: 501,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid meal types", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      mealType: "InvalidMealType",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid meal types", () => {
    const mealTypes = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
    for (const mealType of mealTypes) {
      const result = FoodFormSchema.safeParse({
        ...validFood,
        mealType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should accept zero macros", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric calories", () => {
    const result = FoodFormSchema.safeParse({
      ...validFood,
      calories: "not a number",
    });
    expect(result.success).toBe(false);
  });
});

describe("makeBodySchema", () => {
  const validBodyDataKgIn = {
    weight: "70",
    bodyFat: "20",
    waist: "80",
    chest: "100",
    hips: "95",
  };

  it("should create schema for kg and inches", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse(validBodyDataKgIn);
    expect(result.success).toBe(true);
  });

  it("should create schema for lbs and cm", () => {
    const schema = makeBodySchema("lb", "cm");
    const result = schema.safeParse({
      weight: "150",
      bodyFat: "20",
      waist: "80",
      chest: "100",
      hips: "95",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing weight", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      weight: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weight exceeding max for kg", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      weight: "501",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weight exceeding max for lbs", () => {
    const schema = makeBodySchema("lb", "in");
    const result = schema.safeParse({
      weight: "1101",
      bodyFat: "20",
      waist: "80",
      chest: "100",
      hips: "95",
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero body fat as invalid but optional fields can be empty", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject body fat below 1%", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "0",
    });
    expect(result.success).toBe(false);
  });

  it("should reject body fat above 99%", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "100",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid body fat between 1-99%", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "50",
    });
    expect(result.success).toBe(true);
  });

  it("should allow empty waist measurement", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      waist: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject waist exceeding max for inches", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      waist: "501",
    });
    expect(result.success).toBe(false);
  });

  it("should reject waist exceeding max for cm", () => {
    const schema = makeBodySchema("kg", "cm");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "1271",
      chest: "100",
      hips: "95",
    });
    expect(result.success).toBe(false);
  });

  it("should allow empty chest and hips", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "80",
      chest: "",
      hips: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weight with non-numeric string", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      weight: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weight of zero", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      weight: "0",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative weight", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      weight: "-5",
    });
    expect(result.success).toBe(false);
  });

  it("should reject body fat with non-numeric string", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should reject body fat below 1 with decimal", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      bodyFat: "0.5",
    });
    expect(result.success).toBe(false);
  });

  it("should reject waist with non-numeric string", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      waist: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should reject waist of zero", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      waist: "0",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative waist", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      ...validBodyDataKgIn,
      waist: "-5",
    });
    expect(result.success).toBe(false);
  });

  it("should reject chest with non-numeric string", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "80",
      chest: "abc",
      hips: "95",
    });
    expect(result.success).toBe(false);
  });

  it("should reject chest of zero", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "80",
      chest: "0",
      hips: "95",
    });
    expect(result.success).toBe(false);
  });

  it("should reject hips with non-numeric string", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "80",
      chest: "100",
      hips: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should reject hips of zero", () => {
    const schema = makeBodySchema("kg", "in");
    const result = schema.safeParse({
      weight: "70",
      bodyFat: "20",
      waist: "80",
      chest: "100",
      hips: "0",
    });
    expect(result.success).toBe(false);
  });
});

describe("IngredientSchema", () => {
  const validIngredient = {
    foodItemId: 1,
    foodItemName: "Chicken",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
    quantity: 100,
    serving: 1,
  };

  it("should accept valid ingredient", () => {
    const result = IngredientSchema.safeParse(validIngredient);
    expect(result.success).toBe(true);
  });

  it("should reject zero food item id", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      foodItemId: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative food item id", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      foodItemId: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer food item id", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      foodItemId: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("should accept empty food item name", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      foodItemName: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative calories", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      calories: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject quantity below 1", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject quantity exceeding 999", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      quantity: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject serving below 1", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      serving: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject serving exceeding 999", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      serving: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject calories exceeding 10000", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      calories: 10001,
    });
    expect(result.success).toBe(false);
  });

  it("should reject food item name with invalid characters", () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      foodItemName: "Chicken@",
    });
    expect(result.success).toBe(false);
  });
});

describe("RecipeFormSchema", () => {
  const validRecipe = {
    recipeName: "Chicken Salad",
    description: "A healthy salad with grilled chicken",
    ingredients: [
      {
        foodItemId: 1,
        foodItemName: "Chicken",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 4,
        quantity: 100,
        serving: 1,
      },
    ],
  };

  it("should accept valid recipe", () => {
    const result = RecipeFormSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it("should reject missing recipe name", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      recipeName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing description", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty ingredients array", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      ingredients: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject ingredient with zero food item id", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      ingredients: [
        {
          foodItemId: 0,
          foodItemName: "Invalid",
          calories: 100,
          quantity: 1,
          serving: 1,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should accept multiple ingredients", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      ingredients: [
        {
          foodItemId: 1,
          foodItemName: "Chicken",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 4,
          quantity: 100,
          serving: 1,
        },
        {
          foodItemId: 2,
          foodItemName: "Lettuce",
          calories: 15,
          protein: 1,
          carbs: 2,
          fat: 0,
          quantity: 50,
          serving: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject recipe name exceeding 100 characters", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      recipeName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject description exceeding 500 characters", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("should reject description with non-printable characters", () => {
    const result = RecipeFormSchema.safeParse({
      ...validRecipe,
      description: "Valid\x00Invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("WaterSchema", () => {
  it("should accept valid water amount", () => {
    const result = WaterSchema.safeParse({ amount: 250 });
    expect(result.success).toBe(true);
  });

  it("should reject zero amount", () => {
    const result = WaterSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", () => {
    const result = WaterSchema.safeParse({ amount: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject amount exceeding 5000 ml", () => {
    const result = WaterSchema.safeParse({ amount: 5001 });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer amounts", () => {
    const result = WaterSchema.safeParse({ amount: 250.5 });
    expect(result.success).toBe(false);
  });

  it("should accept maximum amount of 5000", () => {
    const result = WaterSchema.safeParse({ amount: 5000 });
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric amount", () => {
    const result = WaterSchema.safeParse({ amount: "250" });
    expect(result.success).toBe(false);
  });
});

describe("StepSchema", () => {
  it("should accept valid step count", () => {
    const result = StepSchema.safeParse({ steps: 5000 });
    expect(result.success).toBe(true);
  });

  it("should reject zero steps", () => {
    const result = StepSchema.safeParse({ steps: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative steps", () => {
    const result = StepSchema.safeParse({ steps: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject steps exceeding 100,000", () => {
    const result = StepSchema.safeParse({ steps: 100001 });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer steps", () => {
    const result = StepSchema.safeParse({ steps: 5000.5 });
    expect(result.success).toBe(false);
  });

  it("should accept maximum of 100,000 steps", () => {
    const result = StepSchema.safeParse({ steps: 100000 });
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric steps", () => {
    const result = StepSchema.safeParse({ steps: "5000" });
    expect(result.success).toBe(false);
  });

  it("should accept minimum of 1 step", () => {
    const result = StepSchema.safeParse({ steps: 1 });
    expect(result.success).toBe(true);
  });
});

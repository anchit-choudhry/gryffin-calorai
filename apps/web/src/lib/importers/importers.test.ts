import { describe, expect, it } from "vitest";
import { detectFormat, parseImportCsv, splitCsvRow } from "./index";
import { parseMfpCsv } from "./mfp";
import { parseCronometerCsv } from "./cronometer";
import { parseLoseItCsv } from "./loseit";

describe("splitCsvRow", () => {
  it("splits a basic comma-separated row", () => {
    expect(splitCsvRow("a,b,c")).toStrictEqual(["a", "b", "c"]);
  });

  it("handles quoted fields containing commas", () => {
    expect(splitCsvRow('"Oats, honey",2026-01-01,350')).toStrictEqual([
      "Oats, honey",
      "2026-01-01",
      "350",
    ]);
  });

  it("handles escaped double-quotes inside quoted fields", () => {
    expect(splitCsvRow('"He said ""hello""",100')).toStrictEqual(['He said "hello"', "100"]);
  });

  it("trims whitespace from fields", () => {
    expect(splitCsvRow("a , b , c")).toStrictEqual(["a", "b", "c"]);
  });
});

describe("detectFormat", () => {
  it("detects MFP format from headers", () => {
    const headers = ["Date", "Meal", "Calories", "Carbohydrates (g)", "Name"];
    expect(detectFormat(headers)).toBe("mfp");
  });

  it("detects Cronometer format from headers", () => {
    const headers = ["Day", "Food Name", "Amount", "Unit", "Energy (kcal)", "Protein (g)"];
    expect(detectFormat(headers)).toBe("cronometer");
  });

  it("detects Lose It format from headers", () => {
    const headers = ["Date", "Name", "Type", "Quantity", "Unit", "Calories"];
    expect(detectFormat(headers)).toBe("loseit");
  });

  it("returns unknown for unrecognized headers", () => {
    expect(detectFormat(["col1", "col2"])).toBe("unknown");
  });
});

describe("parseMfpCsv", () => {
  const MFP_CSV = `Date,Meal,Calories,Carbohydrates (g),Fat (g),Protein (g),Sodium (mg),Sugar (g),Name
2026-01-01,Breakfast,350,45,12,18,280,8,Oatmeal with banana
2026-01-01,Lunch,520,60,15,30,450,5,Chicken rice bowl
2026-01-01,Dinner,0,0,0,0,0,0,Water`;

  it("parses valid MFP CSV rows", () => {
    const result = parseMfpCsv(MFP_CSV);
    expect(result.entries).toHaveLength(2);
    expect(result.skippedRows).toBe(1);
  });

  it("maps meal types correctly", () => {
    const result = parseMfpCsv(MFP_CSV);
    expect(result.entries[0]!.mealType).toBe("Breakfast");
    expect(result.entries[1]!.mealType).toBe("Lunch");
  });

  it("parses calories, macros, and sodium", () => {
    const result = parseMfpCsv(MFP_CSV);
    const oats = result.entries[0]!;
    expect(oats.calories).toBe(350);
    expect(oats.carbs).toBe(45);
    expect(oats.fat).toBe(12);
    expect(oats.protein).toBe(18);
    expect(oats.sodium).toBe(280);
    expect(oats.sugar).toBe(8);
    expect(oats.name).toBe("Oatmeal with banana");
    expect(oats.dateLogged).toBe("2026-01-01");
  });

  it("handles quoted food names with commas", () => {
    const csv = `Date,Meal,Calories,Carbohydrates (g),Fat (g),Protein (g),Sodium (mg),Sugar (g),Name
2026-01-02,Snack,200,30,5,8,120,10,"Granola bar, chewy"`;
    const result = parseMfpCsv(csv);
    expect(result.entries[0]!.name).toBe("Granola bar, chewy");
  });

  it("returns empty when required columns are missing", () => {
    const bad = `Foo,Bar\n1,2`;
    const result = parseMfpCsv(bad);
    expect(result.entries).toHaveLength(0);
    expect(result.skippedRows).toBe(1);
  });

  it("skips empty lines", () => {
    const csv = `Date,Meal,Calories,Carbohydrates (g),Fat (g),Protein (g),Sodium (mg),Sugar (g),Name
2026-01-01,Breakfast,350,45,12,18,280,8,Oatmeal

2026-01-02,Lunch,400,50,10,25,200,3,Salad`;
    const result = parseMfpCsv(csv);
    expect(result.entries).toHaveLength(2);
  });
});

describe("parseCronometerCsv", () => {
  const CRONOMETER_CSV = `Day,Food Name,Amount,Unit,Energy (kcal),Protein (g),Carbs (g),Fat (g),Sodium (mg),Sugars (g),Fiber (g)
2026-01-01,Greek Yogurt,200,g,120,15,8,2,55,6,0
2026-01-01,Almonds,28,g,164,6,6,14,0,1,3.5
2026-01-01,Invalid,0,g,0,0,0,0,0,0,0`;

  it("parses valid Cronometer CSV rows", () => {
    const result = parseCronometerCsv(CRONOMETER_CSV);
    expect(result.entries).toHaveLength(2);
    expect(result.skippedRows).toBe(1);
  });

  it("parses food name, date, and macros correctly", () => {
    const result = parseCronometerCsv(CRONOMETER_CSV);
    const yogurt = result.entries[0]!;
    expect(yogurt.name).toBe("Greek Yogurt");
    expect(yogurt.dateLogged).toBe("2026-01-01");
    expect(yogurt.calories).toBe(120);
    expect(yogurt.protein).toBe(15);
    expect(yogurt.carbs).toBe(8);
    expect(yogurt.fat).toBe(2);
    expect(yogurt.sodium).toBe(55);
    expect(yogurt.sugar).toBe(6);
    expect(yogurt.fiber).toBe(0);
  });

  it("returns no mealType since Cronometer exports do not include meal column", () => {
    const result = parseCronometerCsv(CRONOMETER_CSV);
    expect(result.entries[0]!.mealType).toBeUndefined();
  });

  it("returns empty when required columns are missing", () => {
    const result = parseCronometerCsv("Col1,Col2\n1,2");
    expect(result.entries).toHaveLength(0);
  });
});

describe("parseLoseItCsv", () => {
  const LOSEIT_CSV = `Date,Name,Type,Quantity,Unit,Calories,Fat (g),Protein (g),Carbohydrates (g),Cholesterol (mg),Sodium (mg),Sugars (g),Fiber (g)
2026-01-01,Scrambled Eggs,Breakfast,2,serving,180,12,14,2,400,190,1,0
2026-01-01,Apple,Snack,1,medium,95,0,0,25,0,2,19,4
2026-01-01,Skip this,Lunch,0,g,0,0,0,0,0,0,0,0`;

  it("parses valid Lose It CSV rows", () => {
    const result = parseLoseItCsv(LOSEIT_CSV);
    expect(result.entries).toHaveLength(2);
    expect(result.skippedRows).toBe(1);
  });

  it("maps meal types from Type column", () => {
    const result = parseLoseItCsv(LOSEIT_CSV);
    expect(result.entries[0]!.mealType).toBe("Breakfast");
    expect(result.entries[1]!.mealType).toBe("Snacks");
  });

  it("parses all nutrition fields", () => {
    const result = parseLoseItCsv(LOSEIT_CSV);
    const eggs = result.entries[0]!;
    expect(eggs.name).toBe("Scrambled Eggs");
    expect(eggs.calories).toBe(180);
    expect(eggs.fat).toBe(12);
    expect(eggs.protein).toBe(14);
    expect(eggs.carbs).toBe(2);
    expect(eggs.sodium).toBe(190);
    expect(eggs.sugar).toBe(1);
    expect(eggs.fiber).toBe(0);
  });

  it("returns empty when required columns are missing", () => {
    const result = parseLoseItCsv("Foo,Bar\n1,2");
    expect(result.entries).toHaveLength(0);
  });
});

describe("parseImportCsv", () => {
  it("auto-detects and parses MFP CSV", () => {
    const csv = `Date,Meal,Calories,Carbohydrates (g),Fat (g),Protein (g),Sodium (mg),Sugar (g),Name
2026-01-01,Breakfast,350,45,12,18,280,8,Oatmeal`;
    const result = parseImportCsv(csv);
    expect(result.format).toBe("mfp");
    expect(result.entries).toHaveLength(1);
  });

  it("auto-detects and parses Cronometer CSV", () => {
    const csv = `Day,Food Name,Amount,Unit,Energy (kcal),Protein (g),Carbs (g),Fat (g),Sodium (mg),Sugars (g),Fiber (g)
2026-01-01,Oatmeal,80,g,300,10,55,5,5,12,4`;
    const result = parseImportCsv(csv);
    expect(result.format).toBe("cronometer");
    expect(result.entries).toHaveLength(1);
  });

  it("auto-detects and parses Lose It CSV", () => {
    const csv = `Date,Name,Type,Quantity,Unit,Calories,Fat (g),Protein (g),Carbohydrates (g),Cholesterol (mg),Sodium (mg),Sugars (g),Fiber (g)
2026-01-01,Oatmeal,Breakfast,1,bowl,300,5,10,55,0,5,12,4`;
    const result = parseImportCsv(csv);
    expect(result.format).toBe("loseit");
    expect(result.entries).toHaveLength(1);
  });

  it("returns unknown format and empty entries for unrecognized CSV", () => {
    const result = parseImportCsv("Col1,Col2\nval1,val2");
    expect(result.format).toBe("unknown");
    expect(result.entries).toHaveLength(0);
  });

  it("returns unknown for an empty CSV string", () => {
    const result = parseImportCsv("");
    expect(result.format).toBe("unknown");
    expect(result.entries).toHaveLength(0);
  });
});

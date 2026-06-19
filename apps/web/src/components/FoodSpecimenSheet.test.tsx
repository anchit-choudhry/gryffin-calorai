import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FoodSpecimenSheet } from "./FoodSpecimenSheet";
import type { FoodItem } from "@/db/dbService";

const makeFood = (overrides: Partial<FoodItem> = {}): FoodItem =>
  ({
    id: 101 as unknown as FoodItem["id"],
    name: "Oatmeal",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 2.5,
    dateLogged: "2026-06-10" as FoodItem["dateLogged"],
    userId: "user-1" as FoodItem["userId"],
    isFavorite: false,
    captureMethod: "manual",
    mealType: "Breakfast",
    ...overrides,
  }) as FoodItem;

describe("FoodSpecimenSheet", () => {
  it("renders the food name as the dialog heading", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /oatmeal/i })).toBeTruthy();
  });

  it("has dialog role and aria-label", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("shows calorie count in header", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByText(/150 kcal/)).toBeTruthy();
  });

  it("shows meal type in header when present", () => {
    render(
      <FoodSpecimenSheet
        food={makeFood({ mealType: "Breakfast" })}
        allLogs={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Breakfast/)).toBeTruthy();
  });

  it("shows macro rows for protein, carbs, fat", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("Carbs")).toBeTruthy();
    expect(screen.getByText("Fat")).toBeTruthy();
  });

  it("shows fiber row when nutritionData.fiber present", () => {
    const food = makeFood({ nutritionData: { fiber: 3.5 } });
    render(<FoodSpecimenSheet food={food} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByText("Fiber")).toBeTruthy();
  });

  it("hides fiber row when nutritionData absent", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.queryByText("Fiber")).toBeNull();
  });

  it("shows sodium row when nutritionData.sodium present", () => {
    const food = makeFood({ nutritionData: { sodium: 120 } });
    render(<FoodSpecimenSheet food={food} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByText("Sodium")).toBeTruthy();
  });

  it("shows 'Not yet logged' when allLogs is empty", () => {
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />);
    expect(screen.getByText(/Not yet logged/)).toBeTruthy();
  });

  it("shows 'Times logged' count equal to matching log entries", () => {
    const food = makeFood();
    const logs = [
      makeFood({ dateLogged: "2026-06-10" as FoodItem["dateLogged"] }),
      makeFood({ dateLogged: "2026-06-11" as FoodItem["dateLogged"] }),
      makeFood({ name: "Banana", dateLogged: "2026-06-11" as FoodItem["dateLogged"] }),
    ];
    render(<FoodSpecimenSheet food={food} allLogs={logs} onClose={vi.fn()} />);
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("shows first logged date from matching logs", () => {
    const food = makeFood();
    const logs = [
      makeFood({ dateLogged: "2026-06-15" as FoodItem["dateLogged"] }),
      makeFood({ dateLogged: "2026-01-05" as FoodItem["dateLogged"] }),
    ];
    render(<FoodSpecimenSheet food={food} allLogs={logs} onClose={vi.fn()} />);
    expect(screen.getByText(/January 5, 2026/)).toBeTruthy();
  });

  it("shows total calories summed from matching logs", () => {
    const food = makeFood({ calories: 150 });
    const logs = [
      makeFood({ calories: 150, dateLogged: "2026-06-10" as FoodItem["dateLogged"] }),
      makeFood({ calories: 150, dateLogged: "2026-06-11" as FoodItem["dateLogged"] }),
    ];
    render(<FoodSpecimenSheet food={food} allLogs={logs} onClose={vi.fn()} />);
    expect(screen.getByText(/300 kcal/)).toBeTruthy();
  });

  it("renders 30 occurrence dots", () => {
    const { container } = render(
      <FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={vi.fn()} />,
    );
    const sparkline = container.querySelector("[role='img']");
    expect(sparkline?.children.length).toBe(30);
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close specimen sheet/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <FoodSpecimenSheet food={makeFood()} allLogs={[]} onClose={onClose} />,
    );
    const backdrop = container.querySelector("[aria-hidden='true']");
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows specimen ID from food.id", () => {
    render(
      <FoodSpecimenSheet
        food={makeFood({ id: 42 as unknown as FoodItem["id"] })}
        allLogs={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Specimen No. 42/)).toBeTruthy();
  });

  it("case-insensitive name matching for allLogs", () => {
    const food = makeFood({ name: "oatmeal" });
    const logs = [makeFood({ name: "Oatmeal" }), makeFood({ name: "OATMEAL" })];
    render(<FoodSpecimenSheet food={food} allLogs={logs} onClose={vi.fn()} />);
    expect(screen.getByText("2")).toBeTruthy();
  });
});

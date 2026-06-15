import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LogEntry from "./LogEntry";
import { FoodItemId, ISODate, UserId } from "@/types";
import type { FoodItem } from "@/db/dbService";

vi.mock("motion/react", () => ({
  motion: {
    li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeLog = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: FoodItemId(1),
  name: "Chicken Breast",
  calories: 165,
  servingSize: 1,
  protein: 31,
  carbs: 0,
  fat: 3,
  dateLogged: ISODate("2026-05-01"),
  userId: UserId("user-1"),
  isFavorite: false,
  mealType: "Lunch",
  ...overrides,
});

describe("LogEntry", () => {
  it("renders food name", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    expect(screen.getByText("Chicken Breast")).toBeTruthy();
  });

  it("renders calories", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    expect(screen.getByText("165")).toBeTruthy();
  });

  it("renders meal type label", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    expect(screen.getByText("Lunch")).toBeTruthy();
  });

  it("renders macro row with protein, carbs, fat", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    const macroText = screen.getByText(/P 31g/);
    expect(macroText).toBeTruthy();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    const log = makeLog();
    render(<LogEntry log={log} onEdit={onEdit} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    const editBtns = screen.getAllByRole("button", { name: /edit chicken breast/i });
    fireEvent.click(editBtns[0]!);
    expect(onEdit).toHaveBeenCalledWith(log);
  });

  it("calls onDelete immediately when delete is clicked (no confirm step)", () => {
    const onDelete = vi.fn();
    const log = makeLog();
    render(<LogEntry log={log} onEdit={vi.fn()} onDelete={onDelete} onToggleFavorite={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: /delete chicken breast/i })[0]!);
    expect(onDelete).toHaveBeenCalledWith(log.id);
  });

  it("calls onToggleFavorite when star button is clicked", () => {
    const onToggleFavorite = vi.fn();
    const log = makeLog();
    render(
      <LogEntry
        log={log}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /star chicken breast/i })[0]!);
    expect(onToggleFavorite).toHaveBeenCalledWith(log.id, true);
  });

  it("shows unstar label when food is already a favorite", () => {
    render(
      <LogEntry
        log={makeLog({ isFavorite: true })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: /unstar chicken breast/i }).length,
    ).toBeGreaterThan(0);
  });

  it("mobile menu button toggles action strip visibility", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    const menuBtn = screen.getByRole("button", { name: /show actions for chicken breast/i });
    expect(menuBtn).toBeTruthy();
    fireEvent.click(menuBtn);
    expect(screen.getByRole("button", { name: /hide actions for chicken breast/i })).toBeTruthy();
  });

  it("shows serving size when not 1", () => {
    render(
      <LogEntry
        log={makeLog({ servingSize: 2 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText(/2 servings/)).toBeTruthy();
  });

  it("does not show serving size when it is 1", () => {
    render(
      <LogEntry
        log={makeLog({ servingSize: 1 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.queryByText(/1 serving/)).toBeNull();
  });

  it("shows default meal type when mealType is undefined", () => {
    render(
      <LogEntry
        log={makeLog({ mealType: undefined })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    // DEFAULT_MEAL_TYPE ("Breakfast") is used when mealType is absent
    expect(screen.getByText("Breakfast")).toBeTruthy();
  });

  it("handleDelete does nothing when log.id is undefined", () => {
    const onDelete = vi.fn();
    render(
      <LogEntry
        log={makeLog({ id: undefined })}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onToggleFavorite={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]!);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("renders dot-leader span between name and calories", () => {
    const { container } = render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    const leader = container.querySelector('[aria-hidden="true"][class*="border-dotted"]');
    expect(leader).toBeTruthy();
  });

  it("calories are rendered alongside the food name in same row", () => {
    render(
      <LogEntry log={makeLog()} onEdit={vi.fn()} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />,
    );
    const nameEl = screen.getByText("Chicken Breast");
    const caloriesEl = screen.getByText("165");
    const nameParent = nameEl.closest("div");
    const caloriesParent = caloriesEl.closest("div");
    expect(nameParent).toBe(caloriesParent);
  });
});

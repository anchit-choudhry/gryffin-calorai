import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import { useAppState } from "@/state/AppState";
import { FoodItemId, ISODate, RecipeId, todayISO, UserId } from "@/types";

// jsdom does not implement showModal/close on HTMLDialogElement; simulate open attribute
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

const defaultProps = {
  onNavigate: vi.fn(),
  onAction: vi.fn(),
  onToggleDark: vi.fn(),
  onToggleHelp: vi.fn(),
};

const TEST_USER = UserId("cp-test-user");

function setup(propsOverride = {}) {
  const props = { ...defaultProps, ...propsOverride };
  useAppState.setState({
    commandPaletteOpen: true,
    selectedDate: todayISO(),
    allFoodItems: [],
    userId: TEST_USER,
  });
  return render(<CommandPalette {...props} />);
}

describe("CommandPalette", () => {
  describe("visibility", () => {
    it("renders search input when commandPaletteOpen is true", () => {
      setup();
      expect(screen.getByRole("searchbox")).toBeTruthy();
    });

    it("does not render when commandPaletteOpen is false", () => {
      useAppState.setState({ commandPaletteOpen: false });
      render(<CommandPalette {...defaultProps} />);
      expect(screen.queryByRole("searchbox")).toBeNull();
    });

    it("shows all default command categories", () => {
      setup();
      expect(screen.getByText("Navigate")).toBeTruthy();
      expect(screen.getByText("Log")).toBeTruthy();
      expect(screen.getByText("Date")).toBeTruthy();
      expect(screen.getByText("View")).toBeTruthy();
    });
  });

  describe("commands list", () => {
    it("shows navigate commands", () => {
      setup();
      expect(screen.getByText("Dashboard")).toBeTruthy();
      expect(screen.getByText("Recipes")).toBeTruthy();
      expect(screen.getByText("Progress")).toBeTruthy();
      expect(screen.getByText("Settings")).toBeTruthy();
    });

    it("shows log commands", () => {
      setup();
      expect(screen.getByText("Log Food")).toBeTruthy();
      expect(screen.getByText("Scan Barcode")).toBeTruthy();
      expect(screen.getByText("Voice Log")).toBeTruthy();
    });

    it("shows date commands", () => {
      setup();
      expect(screen.getByText("Previous Day")).toBeTruthy();
      expect(screen.getByText("Next Day")).toBeTruthy();
      expect(screen.getByText("Go to Today")).toBeTruthy();
    });

    it("shows view commands", () => {
      setup();
      expect(screen.getByText("Toggle Dark Mode")).toBeTruthy();
      expect(screen.getByText("Keyboard Shortcuts")).toBeTruthy();
    });
  });

  describe("search filtering", () => {
    it("filters commands by label", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "recipe" } });
      expect(screen.getByText("Recipes")).toBeTruthy();
      expect(screen.queryByText("Dashboard")).toBeNull();
    });

    it("filters commands by keyword", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "scan" } });
      expect(screen.getByText("Scan Barcode")).toBeTruthy();
    });

    it("shows No results when nothing matches", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "zzznomatch" } });
      expect(screen.getByText("No results")).toBeTruthy();
    });

    it("clear button resets query", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "dash" } });
      const clearBtn = screen.getByRole("button", { name: /clear search/i });
      fireEvent.click(clearBtn);
      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowDown moves active index down", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const options = screen.getAllByRole("option");
      expect(options[1]?.getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowUp does not go below 0", () => {
      setup();
      const input = screen.getByRole("searchbox");
      fireEvent.keyDown(input, { key: "ArrowUp" });
      const options = screen.getAllByRole("option");
      expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    });

    it("Enter selects the active command", () => {
      const onNavigate = vi.fn();
      setup({ onNavigate });
      const input = screen.getByRole("searchbox");
      // First command in list is Dashboard (Navigate category)
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe("command actions", () => {
    it("clicking Dashboard calls onNavigate with #dashboard", () => {
      const onNavigate = vi.fn();
      setup({ onNavigate });
      fireEvent.click(screen.getByText("Dashboard"));
      expect(onNavigate).toHaveBeenCalledWith("#dashboard");
    });

    it("clicking Recipes calls onNavigate with #recipes", () => {
      const onNavigate = vi.fn();
      setup({ onNavigate });
      fireEvent.click(screen.getByText("Recipes"));
      expect(onNavigate).toHaveBeenCalledWith("#recipes");
    });

    it("clicking Progress calls onNavigate with #progress", () => {
      const onNavigate = vi.fn();
      setup({ onNavigate });
      fireEvent.click(screen.getByText("Progress"));
      expect(onNavigate).toHaveBeenCalledWith("#progress");
    });

    it("clicking Settings calls onNavigate with #settings", () => {
      const onNavigate = vi.fn();
      setup({ onNavigate });
      fireEvent.click(screen.getByText("Settings"));
      expect(onNavigate).toHaveBeenCalledWith("#settings");
    });

    it("clicking Toggle Dark Mode calls onToggleDark", () => {
      const onToggleDark = vi.fn();
      setup({ onToggleDark });
      fireEvent.click(screen.getByText("Toggle Dark Mode"));
      expect(onToggleDark).toHaveBeenCalledOnce();
    });

    it("clicking Keyboard Shortcuts calls onToggleHelp", () => {
      const onToggleHelp = vi.fn();
      setup({ onToggleHelp });
      fireEvent.click(screen.getByText("Keyboard Shortcuts"));
      expect(onToggleHelp).toHaveBeenCalledOnce();
    });

    it("clicking Log Food calls onAction with 'write'", () => {
      const onAction = vi.fn();
      setup({ onAction });
      fireEvent.click(screen.getByText("Log Food"));
      expect(onAction).toHaveBeenCalledWith("write");
    });

    it("clicking Scan Barcode calls onAction with 'scan'", () => {
      const onAction = vi.fn();
      setup({ onAction });
      fireEvent.click(screen.getByText("Scan Barcode"));
      expect(onAction).toHaveBeenCalledWith("scan");
    });

    it("clicking Voice Log calls onAction with 'speak'", () => {
      const onAction = vi.fn();
      setup({ onAction });
      fireEvent.click(screen.getByText("Voice Log"));
      expect(onAction).toHaveBeenCalledWith("speak");
    });

    it("clicking Pick a Date opens the inline date picker", () => {
      setup();
      fireEvent.click(screen.getByText("Pick a Date"));
      expect(screen.getByLabelText("Pick a date")).toBeTruthy();
      expect(useAppState.getState().commandPaletteOpen).toBe(true);
    });

    it("Back to commands button closes the inline date picker", () => {
      setup();
      fireEvent.click(screen.getByText("Pick a Date"));
      expect(screen.getByLabelText("Pick a date")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Back to commands" }));
      expect(screen.getByRole("searchbox")).toBeTruthy();
    });

    it("changing date input sets selected date and closes palette", async () => {
      setup();
      fireEvent.click(screen.getByText("Pick a Date"));
      const dateInput = screen.getByLabelText("Pick a date");
      fireEvent.change(dateInput, { target: { value: "2026-01-15" } });
      await waitFor(() => {
        expect(useAppState.getState().selectedDate).toBe("2026-01-15");
      });
    });

    it("hovering an option updates the active index", () => {
      setup();
      const options = screen.getAllByRole("option");
      fireEvent.mouseEnter(options[2]!);
      expect(options[2]?.getAttribute("aria-selected")).toBe("true");
    });
  });

  describe("date navigation", () => {
    it("clicking Previous Day calls setSelectedDate with yesterday", async () => {
      const today = todayISO();
      useAppState.setState({ commandPaletteOpen: true, selectedDate: today, userId: TEST_USER });
      render(<CommandPalette {...defaultProps} />);
      fireEvent.click(screen.getByText("Previous Day"));
      await waitFor(() => {
        expect(useAppState.getState().selectedDate < today).toBe(true);
      });
    });

    it("Next Day is disabled when on today", () => {
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: todayISO(),
        userId: TEST_USER,
      });
      render(<CommandPalette {...defaultProps} />);
      fireEvent.click(screen.getByText("Next Day"));
      // Should not move past today - no async needed since guard is synchronous
      expect(useAppState.getState().selectedDate).toBe(todayISO());
    });

    it("Go to Today sets date to today", async () => {
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: ISODate("2026-01-01"),
        userId: TEST_USER,
      });
      render(<CommandPalette {...defaultProps} />);
      fireEvent.click(screen.getByText("Go to Today"));
      await waitFor(() => {
        expect(useAppState.getState().selectedDate).toBe(todayISO());
      });
    });
  });

  describe("closing", () => {
    it("clicking backdrop closes the palette", () => {
      setup();
      const backdrop = screen.getByRole("searchbox").closest("dialog")!;
      // Find backdrop via aria-hidden
      const backdropDiv = backdrop.parentElement?.querySelector(
        "[aria-hidden='true']",
      ) as HTMLElement;
      if (backdropDiv) fireEvent.click(backdropDiv);
      expect(useAppState.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe("food fuzzy search", () => {
    it("shows Quick Log category when query matches a food item", () => {
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: todayISO(),
        allFoodItems: [
          {
            id: FoodItemId(1),
            name: "Chicken Breast",
            calories: 165,
            servingSize: 1,
            mealType: "Lunch",
            dateLogged: todayISO(),
            userId: TEST_USER,
            isFavorite: false,
          },
        ],
      });
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "chicken" } });
      expect(screen.getByText("Quick Log")).toBeTruthy();
      expect(screen.getByText("Chicken Breast")).toBeTruthy();
    });
  });

  describe("recipe search (Item 8)", () => {
    it("shows Recipes category when query matches a recipe name", () => {
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: todayISO(),
        allFoodItems: [],
        userId: TEST_USER,
        recipes: [
          {
            id: RecipeId(1),
            name: "Pasta Bolognese",
            description: "Classic Italian pasta",
            ingredients: [],
            totalCalories: 650,
            createdBy: TEST_USER,
            dateCreated: todayISO(),
            userId: TEST_USER,
          },
        ],
      });
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "pasta" } });
      expect(screen.getByText("Recipes")).toBeTruthy();
      expect(screen.getByText("Pasta Bolognese")).toBeTruthy();
    });

    it("clicking a recipe result navigates to #recipes", () => {
      const onNavigate = vi.fn();
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: todayISO(),
        allFoodItems: [],
        userId: TEST_USER,
        recipes: [
          {
            id: RecipeId(2),
            name: "Avocado Toast",
            description: "Quick breakfast",
            ingredients: [],
            totalCalories: 300,
            createdBy: TEST_USER,
            dateCreated: todayISO(),
            userId: TEST_USER,
          },
        ],
      });
      render(<CommandPalette {...defaultProps} onNavigate={onNavigate} />);
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "avocado" } });
      fireEvent.click(screen.getByText("Avocado Toast"));
      expect(onNavigate).toHaveBeenCalledWith("#recipes");
    });

    it("does not show Recipes category when no recipe matches the query", () => {
      useAppState.setState({
        commandPaletteOpen: true,
        selectedDate: todayISO(),
        allFoodItems: [],
        userId: TEST_USER,
        recipes: [
          {
            id: RecipeId(3),
            name: "Pasta Bolognese",
            description: "",
            ingredients: [],
            totalCalories: 650,
            createdBy: TEST_USER,
            dateCreated: todayISO(),
            userId: TEST_USER,
          },
        ],
      });
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "sushi" } });
      expect(screen.queryByText("Pasta Bolognese")).toBeNull();
    });
  });
});

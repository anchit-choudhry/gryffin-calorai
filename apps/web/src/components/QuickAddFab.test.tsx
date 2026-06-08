import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickAddFab } from "./QuickAddFab";

const mockOpenQuickAdd = vi.fn();

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: { openQuickAdd: () => void }) => unknown) =>
    selector({ openQuickAdd: mockOpenQuickAdd }),
}));

describe("QuickAddFab", () => {
  beforeEach(() => {
    mockOpenQuickAdd.mockClear();
  });

  it("renders a button with accessible label", () => {
    render(<QuickAddFab />);
    expect(screen.getByRole("button", { name: "Quick add" })).toBeTruthy();
  });

  it("calls openQuickAdd when clicked", () => {
    render(<QuickAddFab />);
    fireEvent.click(screen.getByRole("button", { name: "Quick add" }));
    expect(mockOpenQuickAdd).toHaveBeenCalledOnce();
  });

  it("has type='button' to prevent accidental form submission", () => {
    render(<QuickAddFab />);
    const btn = screen.getByRole("button", { name: "Quick add" });
    expect(btn.getAttribute("type")).toBe("button");
  });

  it("renders a Plus icon as aria-hidden", () => {
    const { container } = render(<QuickAddFab />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});

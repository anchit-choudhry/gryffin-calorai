import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders heading", () => {
    render(<EmptyState heading="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
  });

  it("renders eyebrow and body text", () => {
    render(<EmptyState heading="Empty" eyebrow="Section" body="Add something to get started." />);
    expect(screen.getByText("Section")).toBeTruthy();
    expect(screen.getByText("Add something to get started.")).toBeTruthy();
  });

  it("renders action button and calls onClick", () => {
    const onClick = vi.fn();
    render(<EmptyState heading="Empty" action={{ label: "Add Item", onClick }} />);
    const btn = screen.getByRole("button", { name: "Add Item" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button in quiet variant", () => {
    const onClick = vi.fn();
    render(<EmptyState heading="Empty" action={{ label: "Add Item", onClick }} variant="quiet" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders illustration slot in illustrated variant", () => {
    render(
      <EmptyState
        heading="Empty"
        illustration={<svg data-testid="illus" />}
        variant="illustrated"
      />,
    );
    expect(screen.getByTestId("illus")).toBeTruthy();
  });

  it("does not render illustration in quiet variant", () => {
    render(
      <EmptyState heading="Empty" illustration={<svg data-testid="illus" />} variant="quiet" />,
    );
    expect(screen.queryByTestId("illus")).toBeNull();
  });
});

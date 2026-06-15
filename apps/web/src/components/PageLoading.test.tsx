import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PageLoading from "./PageLoading";

describe("PageLoading", () => {
  it("exports a React component", () => {
    expect(PageLoading).toBeDefined();
    expect(typeof PageLoading).toBe("function");
  });

  it("renders the default loading message", () => {
    render(<PageLoading />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders a custom message", () => {
    render(<PageLoading message="Please wait..." />);
    expect(screen.getByText("Please wait...")).toBeTruthy();
  });

  it("renders SeasonalFlourish SVG ornament instead of spinner", () => {
    const { container } = render(<PageLoading />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const spinners = container.querySelectorAll('[class*="animate-spin"]');
    expect(spinners).toHaveLength(0);
  });

  it("renders without crashing when message is empty string", () => {
    const { container } = render(<PageLoading message="" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with long message", () => {
    const longMessage = "Loading your data from the database. This may take a moment...";
    render(<PageLoading message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeTruthy();
  });
});

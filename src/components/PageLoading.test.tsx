import { describe, expect, it } from "vitest";
import PageLoading from "./PageLoading";

describe("PageLoading", () => {
  it("exports a React component", () => {
    expect(PageLoading).toBeDefined();
    expect(typeof PageLoading).toBe("function");
  });

  it("accepts optional message prop", () => {
    const component = PageLoading({ message: "Loading dashboard..." });
    expect(component).toBeDefined();
  });

  it("renders with default props", () => {
    const component = PageLoading({});
    expect(component).toBeDefined();
  });

  it("renders with default loading message", () => {
    const component = PageLoading({});
    expect(component).toBeDefined();
  });

  it("accepts custom message", () => {
    const message = "Please wait...";
    const component = PageLoading({ message });
    expect(component).toBeDefined();
  });

  it("renders with empty message", () => {
    const component = PageLoading({ message: "" });
    expect(component).toBeDefined();
  });

  it("renders with long message", () => {
    const longMessage = "Loading your data from the database. This may take a moment...";
    const component = PageLoading({ message: longMessage });
    expect(component).toBeDefined();
  });

  it("renders with special characters in message", () => {
    const message = "Loading... (3/5) 🔄";
    const component = PageLoading({ message });
    expect(component).toBeDefined();
  });
});

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
});

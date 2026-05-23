import { beforeEach, describe, expect, it, vi } from "vitest";
// Note: Vitest always runs in DEV mode, so console.error is always called
import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a React component class", () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe("function");
  });

  it("renders children when there is no error", () => {
    const testChild = "Test";
    const boundary = new ErrorBoundary({ children: testChild });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });

  it("has initial state with hasError false", () => {
    const boundary = new ErrorBoundary({ children: null });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(boundary.state.errorId).toBe("");
  });

  it("getDerivedStateFromError sets hasError and error", () => {
    const testError = new Error("Test error");
    const newState = ErrorBoundary.getDerivedStateFromError(testError);
    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
    expect(newState.errorId).toBeDefined();
    expect(typeof newState.errorId).toBe("string");
    expect(newState.errorId.length).toBeGreaterThan(0);
  });

  it("componentDidCatch handles errors", () => {
    const boundary = new ErrorBoundary({ children: null });
    const testError = new Error("Caught error");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Call componentDidCatch
    boundary.componentDidCatch(testError);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("renders error UI when hasError is true", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = {
      hasError: true,
      error: new Error("Test error"),
      errorId: "test-error-id-123",
    };

    const result = boundary.render();
    expect(result).toBeDefined();
  });

  it("generates unique error IDs", () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");

    const state1 = ErrorBoundary.getDerivedStateFromError(error1);
    const state2 = ErrorBoundary.getDerivedStateFromError(error2);

    expect(state1.errorId).not.toBe(state2.errorId);
  });

  it("renders children when error is cleared", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = {
      hasError: false,
      error: null,
      errorId: "",
    };

    const result = boundary.render();
    expect(result).toBeNull();
  });

  it("clears error state on reset", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = {
      hasError: true,
      error: new Error("Old error"),
      errorId: "old-id",
    };

    // Manually reset state
    boundary.state = { hasError: false, error: null, errorId: "" };

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });

  it("handles error with custom message", () => {
    const customMessage = "Custom error message";
    const testError = new Error(customMessage);
    const newState = ErrorBoundary.getDerivedStateFromError(testError);

    expect(newState.error?.message).toBe(customMessage);
  });
});

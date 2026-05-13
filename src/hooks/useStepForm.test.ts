import { describe, expect, it, vi } from "vitest";
import { StepSchema } from "../forms/schemas";

vi.mock("../state/AppState", () => ({
  useAppState: vi.fn(() => ({
    addStepLog: vi.fn(async () => undefined),
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useStepForm", () => {
  it("exports useStepForm as a function", async () => {
    const { useStepForm } = await import("./useStepForm");
    expect(typeof useStepForm).toBe("function");
  });
});

describe("StepSchema validation", () => {
  it("accepts minimum valid step count (1)", () => {
    expect(StepSchema.safeParse({ steps: 1 }).success).toBe(true);
  });

  it("accepts maximum valid step count (100,000)", () => {
    expect(StepSchema.safeParse({ steps: 100000 }).success).toBe(true);
  });

  it("accepts common step counts", () => {
    expect(StepSchema.safeParse({ steps: 2000 }).success).toBe(true);
    expect(StepSchema.safeParse({ steps: 5000 }).success).toBe(true);
    expect(StepSchema.safeParse({ steps: 10000 }).success).toBe(true);
  });

  it("rejects zero steps", () => {
    const result = StepSchema.safeParse({ steps: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Must be at least 1 step");
    }
  });

  it("rejects negative steps", () => {
    const result = StepSchema.safeParse({ steps: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Must be at least 1 step");
    }
  });

  it("rejects steps exceeding 100,000", () => {
    const result = StepSchema.safeParse({ steps: 100001 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Cannot exceed 100,000 steps");
    }
  });

  it("rejects fractional steps", () => {
    const result = StepSchema.safeParse({ steps: 1500.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Steps must be a whole number");
    }
  });

  it("rejects string input", () => {
    const result = StepSchema.safeParse({ steps: "five hundred" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Steps must be a number");
    }
  });

  it("rejects missing steps field", () => {
    expect(StepSchema.safeParse({}).success).toBe(false);
  });

  it("rejects null", () => {
    expect(StepSchema.safeParse({ steps: null }).success).toBe(false);
  });
});

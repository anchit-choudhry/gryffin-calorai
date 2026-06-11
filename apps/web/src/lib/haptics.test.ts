import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isHapticsSupported, triggerHaptic } from "./haptics";

describe("isHapticsSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when navigator.vibrate is a function", () => {
    vi.stubGlobal("navigator", { vibrate: vi.fn() });
    expect(isHapticsSupported()).toBe(true);
  });

  it("returns false when navigator.vibrate is undefined", () => {
    vi.stubGlobal("navigator", {});
    expect(isHapticsSupported()).toBe(false);
  });

  it("returns false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isHapticsSupported()).toBe(false);
  });
});

describe("triggerHaptic", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    vi.stubGlobal("navigator", { vibrate: vibrateMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls navigator.vibrate with a short pulse for 'tap'", () => {
    triggerHaptic("tap");
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("calls navigator.vibrate with a double pulse for 'success'", () => {
    triggerHaptic("success");
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });

  it("calls navigator.vibrate with a triple pulse for 'error'", () => {
    triggerHaptic("error");
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30, 50, 30]);
  });

  it("calls navigator.vibrate with a celebration pattern for 'milestone'", () => {
    triggerHaptic("milestone");
    expect(vibrateMock).toHaveBeenCalledWith([10, 30, 10, 30, 100]);
  });

  it("does nothing when navigator.vibrate is not available", () => {
    vi.stubGlobal("navigator", {});
    expect(() => triggerHaptic("tap")).not.toThrow();
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("does nothing when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => triggerHaptic("tap")).not.toThrow();
  });
});

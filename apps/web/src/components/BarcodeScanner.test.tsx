import { describe, expect, it, vi } from "vitest";

vi.mock("../hooks/useBarcodeScanner", () => ({
  useBarcodeScanner: vi.fn(() => ({
    videoRef: { current: null },
    startScanning: vi.fn(),
    stopScanning: vi.fn(),
    isScanning: false,
    scanResult: null,
    error: null,
  })),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("BarcodeScanner", () => {
  it("exports BarcodeScanner component", async () => {
    const mod = await import("./BarcodeScanner");
    expect(mod.default).toBeDefined();
  });

  it("sanitizeBarcodeInput rejects empty string", async () => {
    const { sanitizeBarcodeInput } = await import("../types");
    expect(sanitizeBarcodeInput("")).toBeNull();
  });

  it("sanitizeBarcodeInput rejects strings over 100 chars", async () => {
    const { sanitizeBarcodeInput } = await import("../types");
    expect(sanitizeBarcodeInput("a".repeat(101))).toBeNull();
  });

  it("sanitizeBarcodeInput accepts a valid barcode", async () => {
    const { sanitizeBarcodeInput } = await import("../types");
    expect(sanitizeBarcodeInput("  0123456789  ")).toBe("0123456789");
  });

  it("sanitizeBarcodeInput strips non-printable characters", async () => {
    const { sanitizeBarcodeInput } = await import("../types");
    expect(sanitizeBarcodeInput("abc\x00def")).toBe("abcdef");
  });
});

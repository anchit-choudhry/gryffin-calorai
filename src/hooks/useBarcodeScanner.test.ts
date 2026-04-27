import { describe, expect, it, vi } from "vitest";

const mockReader = {
  decodeFromVideoDevice: vi.fn(async () => ({ getText: () => "1234567890" })),
  reset: vi.fn(async () => {}),
};

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice = mockReader.decodeFromVideoDevice;
    reset = mockReader.reset;
  },
}));

describe("useBarcodeScanner", () => {
  it("exports a hook function", async () => {
    const { useBarcodeScanner } = await import("./useBarcodeScanner");
    expect(typeof useBarcodeScanner).toBe("function");
  });

  it("BrowserMultiFormatReader can be instantiated", async () => {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    expect(reader).toBeDefined();
    expect(reader).toHaveProperty("decodeFromVideoDevice");
    expect(reader).toHaveProperty("reset");
  });
});

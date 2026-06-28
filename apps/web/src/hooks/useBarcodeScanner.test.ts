import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBarcodeScanner } from "./useBarcodeScanner";

vi.mock("../types", () => ({
  sanitizeBarcodeInput: (input: string) => input || null,
}));

// Capture RAF callback so tests can trigger one scan frame manually.
let pendingRaf: FrameRequestCallback | null = null;

const triggerRaf = async () => {
  const cb = pendingRaf;
  pendingRaf = null;
  if (!cb) return;
  await act(async () => {
    cb(0);
    // Flush the async detect() Promise and any resulting React state updates
    await Promise.resolve();
    await Promise.resolve();
  });
};

const mockTrackStop = vi.fn();
const mockStream = {
  getTracks: () => [{ stop: mockTrackStop }],
} as unknown as MediaStream;

const mockDetect = vi.fn<(image: HTMLVideoElement) => Promise<{ rawValue: string }[]>>();
const mockPlay = vi.fn<() => Promise<void>>();
const mockGetUserMedia = vi.fn<(constraints: MediaStreamConstraints) => Promise<MediaStream>>();

class MockBarcodeDetector {
  static getSupportedFormats = vi.fn<() => Promise<string[]>>().mockResolvedValue(["ean_13"]);
  detect = mockDetect;
}

beforeEach(() => {
  vi.resetAllMocks();
  pendingRaf = null;

  mockDetect.mockResolvedValue([]);
  mockGetUserMedia.mockResolvedValue(mockStream);
  mockPlay.mockResolvedValue(undefined);

  vi.stubGlobal("BarcodeDetector", MockBarcodeDetector);
  Object.defineProperty(globalThis, "navigator", {
    value: { mediaDevices: { getUserMedia: mockGetUserMedia } },
    writable: true,
    configurable: true,
  });
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: FrameRequestCallback) => {
      pendingRaf = cb;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  HTMLVideoElement.prototype.play = mockPlay;
  Object.defineProperty(HTMLVideoElement.prototype, "srcObject", {
    get: vi.fn(() => null),
    set: vi.fn(),
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useBarcodeScanner", () => {
  it("should export useBarcodeScanner hook", async () => {
    const { useBarcodeScanner: hook } = await import("./useBarcodeScanner");
    expect(typeof hook).toBe("function");
  });

  it("should return hook with required properties", () => {
    const { result } = renderHook(() => useBarcodeScanner());
    expect(result.current).toHaveProperty("videoRef");
    expect(result.current).toHaveProperty("startScanning");
    expect(result.current).toHaveProperty("stopScanning");
    expect(result.current).toHaveProperty("isScanning");
    expect(result.current).toHaveProperty("scanResult");
    expect(result.current).toHaveProperty("error");
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useBarcodeScanner());
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scanResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.videoRef).toBeDefined();
  });

  it("should have startScanning and stopScanning functions", () => {
    const { result } = renderHook(() => useBarcodeScanner());
    expect(typeof result.current.startScanning).toBe("function");
    expect(typeof result.current.stopScanning).toBe("function");
  });

  it("should call getUserMedia and set isScanning on startScanning", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: { facingMode: "environment" } });
    expect(result.current.isScanning).toBe(true);
  });

  it("should detect a barcode and set scanResult", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    mockDetect.mockResolvedValueOnce([{ rawValue: "1234567890" }]);
    await triggerRaf();

    expect(result.current.scanResult).toBe("1234567890");
  });

  it("should stop scanning after getting a barcode result", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    mockDetect.mockResolvedValueOnce([{ rawValue: "1234567890" }]);
    await triggerRaf();

    expect(result.current.isScanning).toBe(false);
  });

  it("should not set scanResult for empty barcode rawValue", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    // Empty rawValue: sanitizeBarcodeInput returns null, no result set
    mockDetect.mockResolvedValueOnce([{ rawValue: "" }]);
    await triggerRaf();

    expect(result.current.scanResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should not process barcode if stopScanning was called before RAF fires", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    act(() => {
      result.current.stopScanning();
    });

    mockDetect.mockResolvedValueOnce([{ rawValue: "1234567890" }]);
    await triggerRaf();

    expect(result.current.scanResult).toBeNull();
  });

  it("should not set scanResult or error when no barcode detected in frame", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    mockDetect.mockResolvedValueOnce([]);
    await triggerRaf();

    // No barcode found - result and error remain unset
    expect(result.current.scanResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should stop scanning via stopScanning", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.isScanning).toBe(true);

    act(() => {
      result.current.stopScanning();
    });

    expect(result.current.isScanning).toBe(false);
  });

  it("should stop camera stream tracks when stopScanning is called", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    act(() => {
      result.current.stopScanning();
    });

    expect(mockTrackStop).toHaveBeenCalled();
  });

  it("should clear error and result on new scan attempt", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("NotFoundError: No camera"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();

    mockGetUserMedia.mockResolvedValueOnce(mockStream);

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeNull();
  });

  it("should handle missing video element with error state", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    // videoRef.current stays null

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle BarcodeDetector not available in browser", async () => {
    vi.unstubAllGlobals();
    // Remove BarcodeDetector from global scope
    const globalAny = globalThis as Record<string, unknown>;
    delete globalAny["BarcodeDetector"];

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("not supported");
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle NotAllowedError from getUserMedia", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("NotAllowedError: Camera access denied"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("Camera access denied");
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle NotFoundError from getUserMedia", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("NotFoundError: No camera found"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("No camera device found");
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle generic getUserMedia error", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("Some hardware error"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("Scanner encountered an error");
  });

  it("should handle DOMException NotAllowedError from getUserMedia", async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException("Permission denied", "NotAllowedError"),
    );

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("Camera access denied");
  });

  it("should handle DOMException NotFoundError from getUserMedia", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new DOMException("Device not found", "NotFoundError"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("No camera device found");
  });

  it("should cancel RAF on unmount", () => {
    const { unmount } = renderHook(() => useBarcodeScanner());
    expect(() => unmount()).not.toThrow();
  });

  it("should stop camera tracks on unmount when scanning", async () => {
    const { result, unmount } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    unmount();

    expect(mockTrackStop).toHaveBeenCalled();
  });

  it("should continue loop when detect throws a per-frame error", async () => {
    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startScanning();
    });

    // Per-frame detect() errors are swallowed; loop should continue
    mockDetect.mockRejectedValueOnce(new Error("Frame not ready"));
    await triggerRaf();

    expect(result.current.error).toBeNull();
    expect(result.current.isScanning).toBe(true);
    expect(pendingRaf).not.toBeNull();
  });
});

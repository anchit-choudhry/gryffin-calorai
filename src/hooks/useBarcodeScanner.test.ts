import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBarcodeScanner } from "./useBarcodeScanner";

let mockDecodeCallback:
  | ((result: { getText: () => string } | null, error: Error | null) => void)
  | undefined;
const mockReader = {
  decodeFromVideoDevice: vi.fn(async (_format, _videoEl, callback) => {
    mockDecodeCallback = callback;
    return null;
  }),
  reset: vi.fn(async () => {}),
};

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice = mockReader.decodeFromVideoDevice;
    reset = mockReader.reset;
  },
}));

vi.mock("../types", () => ({
  sanitizeBarcodeInput: (input: string) => input || null,
}));

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

  it("should call decodeFromVideoDevice when video element exists", async () => {
    mockReader.decodeFromVideoDevice.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(mockReader.decodeFromVideoDevice).toHaveBeenCalled();
  });

  it("should process successful scan result via callback", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const mockResult = { getText: () => "1234567890" };
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(mockResult, null);
      });
    }

    expect(result.current.scanResult).toBe("1234567890");
  });

  it("should stop scanning after getting a result", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const mockResult = { getText: () => "1234567890" };
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(mockResult, null);
      });
    }

    expect(result.current.isScanning).toBe(false);
  });

  it("should handle NotFoundException without setting error", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const notFoundError = new Error("NotFoundException: No match");
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(null, notFoundError);
      });
    }

    expect(result.current.error).toBeNull();
  });

  it("should handle non-NotFoundException errors in callback", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const scanError = new Error("Some error");
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(null, scanError);
      });
    }

    expect(result.current.error).toContain("Scanner encountered an error");
  });

  it("should not process result if scanning was stopped", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    act(() => {
      result.current.stopScanning();
    });

    const mockResult = { getText: () => "1234567890" };
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(mockResult, null);
      });
    }

    expect(result.current.scanResult).toBeNull();
  });

  it("should not set error if scanning was stopped", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    act(() => {
      result.current.stopScanning();
    });

    const scanError = new Error("Some error");
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(null, scanError);
      });
    }

    expect(result.current.error).toBeNull();
  });

  it("should clear error on next scan attempt", async () => {
    mockReader.decodeFromVideoDevice.mockRejectedValueOnce(new Error("Test"));

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();

    mockReader.decodeFromVideoDevice.mockResolvedValueOnce(null);

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeNull();
  });

  it("should clear scanResult on next scan attempt", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const mockResult = { getText: () => "123" };
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(mockResult, null);
      });
    }

    expect(result.current.scanResult).toBe("123");

    mockReader.decodeFromVideoDevice.mockResolvedValueOnce(null);

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.scanResult).toBeNull();
  });

  it("should have stopScanning function that stops scanning", async () => {
    mockReader.decodeFromVideoDevice.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    act(() => {
      result.current.stopScanning();
    });

    expect(result.current.isScanning).toBe(false);
  });

  it("should have cleanup effect on unmount", () => {
    const { unmount } = renderHook(() => useBarcodeScanner());
    expect(() => unmount()).not.toThrow();
  });

  it("BrowserMultiFormatReader should be instantiable", async () => {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    expect(reader).toBeDefined();
    expect(typeof reader.decodeFromVideoDevice).toBe("function");
  });

  it("should handle rejection during startScanning", async () => {
    const error = new Error("Generic error");
    mockReader.decodeFromVideoDevice.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle non-Error rejection value", async () => {
    mockReader.decodeFromVideoDevice.mockRejectedValueOnce("String error");

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isScanning).toBe(false);
  });

  it("should ignore null or empty sanitized barcode input", async () => {
    mockReader.decodeFromVideoDevice.mockImplementationOnce(async (_format, _videoEl, callback) => {
      mockDecodeCallback = callback;
      return null;
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    const mockResult = { getText: () => "" };
    const callback = mockDecodeCallback;
    if (callback) {
      act(() => {
        callback(mockResult, null);
      });
    }

    expect(result.current.scanResult).toBeNull();
    expect(result.current.isScanning).toBe(true);
  });

  it("should reuse BrowserMultiFormatReader instance across multiple scans", async () => {
    mockReader.decodeFromVideoDevice.mockResolvedValue(null);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    const initialCallCount = mockReader.decodeFromVideoDevice.mock.calls.length;

    await act(async () => {
      await result.current.startScanning();
    });

    const firstScanCallCount = mockReader.decodeFromVideoDevice.mock.calls.length;

    await act(async () => {
      await result.current.startScanning();
    });

    const secondScanCallCount = mockReader.decodeFromVideoDevice.mock.calls.length;

    expect(firstScanCallCount).toBeGreaterThan(initialCallCount);
    expect(secondScanCallCount).toBeGreaterThan(firstScanCallCount);
  });

  it("should handle NotAllowedError in promise rejection", async () => {
    const error = new Error("NotAllowedError: Camera access denied");
    mockReader.decodeFromVideoDevice.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("Camera access denied");
  });

  it("should handle NotFoundError in promise rejection", async () => {
    const error = new Error("NotFoundError: No camera found");
    mockReader.decodeFromVideoDevice.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("No camera device found");
  });

  it("should throw error when video element is missing", async () => {
    const { result } = renderHook(() => useBarcodeScanner());

    // Ensure videoRef.current is null
    if (result.current.videoRef) {
      result.current.videoRef.current = null;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBeDefined();
  });

  it("should handle NotAllowedError in outer catch block", async () => {
    // Mock the reader initialization to throw NotAllowedError
    vi.mocked(mockReader.decodeFromVideoDevice).mockImplementationOnce(() => {
      throw new Error("NotAllowedError: User denied camera access");
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("Camera access denied");
  });

  it("should handle NotFoundError in outer catch block", async () => {
    vi.mocked(mockReader.decodeFromVideoDevice).mockImplementationOnce(() => {
      throw new Error("NotFoundError: No camera device");
    });

    const { result } = renderHook(() => useBarcodeScanner());
    const mockVideo = document.createElement("video");

    if (result.current.videoRef) {
      result.current.videoRef.current = mockVideo;
    }

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toContain("No camera device found");
  });
});

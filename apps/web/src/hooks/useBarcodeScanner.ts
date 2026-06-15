import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { sanitizeBarcodeInput } from "../types";

const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "qr_code",
  "data_matrix",
] as const;

export const useBarcodeScanner = (): {
  videoRef: RefObject<HTMLVideoElement | null>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  isScanning: boolean;
  scanResult: string | null;
  error: string | null;
} => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanningRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScanResult(null);

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      if (typeof BarcodeDetector === "undefined") {
        throw new Error("BarcodeDetector API not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new BarcodeDetector({ formats: [...BARCODE_FORMATS] });

      scanningRef.current = true;
      setIsScanning(true);

      const scan = async (): Promise<void> => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          const [firstBarcode] = barcodes;
          if (firstBarcode && scanningRef.current) {
            const sanitized = sanitizeBarcodeInput(firstBarcode.rawValue);
            if (sanitized) {
              setScanResult(sanitized);
              stopScanning();
              return;
            }
          }
        } catch {
          // Per-frame detect() failures are expected (unsupported frame state); continue loop
        }

        if (scanningRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            void scan();
          });
        }
      };

      rafIdRef.current = requestAnimationFrame(() => {
        void scan();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start camera";
      if (
        (err instanceof DOMException && err.name === "NotAllowedError") ||
        message.includes("NotAllowedError")
      ) {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (
        (err instanceof DOMException && err.name === "NotFoundError") ||
        message.includes("NotFoundError")
      ) {
        setError("No camera device found.");
      } else if (
        (err instanceof DOMException && err.name === "OverconstrainedError") ||
        message.includes("OverconstrainedError")
      ) {
        setError("Rear camera could not satisfy constraints. Try a different device.");
      } else if (message.includes("BarcodeDetector API not supported")) {
        setError("Barcode scanning is not supported in this browser.");
      } else {
        setError("Scanner encountered an error. Please try again.");
      }
      setIsScanning(false);
      scanningRef.current = false;
    }
  }, [stopScanning]);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    startScanning,
    stopScanning,
    isScanning,
    scanResult,
    error,
  };
};

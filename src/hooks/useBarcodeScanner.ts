import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export const useBarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    try {
      setError(null);
      setScanResult(null);

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      setIsScanning(true);
      scanningRef.current = true;

      try {
        const result = await readerRef.current.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (result && scanningRef.current) {
              setScanResult(result.getText());
              stopScanning();
            }
            if (err && !(err as Error).message.includes("NotFoundException")) {
              if (scanningRef.current) {
                setError((err as Error).message);
              }
            }
          },
        );

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start scanning";
        if (message.includes("NotAllowedError")) {
          setError("Camera access denied. Please allow camera permissions.");
        } else if (message.includes("NotFoundError")) {
          setError("No camera device found.");
        } else {
          setError(message);
        }
        setIsScanning(false);
        scanningRef.current = false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start camera";
      if (message.includes("NotAllowedError")) {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (message.includes("NotFoundError")) {
        setError("No camera device found.");
      } else {
        setError(message);
      }
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      scanningRef.current = false;
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

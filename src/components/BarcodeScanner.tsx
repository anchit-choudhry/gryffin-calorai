import { useState } from "react";
import { toast } from "sonner";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { sanitizeBarcodeInput } from "../types";

interface BarcodeScannerProps {
  onBarcodeDetected?: (barcode: string) => void;
}

const BarcodeScanner = ({ onBarcodeDetected }: BarcodeScannerProps) => {
  const { videoRef, startScanning, stopScanning, isScanning, scanResult, error } =
    useBarcodeScanner();
  const [manualInput, setManualInput] = useState("");

  const handleStartScanning = async () => {
    await startScanning();
  };

  const handleUseBarcode = () => {
    if (scanResult && onBarcodeDetected) {
      onBarcodeDetected(scanResult);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeBarcodeInput(manualInput);
    if (!clean) {
      toast.error("Invalid barcode. Use printable ASCII characters only (max 100).");
      return;
    }
    onBarcodeDetected?.(clean);
    setManualInput("");
  };

  return (
    <div className="space-y-4">
      {error && <p className="font-mono text-[11px] text-persimmon">{error}</p>}

      {isScanning && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            className="w-full h-48 bg-ink border border-rule object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft text-center">
            Point camera at barcode
          </p>
          <button
            onClick={stopScanning}
            className="w-full py-2.5 border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {scanResult && !isScanning && (
        <div className="space-y-3">
          <div className="border border-rule p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">
              Detected
            </p>
            <p className="font-mono text-base text-persimmon break-all">{scanResult}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseBarcode}
              className="flex-1 py-2.5 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
            >
              Use This
            </button>
            <button
              onClick={handleStartScanning}
              className="flex-1 py-2.5 border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors"
            >
              Scan Again
            </button>
          </div>
        </div>
      )}

      {!isScanning && !scanResult && (
        <div className="space-y-3">
          <div className="w-full h-40 bg-paper-muted border border-rule flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Click to activate camera
            </span>
          </div>
          <button
            onClick={handleStartScanning}
            className="w-full py-2.5 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
          >
            Scan Barcode
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-rule" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft whitespace-nowrap">
              or enter manually
            </span>
            <div className="flex-1 border-t border-rule" />
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2 items-end">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter barcode number"
              aria-label="Manual barcode entry"
              className="flex-1 border-b border-rule bg-transparent font-mono text-sm text-ink focus:outline-none focus:border-persimmon pb-1 pt-1 placeholder:text-ink-soft/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Use
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;

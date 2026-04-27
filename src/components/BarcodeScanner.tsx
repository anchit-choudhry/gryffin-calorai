import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

interface BarcodeScannerProps {
  onBarcodeDetected?: (barcode: string) => void;
}

const BarcodeScanner = ({ onBarcodeDetected }: BarcodeScannerProps) => {
  const { videoRef, startScanning, stopScanning, isScanning, scanResult, error } =
    useBarcodeScanner();

  const handleStartScanning = async () => {
    await startScanning();
  };

  const handleUseBarcode = () => {
    if (scanResult && onBarcodeDetected) {
      onBarcodeDetected(scanResult);
    }
  };

  const handleScanAgain = async () => {
    await handleStartScanning();
  };

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md bg-white dark:bg-gray-800 space-y-4">
      <h3 className="text-xl font-semibold border-b dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-200">
        Barcode Scanner
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isScanning && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg object-cover border border-gray-300 dark:border-gray-600"
            style={{ transform: "scaleX(-1)" }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Point camera at barcode...
          </p>
          <button
            onClick={stopScanning}
            className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {scanResult && !isScanning && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Barcode detected:</p>
            <p className="font-mono text-lg text-green-700 dark:text-green-300 break-all">
              {scanResult}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseBarcode}
              className="flex-1 py-2 px-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition shadow-sm font-medium"
            >
              Use This
            </button>
            <button
              onClick={handleScanAgain}
              className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm font-medium"
            >
              Scan Again
            </button>
          </div>
        </div>
      )}

      {!isScanning && !scanResult && (
        <div className="space-y-3">
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Click to activate camera
            </span>
          </div>
          <button
            onClick={handleStartScanning}
            className="w-full py-2 px-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm font-medium"
          >
            Scan Barcode
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;

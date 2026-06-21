// Type declarations for the native BarcodeDetector Web API.
// Available in Chrome 83+, Safari 17.4+, Edge - not in TypeScript's lib.dom.d.ts yet.
// See: https://wicg.github.io/shape-detection-api/#barcode-detection-api

interface DetectedBarcode {
  readonly rawValue: string;
  readonly format: string;
  readonly boundingBox: DOMRectReadOnly;
  readonly cornerPoints: ReadonlyArray<DOMPointReadOnly>;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);

  static getSupportedFormats(): Promise<string[]>;

  detect(
    image:
      | HTMLVideoElement
      | HTMLCanvasElement
      | HTMLImageElement
      | ImageBitmap
      | ImageData
      | SVGImageElement,
  ): Promise<DetectedBarcode[]>;
}

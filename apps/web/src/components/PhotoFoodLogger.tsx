import { useCallback, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THUMBNAIL_WIDTH = 120;

function buildThumbnail(imageDataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = THUMBNAIL_WIDTH / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(mimeType, 0.7));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

interface Props {
  onPhotoReady?: (imageData: string, thumbnailData: string, mimeType: string) => void;
  className?: string;
}

const PhotoFoodLogger = ({ onPhotoReady, className }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== "string") return;
        setPreview(dataUrl);
        setAnalyzing(true);
        try {
          const thumbnail = await buildThumbnail(dataUrl, file.type);
          onPhotoReady?.(dataUrl, thumbnail, file.type);
        } catch {
          setError("Could not process the image. Please try another.");
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [onPhotoReady],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setAnalyzing(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Select or capture a food photo"
        onChange={handleInputChange}
        data-testid="photo-input"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Food photo preview"
            className="w-full aspect-square object-cover border border-rule"
          />
          {analyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/80">
              <div className="size-5 border-2 border-persimmon border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Analyzing...
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 size-7 flex items-center justify-center bg-paper border border-rule hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
            aria-label="Remove photo"
          >
            <X className="size-3.5 text-ink" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 border border-dashed border-rule p-8 text-center cursor-pointer transition-colors hover:border-ink hover:bg-paper-raised"
          role="button"
          tabIndex={0}
          aria-label="Upload or capture a food photo"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <Camera className="size-6 text-ink-soft/60" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Tap to photograph your meal
          </p>
        </div>
      )}

      {!preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-none border-rule font-mono text-[10px] uppercase tracking-[0.2em]"
        >
          <Camera className="size-3 mr-1.5" aria-hidden="true" />
          Open Camera
        </Button>
      )}

      {error && (
        <p role="alert" className="font-mono text-[10px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhotoFoodLogger;

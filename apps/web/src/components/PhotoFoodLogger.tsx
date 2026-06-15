import { useCallback, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "@/lib/utils";
import { useAppState } from "@/state/AppState";
import type { MealType } from "@/types";
import { MEAL_TYPES } from "@/types";

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

interface DraftEntry {
  imageData: string;
  thumbnailData: string;
  mimeType: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  mealType: MealType;
}

interface Props {
  onPhotoReady?: (imageData: string, thumbnailData: string, mimeType: string) => void;
  className?: string;
}

const PhotoFoodLogger = ({ onPhotoReady, className }: Props) => {
  const addFoodLog = useAppState((s) => s.addFoodLog);
  const userId = useAppState((s) => s.userId);
  const selectedDate = useAppState((s) => s.selectedDate);

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftEntry | null>(null);

  const handleFile = useCallback(async (file: File) => {
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
        setDraft({
          imageData: dataUrl,
          thumbnailData: thumbnail,
          mimeType: file.type,
          name: "",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          mealType: "Breakfast",
        });
      } catch {
        setError("Could not process the image. Please try another.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

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
    setDraft(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!draft || !userId) return;
    const calories = parseInt(draft.calories, 10);
    if (!draft.name.trim() || isNaN(calories) || calories <= 0) {
      setError("Food name and calories are required.");
      return;
    }
    try {
      await addFoodLog({
        name: draft.name.trim(),
        calories,
        servingSize: 1,
        protein: draft.protein !== "" ? parseFloat(draft.protein) || undefined : undefined,
        carbs: draft.carbs !== "" ? parseFloat(draft.carbs) || undefined : undefined,
        fat: draft.fat !== "" ? parseFloat(draft.fat) || undefined : undefined,
        dateLogged: selectedDate,
        userId,
        isFavorite: false,
        mealType: draft.mealType,
      });
      onPhotoReady?.(draft.imageData, draft.thumbnailData, draft.mimeType);
      toast("Food logged from photo");
      clearPreview();
    } catch {
      setError("Failed to log food. Please try again.");
    }
  }, [draft, userId, selectedDate, addFoodLog, onPhotoReady, clearPreview]);

  const updateDraft = useCallback(<K extends keyof DraftEntry>(field: K, value: DraftEntry[K]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : null));
    setError(null);
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

      {draft ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={draft.imageData}
              alt="Food photo preview"
              className="w-full aspect-square object-cover border border-rule"
            />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute top-2 right-2 size-7 flex items-center justify-center bg-paper border border-rule hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
              aria-label="Discard photo"
            >
              <X className="size-3.5 text-ink" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3">
            <p className={cn(LABEL_MONO_CLS, "text-persimmon")}>Confirm food entry</p>

            <div className="space-y-2">
              <label htmlFor="photo-food-name" className={LABEL_MONO_CLS}>
                Food name <span className="text-persimmon">*</span>
              </label>
              <Input
                id="photo-food-name"
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                placeholder="e.g. Grilled chicken breast"
                className={EDITORIAL_INPUT_CLS}
                autoFocus={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="photo-calories" className={LABEL_MONO_CLS}>
                  Calories <span className="text-persimmon">*</span>
                </label>
                <Input
                  id="photo-calories"
                  type="number"
                  min="0"
                  value={draft.calories}
                  onChange={(e) => updateDraft("calories", e.target.value)}
                  placeholder="0"
                  className={EDITORIAL_INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="photo-meal-type" className={LABEL_MONO_CLS}>
                  Meal
                </label>
                <select
                  id="photo-meal-type"
                  value={draft.mealType}
                  onChange={(e) => updateDraft("mealType", e.target.value as MealType)}
                  className={cn(
                    EDITORIAL_INPUT_CLS,
                    "h-9 w-full appearance-none bg-paper px-3 cursor-pointer",
                  )}
                >
                  {MEAL_TYPES.map((mt) => (
                    <option key={mt} value={mt}>
                      {mt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { field: "protein", label: "Protein (g)" },
                  { field: "carbs", label: "Carbs (g)" },
                  { field: "fat", label: "Fat (g)" },
                ] as const
              ).map(({ field, label }) => (
                <div key={field} className="space-y-1">
                  <label htmlFor={`photo-${field}`} className={LABEL_MONO_CLS}>
                    {label}
                  </label>
                  <Input
                    id={`photo-${field}`}
                    type="number"
                    min="0"
                    value={draft[field]}
                    onChange={(e) => updateDraft(field, e.target.value)}
                    placeholder="---"
                    className={EDITORIAL_INPUT_CLS}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              className="flex-1 rounded-none font-mono text-[10px] uppercase tracking-[0.15em]"
            >
              Log Food
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearPreview}
              className="rounded-none border-rule font-mono text-[10px] uppercase tracking-[0.15em]"
            >
              Discard
            </Button>
          </div>
        </div>
      ) : preview ? (
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

      {!preview && !draft && (
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

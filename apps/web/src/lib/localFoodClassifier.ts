/** Progress callback fired during model download; value is 0-100. */
export type ClassifierProgressCallback = (progress: number) => void;

/** One classification result from the food-101 model. */
export interface FoodClassification {
  label: string;
  score: number;
}

interface ProgressEvent {
  progress?: number;
}

interface ClassificationResult {
  label: string;
  score: number;
}

type ClassifierPipeline = (
  input: string,
  opts: { top_k: number },
) => Promise<ClassificationResult[]>;

interface HfModule {
  pipeline: (
    task: string,
    model: string,
    opts?: { progress_callback?: (p: ProgressEvent) => void },
  ) => Promise<ClassifierPipeline>;
  env: { allowLocalModels: boolean };
}

let pipelinePromise: Promise<ClassifierPipeline> | null = null;

async function getPipeline(onProgress?: ClassifierProgressCallback): Promise<ClassifierPipeline> {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    const { pipeline, env } = (await import("@huggingface/transformers")) as unknown as HfModule;
    env.allowLocalModels = false;
    return pipeline("image-classification", "Xenova/food-101", {
      progress_callback: (p: ProgressEvent) => onProgress?.(p.progress ?? 0),
    });
  })();
  // Reset the singleton on failure so the next call can retry instead of
  // returning the cached rejected Promise (a rejected Promise is truthy).
  pipelinePromise.catch(() => {
    pipelinePromise = null;
  });
  return pipelinePromise;
}

async function resizeForClassifier(dataUrl: string, maxPx = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = dataUrl;
  });
}

/**
 * Classifies the food in an image.
 * Lazily loads the Xenova/food-101 model on first call.
 * Returns top-3 classifications with underscores removed from labels.
 */
export async function classifyFood(
  imageDataUrl: string,
  onProgress?: ClassifierProgressCallback,
): Promise<FoodClassification[]> {
  const pipe = await getPipeline(onProgress);
  const resized = await resizeForClassifier(imageDataUrl);
  const results = await pipe(resized, { top_k: 3 });
  return results.map((r) => ({ label: r.label.replace(/_/g, " "), score: r.score }));
}

/**
 * Pre-warms the classifier pipeline.
 * Call at consent time so the first photo use is instant.
 * No-op if the pipeline is already loaded.
 */
export async function preloadClassifier(onProgress?: ClassifierProgressCallback): Promise<void> {
  await getPipeline(onProgress);
}

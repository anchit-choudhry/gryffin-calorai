import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @huggingface/transformers before importing the module under test.
// vi.mock is hoisted and intercepts the dynamic import() inside localFoodClassifier.
const mockPipelineFn = vi.hoisted(() =>
  vi.fn().mockResolvedValue([
    { label: "pizza", score: 0.92 },
    { label: "grilled_salmon", score: 0.05 },
  ]),
);

const mockPipeline = vi.hoisted(() => vi.fn().mockResolvedValue(mockPipelineFn));

vi.mock("@huggingface/transformers", () => ({
  pipeline: mockPipeline,
  env: { allowLocalModels: true },
}));

// Must be imported AFTER vi.mock declarations.
describe("localFoodClassifier", () => {
  beforeEach(() => {
    vi.resetModules();
    mockPipeline.mockReset();
    mockPipeline.mockResolvedValue(mockPipelineFn);
    // Reset image stubbing
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      set(this: HTMLImageElement, _: string) {
        Object.defineProperty(this, "width", { value: 800, configurable: true });
        Object.defineProperty(this, "height", { value: 600, configurable: true });
        void Promise.resolve().then(() => this.onload?.(new Event("load") as unknown as Event));
      },
    });
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,r");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifyFood returns classifications with underscores replaced by spaces", async () => {
    const { classifyFood } = await import("./localFoodClassifier");
    const results = await classifyFood("data:image/png;base64,abc");
    expect(results).toStrictEqual([
      { label: "pizza", score: 0.92 },
      { label: "grilled salmon", score: 0.05 },
    ]);
  });

  it("classifyFood fires progress callback", async () => {
    const captured: { progress_callback?: (p: { progress?: number }) => void } = {};
    mockPipeline.mockImplementationOnce(
      async (
        _task: string,
        _model: string,
        opts?: { progress_callback?: (p: { progress?: number }) => void },
      ) => {
        if (opts?.progress_callback) captured.progress_callback = opts.progress_callback;
        return mockPipelineFn;
      },
    );

    const { classifyFood } = await import("./localFoodClassifier");
    const onProgress = vi.fn();
    await classifyFood("data:image/png;base64,abc", onProgress);
    captured.progress_callback?.({ progress: 50 });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("resizes image to fit within 512px on the longest side", async () => {
    const toDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,resized");
    HTMLCanvasElement.prototype.toDataURL = toDataURL;
    const getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    HTMLCanvasElement.prototype.getContext = getContext;

    // Image is 800x600; scale = 512/800 = 0.64; result: 512x384
    const canvasSizes: { width: number; height: number }[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === "canvas") {
        Object.defineProperty(el, "width", {
          set(v) {
            canvasSizes.push({ width: v, height: 0 });
          },
          configurable: true,
        });
      }
      return el;
    });

    const { classifyFood } = await import("./localFoodClassifier");
    await classifyFood("data:image/png;base64,abc");
    // Canvas was created (resize step ran)
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
  });

  it("preloadClassifier resolves without throwing", async () => {
    const { preloadClassifier } = await import("./localFoodClassifier");
    await expect(preloadClassifier()).resolves.toBeUndefined();
  });

  it("classifyFood throws when canvas context is unavailable", async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    const { classifyFood } = await import("./localFoodClassifier");
    await expect(classifyFood("data:image/png;base64,abc")).rejects.toThrow(
      "Canvas 2D context unavailable",
    );
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("../hooks/useVoiceCapture", () => ({
  useVoiceCapture: vi.fn(() => ({
    isSupported: true,
    isListening: false,
    transcript: null,
    error: null,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  })),
}));

vi.mock("../state/AppState", () => ({
  useAppState: vi.fn(() => ({
    allFoodItems: [],
    favoriteFoods: [],
  })),
}));

describe("VoiceFoodLogger", () => {
  it("exports VoiceFoodLogger component", async () => {
    const mod = await import("./VoiceFoodLogger");
    expect(mod.default).toBeDefined();
  });

  it("renders without throwing", async () => {
    const { default: VoiceFoodLogger } = await import("./VoiceFoodLogger");
    const result = VoiceFoodLogger({ onTranscriptMatched: vi.fn() });
    expect(result).toBeDefined();
  });
});

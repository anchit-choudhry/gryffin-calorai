import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  (globalThis as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = class {
    lang = "en-US";
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onresult = null;
    onerror = null;
    onend = null;

    start() {}

    stop() {}

    abort() {}
  };
});

describe("useVoiceCapture", () => {
  it("exports useVoiceCapture function", async () => {
    const mod = await import("./useVoiceCapture");
    expect(mod.useVoiceCapture).toBeDefined();
    expect(typeof mod.useVoiceCapture).toBe("function");
  });

  it("SpeechRecognition mock can be instantiated", () => {
    const Ctor = (globalThis as unknown as { SpeechRecognition: new () => unknown })
      .SpeechRecognition;
    const instance = new Ctor();
    expect(instance).toBeDefined();
  });
});

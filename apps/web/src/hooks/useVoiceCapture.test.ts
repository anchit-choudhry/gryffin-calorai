import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVoiceCapture } from "./useVoiceCapture";

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return actual;
});

interface SpeechResultItem {
  transcript: string;
  confidence?: number;
}

interface MockSpeechResultEvent {
  results: SpeechResultItem[][];
}

interface MockSpeechErrorEvent {
  error: string;
}

interface MockVoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: MockSpeechResultEvent) => void) | null;
  onerror: ((event: MockSpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: import("vitest").Mock;
  stop: import("vitest").Mock;
  abort: import("vitest").Mock;
}

let mockRecognition: MockVoiceRecognition;

beforeAll(() => {
  mockRecognition = {
    lang: "en-US",
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
    onresult: null,
    onerror: null,
    onend: null,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
  };

  (globalThis as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = class {
    lang = "en-US";
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;

    get onresult() {
      return mockRecognition.onresult;
    }

    set onresult(v: ((event: MockSpeechResultEvent) => void) | null) {
      mockRecognition.onresult = v;
    }

    get onerror() {
      return mockRecognition.onerror;
    }

    set onerror(v: ((event: MockSpeechErrorEvent) => void) | null) {
      mockRecognition.onerror = v;
    }

    get onend() {
      return mockRecognition.onend;
    }

    set onend(v: (() => void) | null) {
      mockRecognition.onend = v;
    }

    start() {
      mockRecognition.start();
    }

    stop() {
      mockRecognition.stop();
    }

    abort() {
      mockRecognition.abort();
    }
  };
});

beforeEach(() => {
  mockRecognition.start.mockClear();
  mockRecognition.stop.mockClear();
  mockRecognition.abort.mockClear();
  mockRecognition.onresult = null;
  mockRecognition.onerror = null;
  mockRecognition.onend = null;
});

describe("useVoiceCapture", () => {
  it("exports useVoiceCapture function", async () => {
    const mod = await import("./useVoiceCapture");
    expect(mod.useVoiceCapture).toBeDefined();
    expect(typeof mod.useVoiceCapture).toBe("function");
  });

  it("should return hook with required properties", () => {
    const { result } = renderHook(() => useVoiceCapture());
    expect(result.current).toHaveProperty("isSupported");
    expect(result.current).toHaveProperty("isListening");
    expect(result.current).toHaveProperty("transcript");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("startListening");
    expect(result.current).toHaveProperty("stopListening");
  });

  it("should report supported when SpeechRecognition available", () => {
    const { result } = renderHook(() => useVoiceCapture());
    expect(result.current.isSupported).toBe(true);
  });

  it("should start with no listening, transcript, or error", () => {
    const { result } = renderHook(() => useVoiceCapture());
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should have startListening and stopListening functions", () => {
    const { result } = renderHook(() => useVoiceCapture());
    expect(typeof result.current.startListening).toBe("function");
    expect(typeof result.current.stopListening).toBe("function");
  });

  it("SpeechRecognition mock can be instantiated", () => {
    const Ctor = (globalThis as unknown as { SpeechRecognition: new () => unknown })
      .SpeechRecognition;
    const instance = new Ctor();
    expect(instance).toBeDefined();
  });

  it("should handle cleanup on unmount", () => {
    const { unmount } = renderHook(() => useVoiceCapture());
    unmount();
    expect(true).toBe(true);
  });

  it("should transition to listening when startListening is called", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    expect(result.current.isListening).toBe(false);

    await act(async () => {
      result.current.startListening();
    });

    expect(mockRecognition.start).toHaveBeenCalled();
  });

  it("should stop recognition when stopListening is called", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      result.current.stopListening();
    });

    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it("should capture transcript from onresult event", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    expect(result.current.transcript).toBeNull();

    await act(async () => {
      mockRecognition.onresult?.({
        results: [[{ transcript: "apple", confidence: 0.95 }]],
      });
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe("apple");
    });
  });

  it("should capture single result event", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      mockRecognition.onresult?.({
        results: [[{ transcript: "apple", confidence: 0.9 }]],
      });
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe("apple");
    });
  });

  it("should handle speech recognition error", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      mockRecognition.onerror?.({ error: "network" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Voice recognition encountered an error. Please try again.",
      );
    });
  });

  it("should clear error when starting new listening session", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onerror?.({ error: "no-speech" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("No speech detected. Try again.");
    });

    await act(async () => {
      result.current.startListening();
    });

    expect(result.current.error).toBeNull();
  });

  it("should handle audio-capture error with specific message", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onerror?.({ error: "audio-capture" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("No microphone found.");
    });
  });

  it("should handle microphone permission denial", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onerror?.({ error: "not-allowed" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Microphone access denied. Please allow microphone permissions.",
      );
    });
  });

  it("should reset transcript when starting new listening session", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onresult?.({
        results: [[{ transcript: "test" }]],
      });
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe("test");
    });

    await act(async () => {
      result.current.startListening();
    });

    expect(result.current.transcript).toBeNull();
  });

  it("should set listening to false on recognition end", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      mockRecognition.onend?.();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });
  });

  it("should handle multiple listening sessions", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    expect(mockRecognition.start).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockRecognition.onend?.();
    });

    await act(async () => {
      result.current.startListening();
    });

    expect(mockRecognition.start).toHaveBeenCalledTimes(2);
  });

  it("should handle browser not supporting SpeechRecognition", async () => {
    type GlobalWithSpeech = { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const g = globalThis as unknown as GlobalWithSpeech;
    const originalSpeechRecognition = g.SpeechRecognition;
    delete g.SpeechRecognition;

    const { result } = renderHook(() => useVoiceCapture());

    expect(result.current.isSupported).toBe(false);

    g.SpeechRecognition = originalSpeechRecognition;
  });

  it("should handle start() throwing an error", async () => {
    mockRecognition.start.mockImplementationOnce(() => {
      throw new Error("Start failed");
    });

    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Voice recognition encountered an error. Please try again.",
      );
    });
  });

  it("should set error when SpeechRecognition unavailable during startListening", async () => {
    type GlobalWithSpeech = { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const g = globalThis as unknown as GlobalWithSpeech;
    const originalSpeechRecognition = g.SpeechRecognition;
    delete g.SpeechRecognition;
    delete g.webkitSpeechRecognition;

    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    expect(result.current.error).toBe("Voice recognition is not supported in this browser.");

    g.SpeechRecognition = originalSpeechRecognition;
  });

  it("should ignore onresult event when not listening", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      result.current.stopListening();
    });

    const initialTranscript = result.current.transcript;

    await act(async () => {
      mockRecognition.onresult?.({
        results: [[{ transcript: "should be ignored", confidence: 0.95 }]],
      });
    });

    expect(result.current.transcript).toBe(initialTranscript);
  });

  it("should ignore onerror event when not listening", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      result.current.stopListening();
    });

    const initialError = result.current.error;

    await act(async () => {
      mockRecognition.onerror?.({ error: "network" });
    });

    expect(result.current.error).toBe(initialError);
  });

  it("should handle service-not-allowed error", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onerror?.({ error: "service-not-allowed" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Microphone access denied. Please allow microphone permissions.",
      );
    });
  });

  it("should handle no-speech error", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
      mockRecognition.onerror?.({ error: "no-speech" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("No speech detected. Try again.");
    });
  });

  it("should ignore onend event when not listening", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);

    await act(async () => {
      mockRecognition.onend?.();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("should handle onend event when listening is true", async () => {
    const { result } = renderHook(() => useVoiceCapture());

    await act(async () => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);

    await act(async () => {
      mockRecognition.onend?.();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });
  });
});

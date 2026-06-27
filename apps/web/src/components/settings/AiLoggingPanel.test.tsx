import "fake-indexeddb/auto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiLoggingPanel } from "./AiLoggingPanel";
import { useAppState } from "@/state/AppState";

vi.mock("@/lib/localFoodClassifier", () => ({
  preloadClassifier: vi.fn().mockResolvedValue(undefined),
}));

function setupStore(
  overrides?: Partial<{
    aiEnabled: boolean;
    aiModelConsented: boolean;
    setAiEnabled: (enabled: boolean) => void;
    setAiModelConsented: () => void;
  }>,
) {
  useAppState.setState({
    aiEnabled: false,
    aiModelConsented: false,
    setAiEnabled: vi.fn(),
    setAiModelConsented: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  setupStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AiLoggingPanel - disabled state", () => {
  it("renders toggle in off state when aiEnabled is false", () => {
    render(<AiLoggingPanel />);
    const toggle = screen.getByRole("switch", { name: /toggle ai/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("does not show consent sheet when ai is off", () => {
    render(<AiLoggingPanel />);
    expect(screen.queryByText(/download & enable/i)).not.toBeInTheDocument();
  });
});

describe("AiLoggingPanel - consent flow", () => {
  it("shows consent sheet when toggle is switched on without consent", async () => {
    render(<AiLoggingPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /toggle ai/i }));
    });
    expect(screen.getByText(/download & enable/i)).toBeInTheDocument();
    expect(screen.getByText(/80 mb/i)).toBeInTheDocument();
  });

  it("Cancel closes consent sheet and does not call setAiEnabled", async () => {
    const setAiEnabled = vi.fn();
    setupStore({ setAiEnabled });
    render(<AiLoggingPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /toggle ai/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    });
    expect(screen.queryByText(/download & enable/i)).not.toBeInTheDocument();
    expect(setAiEnabled).not.toHaveBeenCalled();
  });

  it("Download & Enable calls setAiModelConsented and setAiEnabled(true)", async () => {
    const setAiEnabled = vi.fn();
    const setAiModelConsented = vi.fn();
    setupStore({ setAiEnabled, setAiModelConsented });
    render(<AiLoggingPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /toggle ai/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /download & enable/i }));
    });
    await waitFor(() => {
      expect(setAiModelConsented).toHaveBeenCalled();
      expect(setAiEnabled).toHaveBeenCalledWith(true);
    });
  });
});

describe("AiLoggingPanel - enabled state", () => {
  it("shows toggle in on state when aiEnabled is true", () => {
    setupStore({ aiEnabled: true, aiModelConsented: true });
    render(<AiLoggingPanel />);
    const toggle = screen.getByRole("switch", { name: /toggle ai/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("shows Model ready text when enabled and consented", () => {
    setupStore({ aiEnabled: true, aiModelConsented: true });
    render(<AiLoggingPanel />);
    expect(screen.getByText(/model ready/i)).toBeInTheDocument();
  });

  it("toggle off calls setAiEnabled(false)", async () => {
    const setAiEnabled = vi.fn();
    setupStore({ aiEnabled: true, aiModelConsented: true, setAiEnabled });
    render(<AiLoggingPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /toggle ai/i }));
    });
    expect(setAiEnabled).toHaveBeenCalledWith(false);
  });

  it("skips consent sheet when toggling on with existing consent", async () => {
    const setAiEnabled = vi.fn();
    setupStore({ aiEnabled: false, aiModelConsented: true, setAiEnabled });
    render(<AiLoggingPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /toggle ai/i }));
    });
    expect(setAiEnabled).toHaveBeenCalledWith(true);
    expect(screen.queryByText(/download & enable/i)).not.toBeInTheDocument();
  });
});

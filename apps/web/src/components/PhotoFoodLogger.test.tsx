import "fake-indexeddb/auto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotoFoodLogger from "./PhotoFoodLogger";
import { useAppState } from "@/state/AppState";
import { todayISO, UserId } from "@/types";
import type { RecognizedFoodItem } from "@/lib/aiLoggingApi";

vi.mock("@/lib/aiLoggingApi", () => ({
  recognizePhoto: vi.fn(),
}));

const TEST_USER = UserId("photo-test-user");

function makePngFile() {
  return new File(["pixels"], "meal.png", { type: "image/png" });
}

function makeTxtFile() {
  return new File(["text"], "notes.txt", { type: "text/plain" });
}

function stubImageLoading() {
  class FakeReader {
    result = "data:image/png;base64,pixels";
    onload: ((e: ProgressEvent<FileReader>) => void) | null = null;

    readAsDataURL(): void {
      void Promise.resolve().then(() =>
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>),
      );
    }
  }

  vi.stubGlobal("FileReader", FakeReader);
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,t");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true,
    set(this: HTMLImageElement, _: string) {
      Object.defineProperty(this, "width", { value: 200, configurable: true });
      Object.defineProperty(this, "height", { value: 150, configurable: true });
      void Promise.resolve().then(() => this.onload?.(new Event("load") as unknown as Event));
    },
  });
}

beforeEach(() => {
  useAppState.setState({
    userId: TEST_USER,
    selectedDate: todayISO(),
    addFoodLog: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PhotoFoodLogger", () => {
  it("renders the drag-zone placeholder and open camera button", () => {
    render(<PhotoFoodLogger />);
    expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open camera/i })).toBeInTheDocument();
  });

  it("shows error when a non-image file is selected", async () => {
    render(<PhotoFoodLogger />);
    const input = screen.getByTestId("photo-input");

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeTxtFile()] } });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/image file/i);
  });

  it("clicking drag zone triggers file input click", () => {
    render(<PhotoFoodLogger />);
    const spy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /upload or capture/i }));
    expect(spy).toHaveBeenCalled();
  });

  it("open camera button triggers file input click", () => {
    render(<PhotoFoodLogger />);
    const spy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /open camera/i }));
    expect(spy).toHaveBeenCalled();
  });

  it("drag-and-drop of a non-image file shows error", async () => {
    render(<PhotoFoodLogger />);
    const dragZone = screen.getByRole("button", { name: /upload or capture/i });

    await act(async () => {
      fireEvent.drop(dragZone, {
        dataTransfer: { files: [makeTxtFile()] },
      });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/image file/i);
  });

  it("pressing Enter on drag zone triggers file input click", () => {
    render(<PhotoFoodLogger />);
    const spy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.keyDown(screen.getByRole("button", { name: /upload or capture/i }), {
      key: "Enter",
    });
    expect(spy).toHaveBeenCalled();
  });

  it("shows confirmation form after valid image is loaded", async () => {
    stubImageLoading();
    render(<PhotoFoodLogger />);
    const input = screen.getByTestId("photo-input");

    await act(async () => {
      fireEvent.change(input, { target: { files: [makePngFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/confirm food entry/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/food name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
    // Open camera button is hidden when form is shown
    expect(screen.queryByRole("button", { name: /open camera/i })).toBeNull();
  });

  it("discard button in confirmation form resets back to drag zone", async () => {
    stubImageLoading();
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByText(/confirm food entry/i));

    // Use exact text to avoid matching aria-label="Discard photo" on the X button
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when Log Food is clicked with empty name", async () => {
    stubImageLoading();
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByText(/confirm food entry/i));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log food/i }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/name and calories are required/i);
  });

  it("calls addFoodLog and onPhotoReady when valid form is submitted", async () => {
    stubImageLoading();
    const mockOnPhotoReady = vi.fn();
    const mockAddFoodLog = vi.fn().mockResolvedValue(undefined);
    useAppState.setState({ addFoodLog: mockAddFoodLog });

    render(<PhotoFoodLogger onPhotoReady={mockOnPhotoReady} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByText(/confirm food entry/i));

    fireEvent.change(screen.getByLabelText(/food name/i), {
      target: { value: "Grilled Chicken" },
    });
    fireEvent.change(screen.getByLabelText(/calories/i), { target: { value: "350" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log food/i }));
    });

    await waitFor(() => {
      expect(mockAddFoodLog).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Grilled Chicken",
          calories: 350,
          mealType: "Breakfast",
        }),
      );
      expect(mockOnPhotoReady).toHaveBeenCalled();
    });
  });

  it("resets to drag zone after successful food log", async () => {
    stubImageLoading();
    const mockAddFoodLog = vi.fn().mockResolvedValue(undefined);
    useAppState.setState({ addFoodLog: mockAddFoodLog });

    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByText(/confirm food entry/i));

    fireEvent.change(screen.getByLabelText(/food name/i), { target: { value: "Apple" } });
    fireEvent.change(screen.getByLabelText(/calories/i), { target: { value: "95" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log food/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    });
  });
});

describe("PhotoFoodLogger AI path (aiEnabled=true)", () => {
  const AI_ITEM: RecognizedFoodItem = {
    name: "Margherita Pizza",
    confidence: 0.87,
    source: "off_match",
    offProductId: "001",
    calories: 250,
    protein: 11,
    carbs: 33,
    fat: 8,
  };

  beforeEach(async () => {
    stubImageLoading();
    useAppState.setState({
      userId: TEST_USER,
      selectedDate: todayISO(),
      addFoodLog: vi.fn().mockResolvedValue(undefined),
      aiEnabled: true,
    });
    const { recognizePhoto } = await import("@/lib/aiLoggingApi");
    vi.mocked(recognizePhoto).mockResolvedValue([AI_ITEM]);
  });

  it("calls recognizePhoto when aiEnabled=true and a file is selected", async () => {
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    const { recognizePhoto } = await import("@/lib/aiLoggingApi");
    await waitFor(() => expect(vi.mocked(recognizePhoto)).toHaveBeenCalled());
  });

  it("shows FoodReviewRow items when recognizePhoto returns results", async () => {
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Margherita Pizza")).toBeInTheDocument();
    });
  });

  it("shows blank manual form and does NOT call recognizePhoto when aiEnabled=false", async () => {
    useAppState.setState({ aiEnabled: false });
    const { recognizePhoto } = await import("@/lib/aiLoggingApi");
    vi.mocked(recognizePhoto).mockClear();

    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/confirm food entry/i)).toBeInTheDocument();
    });
    expect(vi.mocked(recognizePhoto)).not.toHaveBeenCalled();
  });

  it("shows blank manual form when recognizePhoto returns empty array", async () => {
    const { recognizePhoto } = await import("@/lib/aiLoggingApi");
    vi.mocked(recognizePhoto).mockResolvedValue([]);

    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/confirm food entry/i)).toBeInTheDocument();
    });
  });

  it("resets to drag zone after last item is logged", async () => {
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByDisplayValue("Margherita Pizza"));

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/calories/i), { target: { value: "250" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log this food/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    });
  });

  it("resets to drag zone when last item is removed via Discard all", async () => {
    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByText(/review detected foods/i));

    fireEvent.click(screen.getByRole("button", { name: /discard all/i }));

    await waitFor(() => {
      expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    });
  });

  it("keeps review list when one of multiple items is removed individually", async () => {
    const SECOND_ITEM: RecognizedFoodItem = {
      name: "Caesar Salad",
      confidence: 0.75,
      source: "estimate",
    };
    const { recognizePhoto } = await import("@/lib/aiLoggingApi");
    vi.mocked(recognizePhoto).mockResolvedValue([AI_ITEM, SECOND_ITEM]);

    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByDisplayValue("Margherita Pizza"));
    expect(screen.getByDisplayValue("Caesar Salad")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]!);

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Margherita Pizza")).toBeNull();
      expect(screen.getByDisplayValue("Caesar Salad")).toBeInTheDocument();
    });
  });
});

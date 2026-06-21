import "fake-indexeddb/auto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotoFoodLogger from "./PhotoFoodLogger";
import { useAppState } from "@/state/AppState";
import { todayISO, UserId } from "@/types";

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

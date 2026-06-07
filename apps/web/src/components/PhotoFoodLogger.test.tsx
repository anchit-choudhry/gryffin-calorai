import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import PhotoFoodLogger from "./PhotoFoodLogger";

afterEach(() => {
  vi.restoreAllMocks();
});

function makePngFile() {
  return new File(["pixels"], "meal.png", { type: "image/png" });
}

function makeTxtFile() {
  return new File(["text"], "notes.txt", { type: "text/plain" });
}

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

  it("shows preview and removes open camera button after valid image selected", async () => {
    // Use a FileReader that synchronously calls onload with a fake data URL
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

    // Stub canvas so buildThumbnail resolves
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,t");

    // Stub Image src setter to auto-trigger onload
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      set(this: HTMLImageElement, _: string) {
        Object.defineProperty(this, "width", { value: 200, configurable: true });
        Object.defineProperty(this, "height", { value: 150, configurable: true });
        void Promise.resolve().then(() => this.onload?.(new Event("load") as unknown as Event));
      },
    });

    render(<PhotoFoodLogger />);
    const input = screen.getByTestId("photo-input");

    await act(async () => {
      fireEvent.change(input, { target: { files: [makePngFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByAltText("Food photo preview")).toBeInTheDocument();
    });

    // Open camera button is hidden when preview is shown
    expect(screen.queryByRole("button", { name: /open camera/i })).toBeNull();

    vi.unstubAllGlobals();
  });

  it("clear button resets the preview back to drag zone", async () => {
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

    render(<PhotoFoodLogger />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [makePngFile()] } });
    });

    await waitFor(() => screen.getByAltText("Food photo preview"));

    fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));
    await waitFor(() => {
      expect(screen.getByText(/tap to photograph/i)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});

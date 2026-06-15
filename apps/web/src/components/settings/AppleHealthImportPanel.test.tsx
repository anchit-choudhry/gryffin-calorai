import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppleHealthImportPanel } from "./AppleHealthImportPanel";
import type { UserId } from "@/types";

interface MockState {
  userId: UserId;
  fetchBodyMeasurements: ReturnType<typeof vi.fn>;
}

const mockFetchBodyMeasurements = vi.fn().mockResolvedValue(undefined);

const mockState: MockState = {
  userId: "test-user" as UserId,
  fetchBodyMeasurements: mockFetchBodyMeasurements,
};

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: MockState) => unknown) => selector(mockState),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/importers/appleHealth", () => ({
  parseAppleHealthExport: vi.fn(),
}));

vi.mock("@/db/dbService", () => ({
  addBodyMeasurement: vi.fn().mockResolvedValue(1),
  addStepLog: vi.fn().mockResolvedValue(1),
}));

const { parseAppleHealthExport } = await import("@/lib/importers/appleHealth");
const { addBodyMeasurement: addBodyMeasurementToDB, addStepLog: addStepLogToDB } =
  await import("@/db/dbService");
const { toast } = await import("sonner");

function makeZipFile(name = "export.zip"): File {
  return new File(["zip content"], name, { type: "application/zip" });
}

function simulateFileSelect(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [file], writable: false });
  fireEvent.change(input);
}

function makeResult(
  weights = 0,
  steps = 0,
  skipped = 0,
): ReturnType<typeof parseAppleHealthExport> {
  return {
    weightEntries: Array.from({ length: weights }, (_, i) => ({
      userId: "test-user" as UserId,
      measuredAt: `2026-01-0${i + 1}` as ReturnType<
        typeof parseAppleHealthExport
      >["weightEntries"][0]["measuredAt"],
      weight: 80 - i * 0.1,
    })),
    stepEntries: Array.from({ length: steps }, (_, i) => ({
      userId: "test-user" as UserId,
      steps: 8000 + i * 100,
      dateLogged: `2026-01-0${i + 1}` as ReturnType<
        typeof parseAppleHealthExport
      >["stepEntries"][0]["dateLogged"],
      loggedAt: new Date().toISOString(),
    })),
    skippedRecords: skipped,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(addBodyMeasurementToDB).mockResolvedValue(1 as never);
  vi.mocked(addStepLogToDB).mockResolvedValue(1 as never);
  mockFetchBodyMeasurements.mockResolvedValue(undefined);
});

describe("AppleHealthImportPanel", () => {
  it("renders the drop zone", () => {
    render(<AppleHealthImportPanel />);
    expect(
      screen.getByRole("button", { name: /select an apple health zip file/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/apple health/i).length).toBeGreaterThan(0);
  });

  it("shows detected counts after file selection", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(5, 7, 2));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => {
      expect(screen.getByText("Apple Health detected")).toBeInTheDocument();
    });
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows import button with total record count", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(3, 4, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /import 7 records/i })).toBeInTheDocument();
    });
  });

  it("hides import button when no records found", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(0, 0, 5));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => {
      expect(screen.getByText("Apple Health detected")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /import/i })).not.toBeInTheDocument();
  });

  it("calls db functions and shows success toast on confirm", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(2, 3, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => screen.getByRole("button", { name: /import 5 records/i }));
    fireEvent.click(screen.getByRole("button", { name: /import 5 records/i }));
    await waitFor(() => {
      expect(addBodyMeasurementToDB).toHaveBeenCalledTimes(2);
      expect(addStepLogToDB).toHaveBeenCalledTimes(3);
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("5 records"));
  });

  it("calls fetchBodyMeasurements after importing weight entries", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(2, 0, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => screen.getByRole("button", { name: /import 2 records/i }));
    fireEvent.click(screen.getByRole("button", { name: /import 2 records/i }));
    await waitFor(() => {
      expect(mockFetchBodyMeasurements).toHaveBeenCalled();
    });
  });

  it("skips fetchBodyMeasurements when only step entries are imported", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(0, 4, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => screen.getByRole("button", { name: /import 4 records/i }));
    fireEvent.click(screen.getByRole("button", { name: /import 4 records/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
    expect(mockFetchBodyMeasurements).not.toHaveBeenCalled();
  });

  it("shows error toast when db call throws", async () => {
    vi.mocked(addBodyMeasurementToDB).mockRejectedValue(new Error("DB error"));
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(1, 0, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => screen.getByRole("button", { name: /import 1 records/i }));
    fireEvent.click(screen.getByRole("button", { name: /import 1 records/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Import failed"));
    });
  });

  it("shows error toast and does not parse when file exceeds 200 MB", async () => {
    render(<AppleHealthImportPanel />);
    const oversized = new File(["x"], "export.zip", { type: "application/zip" });
    Object.defineProperty(oversized, "size", { value: 200 * 1024 * 1024 + 1 });
    simulateFileSelect(oversized);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("too large"));
    });
    expect(parseAppleHealthExport).not.toHaveBeenCalled();
  });

  it("resets to drop zone when cancel is clicked", async () => {
    vi.mocked(parseAppleHealthExport).mockReturnValue(makeResult(2, 2, 0));
    render(<AppleHealthImportPanel />);
    simulateFileSelect(makeZipFile());
    await waitFor(() => screen.getByRole("button", { name: /cancel/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /select an apple health zip file/i }),
      ).toBeInTheDocument();
    });
  });
});

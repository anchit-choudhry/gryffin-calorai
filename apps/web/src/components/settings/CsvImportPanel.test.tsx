import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CsvImportPanel } from "./CsvImportPanel";

import type { UserId } from "@/types";

interface MockState {
  addFoodLog: ReturnType<typeof vi.fn>;
  userId: UserId;
}

const mockAddFoodLog = vi.fn().mockResolvedValue(undefined);

const mockState: MockState = {
  addFoodLog: mockAddFoodLog,
  userId: "test-user" as UserId,
};

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: MockState) => unknown) => selector(mockState),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/importers", () => ({
  parseImportCsv: vi.fn(),
  FORMAT_LABELS: {},
}));

const { parseImportCsv } = await import("@/lib/importers");
const { toast } = await import("sonner");

function makeMfpResult(entryCount = 2) {
  return {
    format: "mfp" as const,
    entries: Array.from({ length: entryCount }, (_, i) => ({
      name: `Food ${i + 1}`,
      calories: 300 + i * 50,
      dateLogged: "2026-01-01",
      mealType: "Breakfast" as const,
    })),
    skippedRows: 1,
  };
}

function makeFile(content: string, name = "diary.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

function simulateFileSelect(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [file], writable: false });
  fireEvent.change(input);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAddFoodLog.mockResolvedValue(undefined);
});

describe("CsvImportPanel", () => {
  it("renders the drop zone and format label", () => {
    render(<CsvImportPanel />);
    expect(screen.getByRole("button", { name: /select a csv file/i })).toBeInTheDocument();
    expect(screen.getAllByText(/myfitnesspal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cronometer/i).length).toBeGreaterThan(0);
  });

  it("shows detected format and entry count after file selection", async () => {
    vi.mocked(parseImportCsv).mockReturnValue(makeMfpResult());
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("Date,Meal,...\n2026-01-01,Breakfast,..."));
    await waitFor(() => {
      expect(screen.getByText(/MyFitnessPal detected/i)).toBeInTheDocument();
    });
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows unrecognized format alert for unknown CSV", async () => {
    vi.mocked(parseImportCsv).mockReturnValue({
      format: "unknown",
      entries: [],
      skippedRows: 3,
    });
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("col1,col2\nval1,val2", "bad.csv"));
    await waitFor(() => {
      expect(screen.getByText(/unrecognized format/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/import \d+ entries/i)).not.toBeInTheDocument();
  });

  it("hides import button when entries is 0", async () => {
    vi.mocked(parseImportCsv).mockReturnValue({
      format: "mfp",
      entries: [],
      skippedRows: 5,
    });
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("Date,Meal,..."));
    await waitFor(() => {
      expect(screen.getByText(/MyFitnessPal detected/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /import \d/i })).not.toBeInTheDocument();
  });

  it("calls addFoodLog for each entry and shows success toast on confirm", async () => {
    vi.mocked(parseImportCsv).mockReturnValue(makeMfpResult(3));
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("mfp csv content"));
    await waitFor(() => screen.getByText(/import 3 entries/i));
    fireEvent.click(screen.getByRole("button", { name: /import 3 entries/i }));
    await waitFor(() => {
      expect(mockAddFoodLog).toHaveBeenCalledTimes(3);
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("3 entries"));
  });

  it("shows error toast when addFoodLog throws", async () => {
    mockAddFoodLog.mockRejectedValue(new Error("DB error"));
    vi.mocked(parseImportCsv).mockReturnValue(makeMfpResult(1));
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("mfp csv content"));
    await waitFor(() => screen.getByText(/import 1 entries/i));
    fireEvent.click(screen.getByRole("button", { name: /import 1 entries/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Import failed"));
    });
  });

  it("shows error toast and does not parse when file exceeds 50 MB", async () => {
    render(<CsvImportPanel />);
    const oversized = new File(["x"], "diary.csv", { type: "text/csv" });
    Object.defineProperty(oversized, "size", { value: 50 * 1024 * 1024 + 1 });
    simulateFileSelect(oversized);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("too large"));
    });
    expect(parseImportCsv).not.toHaveBeenCalled();
  });

  it("resets to drop zone when cancel is clicked", async () => {
    vi.mocked(parseImportCsv).mockReturnValue(makeMfpResult(2));
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("mfp csv content"));
    await waitFor(() => screen.getByText(/cancel/i));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /select a csv file/i })).toBeInTheDocument();
    });
  });

  it("maps nutrition fields to addFoodLog when present", async () => {
    vi.mocked(parseImportCsv).mockReturnValue({
      format: "cronometer",
      entries: [
        {
          name: "Oatmeal",
          calories: 300,
          dateLogged: "2026-01-01",
          protein: 10,
          carbs: 55,
          fat: 5,
          fiber: 4,
          sodium: 5,
          sugar: 12,
        },
      ],
      skippedRows: 0,
    });
    render(<CsvImportPanel />);
    simulateFileSelect(makeFile("cronometer csv"));
    await waitFor(() => screen.getByText(/import 1 entries/i));
    fireEvent.click(screen.getByRole("button", { name: /import 1 entries/i }));
    await waitFor(() => {
      expect(mockAddFoodLog).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Oatmeal",
          calories: 300,
          protein: 10,
          carbs: 55,
          fat: 5,
          nutritionData: expect.objectContaining({ fiber: 4, sodium: 5, sugar: 12 }),
        }),
      );
    });
  });
});

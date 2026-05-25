import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DataExportPanel from "./DataExportPanel";

const mockDownloadJSON = vi.hoisted(() => vi.fn());
const mockDownloadCSVZip = vi.hoisted(() => vi.fn());
const mockIsExporting = vi.hoisted(() => ({ value: false }));
const mockOpenFilePicker = vi.hoisted(() => vi.fn());
const mockConfirmImport = vi.hoisted(() => vi.fn());
const mockCancelImport = vi.hoisted(() => vi.fn());
const mockPendingPayload = vi.hoisted(() => ({ value: null as Record<string, unknown> | null }));
const mockConflicts = vi.hoisted(() => ({
  value: null as {
    foodItems: { incoming: number; existing: number };
    recipes: { incoming: number; existing: number };
    waterLogs: { incoming: number; existing: number };
    bodyMeasurements: { incoming: number; existing: number };
    stepLogs: { incoming: number; existing: number };
    activityLogs: { incoming: number; existing: number };
    fastingSessions: { incoming: number; existing: number };
  } | null,
}));

vi.mock("../hooks/useDataExport", () => ({
  useDataExport: () => ({
    downloadJSON: mockDownloadJSON,
    downloadCSVZip: mockDownloadCSVZip,
    isExporting: mockIsExporting.value,
  }),
}));

vi.mock("../hooks/useDataImport", () => ({
  useDataImport: () => ({
    fileInputRef: { current: null },
    openFilePicker: mockOpenFilePicker,
    handleFileChange: vi.fn(),
    confirmImport: mockConfirmImport,
    cancelImport: mockCancelImport,
    isImporting: false,
    pendingPayload: mockPendingPayload.value,
    conflicts: mockConflicts.value,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe("DataExportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsExporting.value = false;
    mockPendingPayload.value = null;
    mockConflicts.value = null;
  });

  it("renders JSON backup export button", () => {
    render(<DataExportPanel />);
    expect(screen.getByText("JSON Backup")).toBeTruthy();
  });

  it("renders CSV export button", () => {
    render(<DataExportPanel />);
    expect(screen.getByText(/csv tables/i)).toBeTruthy();
  });

  it("renders import button", () => {
    render(<DataExportPanel />);
    expect(screen.getByText("Import JSON Backup")).toBeTruthy();
  });

  it("renders data storage security notice", () => {
    render(<DataExportPanel />);
    expect(screen.getByText(/stored locally in your browser without encryption/i)).toBeTruthy();
  });

  it("calls openFilePicker when import button is clicked", () => {
    render(<DataExportPanel />);
    fireEvent.click(screen.getByText("Import JSON Backup"));
    expect(mockOpenFilePicker).toHaveBeenCalled();
  });

  it("clicking 'JSON Backup' calls downloadJSON", () => {
    render(<DataExportPanel />);
    fireEvent.click(screen.getByText("JSON Backup"));
    expect(mockDownloadJSON).toHaveBeenCalledOnce();
  });

  it("clicking CSV button calls downloadCSVZip", () => {
    render(<DataExportPanel />);
    fireEvent.click(screen.getByText(/csv tables/i));
    expect(mockDownloadCSVZip).toHaveBeenCalledOnce();
  });

  it("export buttons are disabled while isExporting is true", () => {
    mockIsExporting.value = true;
    render(<DataExportPanel />);
    const exportingBtns = screen.getAllByText("Exporting...");
    exportingBtns.forEach((btn) => {
      expect((btn.closest("button") as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("shows import confirmation dialog when pendingPayload is not null", () => {
    mockPendingPayload.value = { version: 1 };
    render(<DataExportPanel />);
    expect(screen.getByText("Confirm Import")).toBeTruthy();
  });

  it("dialog is not shown when pendingPayload is null", () => {
    render(<DataExportPanel />);
    expect(screen.queryByText("Confirm Import")).toBeNull();
  });

  it("clicking Import in the confirmation dialog calls confirmImport", () => {
    mockPendingPayload.value = { version: 1 };
    mockConflicts.value = {
      foodItems: { incoming: 1, existing: 0 },
      recipes: { incoming: 0, existing: 0 },
      waterLogs: { incoming: 0, existing: 0 },
      bodyMeasurements: { incoming: 0, existing: 0 },
      stepLogs: { incoming: 0, existing: 0 },
      activityLogs: { incoming: 0, existing: 0 },
      fastingSessions: { incoming: 0, existing: 0 },
    };
    render(<DataExportPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(mockConfirmImport).toHaveBeenCalledOnce();
  });
});

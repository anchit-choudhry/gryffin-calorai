import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DataExportPanel from "./DataExportPanel";

vi.mock("../hooks/useDataExport", () => ({
  useDataExport: () => ({
    downloadJSON: vi.fn(),
    downloadCSVZip: vi.fn(),
    isExporting: false,
  }),
}));

const mockOpenFilePicker = vi.fn();

vi.mock("../hooks/useDataImport", () => ({
  useDataImport: () => ({
    fileInputRef: { current: null },
    openFilePicker: mockOpenFilePicker,
    handleFileChange: vi.fn(),
    confirmImport: vi.fn(),
    cancelImport: vi.fn(),
    isImporting: false,
    pendingPayload: null,
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
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe("DataExportPanel", () => {
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
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DataImportConflictModal from "./DataImportConflictModal";
import type { ConflictSummary } from "../db/dbService";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
}));

const makeConflicts = (overrides?: Partial<ConflictSummary>): ConflictSummary => ({
  foodItems: { incoming: 5, existing: 10 },
  recipes: { incoming: 2, existing: 3 },
  waterLogs: { incoming: 7, existing: 14 },
  bodyMeasurements: { incoming: 1, existing: 2 },
  stepLogs: { incoming: 3, existing: 6 },
  activityLogs: { incoming: 4, existing: 8 },
  fastingSessions: { incoming: 0, existing: 1 },
  ...overrides,
});

describe("DataImportConflictModal", () => {
  it("renders nothing when open=false", () => {
    render(
      <DataImportConflictModal
        open={false}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("renders dialog when open=true", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("dialog")).toBeTruthy();
  });

  it("shows 'Confirm Import' title", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Confirm Import")).toBeTruthy();
  });

  it("shows table rows for tables with incoming > 0", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Food Items")).toBeTruthy();
    expect(screen.getByText("Recipes")).toBeTruthy();
    expect(screen.getByText("Water Logs")).toBeTruthy();
  });

  it("does not render a row for tables with incoming=0", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText("Fasting Sessions")).toBeNull();
  });

  it("shows +N indicator for incoming records", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts({ foodItems: { incoming: 5, existing: 10 } })}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("+5")).toBeTruthy();
  });

  it("shows existing count", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts({ foodItems: { incoming: 5, existing: 10 } })}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("10")).toBeTruthy();
  });

  it("shows 'no records' message when all incoming are zero", () => {
    const emptyConflicts: ConflictSummary = {
      foodItems: { incoming: 0, existing: 5 },
      recipes: { incoming: 0, existing: 2 },
      waterLogs: { incoming: 0, existing: 1 },
      bodyMeasurements: { incoming: 0, existing: 0 },
      stepLogs: { incoming: 0, existing: 0 },
      activityLogs: { incoming: 0, existing: 0 },
      fastingSessions: { incoming: 0, existing: 0 },
    };
    render(
      <DataImportConflictModal
        open={true}
        conflicts={emptyConflicts}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("The backup contains no records to import.")).toBeTruthy();
  });

  it("Import button is disabled when totalIncoming=0", () => {
    const emptyConflicts: ConflictSummary = {
      foodItems: { incoming: 0, existing: 5 },
      recipes: { incoming: 0, existing: 0 },
      waterLogs: { incoming: 0, existing: 0 },
      bodyMeasurements: { incoming: 0, existing: 0 },
      stepLogs: { incoming: 0, existing: 0 },
      activityLogs: { incoming: 0, existing: 0 },
      fastingSessions: { incoming: 0, existing: 0 },
    };
    render(
      <DataImportConflictModal
        open={true}
        conflicts={emptyConflicts}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const importBtn = screen.getByText("Import").closest("button");
    expect(importBtn?.disabled).toBe(true);
  });

  it("Import button is disabled while isImporting=true", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const importBtn = screen.getByText("Importing...").closest("button");
    expect(importBtn?.disabled).toBe(true);
  });

  it("calls onConfirm when Import button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Import"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <DataImportConflictModal
        open={true}
        conflicts={makeConflicts()}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders gracefully when conflicts=null", () => {
    render(
      <DataImportConflictModal
        open={true}
        conflicts={null}
        isImporting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("dialog")).toBeTruthy();
    expect(screen.getByText("The backup contains no records to import.")).toBeTruthy();
  });
});

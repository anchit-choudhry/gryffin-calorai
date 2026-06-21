import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import KeyboardShortcutsOverlay from "./KeyboardShortcutsOverlay";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: { startTour: () => void }) => unknown) =>
    selector({ startTour: vi.fn() }),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
};

describe("KeyboardShortcutsOverlay", () => {
  it("renders the title when open", () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);
    expect(screen.getByText("Keyboard Shortcuts")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(<KeyboardShortcutsOverlay open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the Cmd/Ctrl+K shortcut as 'Open command palette'", () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);
    expect(screen.getByText("Open command palette")).toBeTruthy();
  });

  it("shows the ? shortcut entry", () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);
    expect(screen.getByText("Show keyboard shortcuts")).toBeTruthy();
  });

  it("shows all shortcut entries", () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);
    expect(screen.getByText("Focus food logger")).toBeTruthy();
    expect(screen.getByText("Add 250 ml water")).toBeTruthy();
    expect(screen.getByText("Log steps")).toBeTruthy();
    expect(screen.getByText("Open barcode scanner")).toBeTruthy();
    expect(screen.getByText("Toggle dark mode")).toBeTruthy();
  });

  it("shows the replay tour button", () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);
    expect(screen.getByText("Replay product tour")).toBeTruthy();
  });

  it("clicking replay tour calls onClose", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Replay product tour"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QuickAddModal } from "./QuickAddModal";

const mockCloseQuickAdd = vi.fn();
let mockQuickAddOpen = false;

vi.mock("@/state/AppState", () => ({
  useAppState: (selector: (s: { quickAddOpen: boolean; closeQuickAdd: () => void }) => unknown) =>
    selector({ quickAddOpen: mockQuickAddOpen, closeQuickAdd: mockCloseQuickAdd }),
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      onClick,
      ...rest
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <div onClick={onClick} data-testid={(rest["data-testid"] as string) ?? undefined}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({
    children,
    onExitComplete,
  }: {
    children: React.ReactNode;
    onExitComplete?: () => void;
  }) => {
    // Fire onExitComplete immediately in tests so dialog.close() path is exercised.
    onExitComplete?.();
    return <>{children}</>;
  },
  useReducedMotion: () => false,
}));

describe("QuickAddModal", () => {
  beforeEach(() => {
    mockCloseQuickAdd.mockClear();
    mockQuickAddOpen = false;
    // jsdom does not implement showModal/close natively.
    // The showModal mock must set [open] so the dialog's children are visible
    // to the ARIA accessibility tree that @testing-library queries.
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    }) as typeof HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    }) as typeof HTMLDialogElement.prototype.close;
  });

  it("renders no action buttons when quickAddOpen is false", () => {
    render(<QuickAddModal onAction={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Log Food/i })).toBeNull();
  });

  it("renders all three action buttons when quickAddOpen is true", () => {
    mockQuickAddOpen = true;
    render(<QuickAddModal onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Log Food/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Scan Barcode/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Voice Log/i })).toBeTruthy();
  });

  it("close button calls closeQuickAdd", () => {
    mockQuickAddOpen = true;
    render(<QuickAddModal onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Close quick add" }));
    expect(mockCloseQuickAdd).toHaveBeenCalledOnce();
  });

  it("clicking backdrop calls closeQuickAdd", () => {
    mockQuickAddOpen = true;
    const { container } = render(<QuickAddModal onAction={vi.fn()} />);
    // The first motion.div is the backdrop (aria-hidden)
    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(mockCloseQuickAdd).toHaveBeenCalledOnce();
  });

  it("clicking 'Log Food' invokes onAction with 'write'", () => {
    mockQuickAddOpen = true;
    const onAction = vi.fn();
    render(<QuickAddModal onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /Log Food/i }));
    expect(onAction).toHaveBeenCalledWith("write");
  });

  it("clicking 'Scan Barcode' invokes onAction with 'scan'", () => {
    mockQuickAddOpen = true;
    const onAction = vi.fn();
    render(<QuickAddModal onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /Scan Barcode/i }));
    expect(onAction).toHaveBeenCalledWith("scan");
  });

  it("clicking 'Voice Log' invokes onAction with 'speak'", () => {
    mockQuickAddOpen = true;
    const onAction = vi.fn();
    render(<QuickAddModal onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /Voice Log/i }));
    expect(onAction).toHaveBeenCalledWith("speak");
  });

  it("calls dialog.showModal when quickAddOpen becomes true", () => {
    mockQuickAddOpen = true;
    render(<QuickAddModal onAction={vi.fn()} />);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  });

  it("dialog element has aria-label='Quick add'", () => {
    const { container } = render(<QuickAddModal onAction={vi.fn()} />);
    const dialog = container.querySelector("dialog");
    expect(dialog?.getAttribute("aria-label")).toBe("Quick add");
  });

  it("all action buttons have type='button'", () => {
    mockQuickAddOpen = true;
    render(<QuickAddModal onAction={vi.fn()} />);
    const actionBtns = [
      screen.getByRole("button", { name: /Log Food/i }),
      screen.getByRole("button", { name: /Scan Barcode/i }),
      screen.getByRole("button", { name: /Voice Log/i }),
    ];
    for (const btn of actionBtns) {
      expect(btn.getAttribute("type")).toBe("button");
    }
  });
});

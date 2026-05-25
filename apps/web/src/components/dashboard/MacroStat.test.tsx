import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MacroStat from "./MacroStat";

vi.mock("motion/react", () => ({
  motion: {
    span: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn() }),
  useTransform: (_val: unknown, fn: (v: number) => string) => fn(0),
  useReducedMotion: () => true,
}));

describe("MacroStat", () => {
  it("renders the label", () => {
    render(<MacroStat label="Protein" value={150} unit="g" />);
    expect(screen.getByText("Protein")).toBeTruthy();
  });

  it("renders standalone unit when no target is provided", () => {
    render(<MacroStat label="Protein" value={150} unit="g" />);
    expect(screen.getByText("g")).toBeTruthy();
  });

  it("does not render a progress bar when no target", () => {
    render(<MacroStat label="Protein" value={150} unit="g" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("renders target notation when target is provided", () => {
    render(<MacroStat label="Protein" value={150} unit="g" target={175} />);
    expect(screen.getByText(/\/\s*175g/)).toBeTruthy();
  });

  it("does not render standalone unit when target is provided", () => {
    render(<MacroStat label="Protein" value={150} unit="g" target={175} />);
    const unitSpans = screen.queryAllByText("g");
    expect(unitSpans).toHaveLength(0);
  });

  it("renders a progress bar when target is provided", () => {
    render(<MacroStat label="Protein" value={150} unit="g" target={175} />);
    expect(screen.getByRole("progressbar", { name: "Protein progress" })).toBeTruthy();
  });

  it("progress bar aria-valuenow reflects consumed vs target ratio", () => {
    render(<MacroStat label="Protein" value={100} unit="g" target={200} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });

  it("progress bar caps at 100 when value exceeds target", () => {
    render(<MacroStat label="Protein" value={300} unit="g" target={200} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
  });

  it("renders without unit when unit is not provided", () => {
    render(<MacroStat label="Steps" value={5000} />);
    expect(screen.getByText("Steps")).toBeTruthy();
  });

  it("renders with zero value", () => {
    render(<MacroStat label="Fat" value={0} unit="g" target={56} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
  });
});

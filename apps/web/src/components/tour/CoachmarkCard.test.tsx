import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CoachmarkCard from "./CoachmarkCard";
import type { TourStep } from "./tourSteps";

const baseStep: TourStep = {
  id: "test-step",
  page: "dashboard",
  targetId: "test-target",
  title: "Test Title",
  body: "Test body text.",
};

const defaultProps = {
  step: baseStep,
  stepIndex: 1,
  totalSteps: 8,
  style: {},
  onNext: vi.fn(),
  onPrev: vi.fn(),
  onSkip: vi.fn(),
  isLast: false,
  isFirst: false,
  reducedMotion: true,
};

describe("CoachmarkCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders the step title for a non-first step", () => {
    render(<CoachmarkCard {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeDefined();
  });

  it("renders 'Welcome to your field journal' as title when isFirst=true", () => {
    render(<CoachmarkCard {...defaultProps} isFirst={true} />);
    expect(screen.getByText("Welcome to your field journal")).toBeDefined();
  });

  it("renders step body for a non-first step", () => {
    render(<CoachmarkCard {...defaultProps} />);
    expect(screen.getByText("Test body text.")).toBeDefined();
  });

  it("appends 'Take 90 seconds...' to body when isFirst=true", () => {
    render(<CoachmarkCard {...defaultProps} isFirst={true} />);
    expect(screen.getByText(/Take 90 seconds to see the highlights/)).toBeDefined();
  });

  it("step body does not include 'Take 90 seconds...' for non-first step", () => {
    render(<CoachmarkCard {...defaultProps} />);
    expect(screen.queryByText(/Take 90 seconds/)).toBeNull();
  });

  it("shows roman numeral folio in running head", () => {
    render(<CoachmarkCard {...defaultProps} stepIndex={2} totalSteps={8} />);
    const running = screen.getByText(/III/);
    expect(running.textContent).toContain("VIII");
  });

  it("shows I for first step in folio", () => {
    render(<CoachmarkCard {...defaultProps} stepIndex={0} totalSteps={5} />);
    expect(screen.getByText(/I.*V/)).toBeDefined();
  });

  it("shows 'Field Journal' in the running head", () => {
    render(<CoachmarkCard {...defaultProps} />);
    expect(screen.getByText("Field Journal")).toBeDefined();
  });

  it("applies style prop to the dialog element", () => {
    render(<CoachmarkCard {...defaultProps} style={{ top: "100px", left: "50px" }} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.top).toBe("100px");
    expect(dialog.style.left).toBe("50px");
  });

  // --- isFirst prop (back button visibility) ---

  it("does not render back button when isFirst=true", () => {
    render(<CoachmarkCard {...defaultProps} isFirst={true} />);
    expect(screen.queryByRole("button", { name: /previous step/i })).toBeNull();
  });

  it("renders back button when isFirst=false", () => {
    render(<CoachmarkCard {...defaultProps} isFirst={false} />);
    expect(screen.getByRole("button", { name: /previous step/i })).toBeDefined();
  });

  // --- isLast prop (Next/Done button label and text) ---

  it("shows 'Next' button text when isLast=false", () => {
    render(<CoachmarkCard {...defaultProps} isLast={false} />);
    expect(screen.getByText("Next")).toBeDefined();
  });

  it("shows 'Done' button text when isLast=true", () => {
    render(<CoachmarkCard {...defaultProps} isLast={true} />);
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("next button has aria-label 'Next step' when isLast=false", () => {
    render(<CoachmarkCard {...defaultProps} isLast={false} />);
    expect(screen.getByRole("button", { name: /next step/i })).toBeDefined();
  });

  it("next button has aria-label 'Finish tour' when isLast=true", () => {
    render(<CoachmarkCard {...defaultProps} isLast={true} />);
    expect(screen.getByRole("button", { name: /finish tour/i })).toBeDefined();
  });

  it("does not render ChevronRight icon when isLast=true", () => {
    render(<CoachmarkCard {...defaultProps} isLast={true} />);
    // lucide ChevronRight renders an svg; the Done button should have no svg child
    const doneBtn = screen.getByRole("button", { name: /finish tour/i });
    expect(doneBtn.querySelector("svg")).toBeNull();
  });

  it("renders ChevronRight icon when isLast=false", () => {
    render(<CoachmarkCard {...defaultProps} isLast={false} />);
    const nextBtn = screen.getByRole("button", { name: /next step/i });
    expect(nextBtn.querySelector("svg")).not.toBeNull();
  });

  // --- Click handlers ---

  it("clicking Next button calls onNext", () => {
    const onNext = vi.fn();
    render(<CoachmarkCard {...defaultProps} onNext={onNext} isLast={false} />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("clicking Done button calls onNext", () => {
    const onNext = vi.fn();
    render(<CoachmarkCard {...defaultProps} onNext={onNext} isLast={true} />);
    fireEvent.click(screen.getByRole("button", { name: /finish tour/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("clicking Previous button calls onPrev", () => {
    const onPrev = vi.fn();
    render(<CoachmarkCard {...defaultProps} onPrev={onPrev} isFirst={false} />);
    fireEvent.click(screen.getByRole("button", { name: /previous step/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("clicking X button calls onSkip", () => {
    const onSkip = vi.fn();
    render(<CoachmarkCard {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("clicking 'Close' footer button calls onSkip", () => {
    const onSkip = vi.fn();
    render(<CoachmarkCard {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  // --- Keyboard handlers ---

  it("ArrowRight key calls onNext", () => {
    const onNext = vi.fn();
    render(<CoachmarkCard {...defaultProps} onNext={onNext} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("ArrowRight key prevents default", () => {
    render(<CoachmarkCard {...defaultProps} />);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    screen.getByRole("dialog").dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("ArrowLeft key calls onPrev when isFirst=false", () => {
    const onPrev = vi.fn();
    render(<CoachmarkCard {...defaultProps} onPrev={onPrev} isFirst={false} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("ArrowLeft key does NOT call onPrev when isFirst=true", () => {
    const onPrev = vi.fn();
    render(<CoachmarkCard {...defaultProps} onPrev={onPrev} isFirst={true} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("Escape key calls onSkip", () => {
    const onSkip = vi.fn();
    render(<CoachmarkCard {...defaultProps} onSkip={onSkip} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("Escape key prevents default", () => {
    render(<CoachmarkCard {...defaultProps} />);
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    screen.getByRole("dialog").dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("ArrowLeft key prevents default when isFirst=false", () => {
    render(<CoachmarkCard {...defaultProps} isFirst={false} />);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    screen.getByRole("dialog").dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("unhandled key does not call any handler", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onSkip = vi.fn();
    render(<CoachmarkCard {...defaultProps} onNext={onNext} onPrev={onPrev} onSkip={onSkip} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();
  });

  // --- reducedMotion prop ---

  it("renders without error when reducedMotion=true", () => {
    const { container } = render(<CoachmarkCard {...defaultProps} reducedMotion={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders without error when reducedMotion=false", () => {
    const { container } = render(<CoachmarkCard {...defaultProps} reducedMotion={false} />);
    expect(container.firstChild).not.toBeNull();
  });

  // --- Accessibility ---

  it("has dialog role with aria-modal=true", () => {
    render(<CoachmarkCard {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("has aria-labelledby pointing to the title element", () => {
    render(<CoachmarkCard {...defaultProps} stepIndex={2} />);
    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBe("tour-step-title-2");
    expect(document.getElementById(labelId!)).not.toBeNull();
  });

  it("has aria-describedby pointing to the body element", () => {
    render(<CoachmarkCard {...defaultProps} stepIndex={2} />);
    const dialog = screen.getByRole("dialog");
    const descId = dialog.getAttribute("aria-describedby");
    expect(descId).toBe("tour-step-body-2");
    expect(document.getElementById(descId!)).not.toBeNull();
  });

  it("aria-live region contains the step announcement text", () => {
    render(<CoachmarkCard {...defaultProps} stepIndex={1} totalSteps={8} />);
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.textContent).toContain("Step 2 of 8");
    expect(liveRegion!.textContent).toContain("Test Title");
    expect(liveRegion!.textContent).toContain("Test body text.");
  });

  it("aria-live region is visually hidden with sr-only class", () => {
    render(<CoachmarkCard {...defaultProps} />);
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion!.className).toContain("sr-only");
  });

  // --- Focus management ---

  it("next button receives focus on initial render", () => {
    render(<CoachmarkCard {...defaultProps} isLast={false} />);
    const nextBtn = screen.getByRole("button", { name: /next step/i });
    expect(document.activeElement).toBe(nextBtn);
  });

  it("done button receives focus on last step", () => {
    render(<CoachmarkCard {...defaultProps} isLast={true} />);
    const doneBtn = screen.getByRole("button", { name: /finish tour/i });
    expect(document.activeElement).toBe(doneBtn);
  });
});

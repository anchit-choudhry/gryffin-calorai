import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OnboardingBanner from "./OnboardingBanner";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

describe("OnboardingBanner", () => {
  it("renders the privacy-forward headline", () => {
    render(<OnboardingBanner onOpenModal={vi.fn()} />);
    expect(screen.getByText("Private food tracking, no account needed")).toBeTruthy();
  });

  it("renders the Calibrate goals button", () => {
    render(<OnboardingBanner onOpenModal={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Calibrate goals" })).toBeTruthy();
  });

  it("calls onOpenModal when Calibrate goals is clicked", () => {
    const onOpenModal = vi.fn();
    render(<OnboardingBanner onOpenModal={onOpenModal} />);
    fireEvent.click(screen.getByRole("button", { name: "Calibrate goals" }));
    expect(onOpenModal).toHaveBeenCalledOnce();
  });

  it("dismisses the banner when the dismiss button is clicked", () => {
    render(<OnboardingBanner onOpenModal={vi.fn()} />);
    expect(screen.getByText("Private food tracking, no account needed")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Private food tracking, no account needed")).toBeNull();
  });

  it("does not call onOpenModal when dismiss is clicked", () => {
    const onOpenModal = vi.fn();
    render(<OnboardingBanner onOpenModal={onOpenModal} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenModal).not.toHaveBeenCalled();
  });
});

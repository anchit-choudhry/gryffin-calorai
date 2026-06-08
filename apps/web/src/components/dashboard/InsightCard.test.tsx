import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightCard } from "./InsightCard";
import type { DashboardInsight } from "@/hooks/useDashboardInsights";

describe("InsightCard", () => {
  const onDismiss = vi.fn();

  const streak: DashboardInsight = { id: "streak", text: "7-day streak", subtext: "Keep logging" };
  const overGoal: DashboardInsight = {
    id: "over-goal",
    text: "Over your goal today",
    subtext: "100 kcal above",
  };

  it("renders the insight text", () => {
    render(<InsightCard insight={streak} onDismiss={onDismiss} />);
    expect(screen.getByText("7-day streak")).toBeTruthy();
  });

  it("renders subtext when provided", () => {
    render(<InsightCard insight={streak} onDismiss={onDismiss} />);
    expect(screen.getByText("Keep logging")).toBeTruthy();
  });

  it("renders dismiss button with accessible label", () => {
    render(<InsightCard insight={streak} onDismiss={onDismiss} />);
    expect(screen.getByRole("button", { name: /dismiss insight/i })).toBeTruthy();
  });

  it("calls onDismiss with insight id when button is clicked", () => {
    render(<InsightCard insight={streak} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));
    expect(onDismiss).toHaveBeenCalledWith("streak");
  });

  it("applies warning styles for over-goal insight", () => {
    const { container } = render(<InsightCard insight={overGoal} onDismiss={onDismiss} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("amber");
  });

  it("applies positive styles for streak insight", () => {
    const { container } = render(<InsightCard insight={streak} onDismiss={onDismiss} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("persimmon");
  });

  it("renders without subtext when not provided", () => {
    const noSub: DashboardInsight = { id: "consistency", text: "5 days on target this week" };
    render(<InsightCard insight={noSub} onDismiss={onDismiss} />);
    expect(screen.getByText("5 days on target this week")).toBeTruthy();
  });
});

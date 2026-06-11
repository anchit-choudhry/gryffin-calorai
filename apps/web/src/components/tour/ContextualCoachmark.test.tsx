import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContextualCoachmark } from "./ContextualCoachmark";
import { useAppState } from "@/state/AppState";

const mockMarkCoachmarkSeen = vi.hoisted(() => vi.fn<(id: string) => void>());
const mockUseAppState = vi.hoisted(() => vi.fn());

vi.mock("@/state/AppState", () => ({
  useAppState: mockUseAppState,
}));

type MockSlice = { seenCoachmarks: string[]; markCoachmarkSeen: (id: string) => void };

function setupState(seenCoachmarks: string[] = []): void {
  vi.mocked(useAppState).mockImplementation(((selector: (s: MockSlice) => unknown) =>
    selector({
      seenCoachmarks,
      markCoachmarkSeen: mockMarkCoachmarkSeen,
    })) as unknown as typeof useAppState);
}

describe("ContextualCoachmark", () => {
  beforeEach(() => {
    mockMarkCoachmarkSeen.mockReset();
    setupState();
  });

  it("renders a known coachmark id", () => {
    render(<ContextualCoachmark coachmarkId="food-logger" />);
    expect(screen.getByText("Log a meal three ways")).toBeTruthy();
  });

  it("returns null for an unknown coachmark id", () => {
    const { container } = render(<ContextualCoachmark coachmarkId="unknown-id" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when the coachmark has already been seen", () => {
    setupState(["food-logger"]);
    const { container } = render(<ContextualCoachmark coachmarkId="food-logger" />);
    expect(container.firstChild).toBeNull();
  });

  it("calls markCoachmarkSeen when dismiss button is clicked", () => {
    render(<ContextualCoachmark coachmarkId="water-tracker" />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    expect(mockMarkCoachmarkSeen).toHaveBeenCalledWith("water-tracker");
  });

  it("renders the coachmark body text", () => {
    render(<ContextualCoachmark coachmarkId="command-palette" />);
    expect(screen.getByText(/Cmd\+K/)).toBeTruthy();
  });
});

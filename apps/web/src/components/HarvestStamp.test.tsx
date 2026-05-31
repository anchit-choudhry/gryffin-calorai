import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HarvestStamp } from "./HarvestStamp";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

const mockDismiss = vi.fn();
const mockUseAppState = vi.hoisted(() =>
  vi.fn(() => ({ pendingAchievementId: null as string | null, dismissAchievement: mockDismiss })),
);

vi.mock("@/state/AppState", () => ({ useAppState: mockUseAppState }));

describe("HarvestStamp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockReturnValue({
      pendingAchievementId: null,
      dismissAchievement: mockDismiss,
    });
  });

  it("renders nothing when no pending achievement", () => {
    const { container } = render(<HarvestStamp />);
    expect(container.firstChild).toBeNull();
  });

  it("renders achievement modal when pendingAchievementId is set", () => {
    mockUseAppState.mockReturnValue({
      pendingAchievementId: "streak_3",
      dismissAchievement: mockDismiss,
    });
    render(<HarvestStamp />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Achievement Unlocked")).toBeTruthy();
  });

  it("calls dismissAchievement when dismiss button is clicked", () => {
    mockUseAppState.mockReturnValue({
      pendingAchievementId: "streak_3",
      dismissAchievement: mockDismiss,
    });
    render(<HarvestStamp />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });

  it("renders nothing for unknown achievement id", () => {
    mockUseAppState.mockReturnValue({
      pendingAchievementId: "non_existent_id",
      dismissAchievement: mockDismiss,
    });
    const { container } = render(<HarvestStamp />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

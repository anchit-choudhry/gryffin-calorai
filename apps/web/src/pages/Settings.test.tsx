import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import Settings from "./Settings";
import * as appState from "../state/AppState";
import { UserId } from "@/types";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => true));

vi.mock("../state/AppState");
vi.mock("motion/react", () => ({
  motion: {
    main: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <main {...props}>{children}</main>
    ),
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <section {...props}>{children}</section>
    ),
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <header {...props}>{children}</header>
    ),
  },
  useReducedMotion: () => mockUseReducedMotion(),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../lib/motionVariants", () => ({
  pageVariants: {},
  useSectionMotion: () => ({}),
}));
vi.mock("../components/settings/TdeeProfilePanel", () => ({
  default: () => <div data-testid="tdee-profile-panel">TdeeProfilePanel</div>,
}));
vi.mock("../components/settings/GoalSettings", () => ({
  default: () => <div data-testid="goal-settings">GoalSettings</div>,
}));
vi.mock("../components/DataExportPanel", () => ({
  default: () => <div data-testid="data-export-panel">DataExportPanel</div>,
}));
vi.mock("../components/dashboard/SectionHeader", () => ({
  default: ({ title }: { title: string }) => <h2>{title}</h2>,
}));
vi.mock("../components/DietProfileEditor", () => ({
  default: () => <div data-testid="diet-profile-editor">DietProfileEditor</div>,
}));
vi.mock("../components/RemindersSettings", () => ({
  default: () => <div data-testid="reminders-settings">RemindersSettings</div>,
}));

const setupMocks = () => {
  vi.mocked(appState).useAppState.mockReturnValue({
    userId: UserId("test-user"),
    waterGoalMl: 2000,
    setWaterGoalMl: vi.fn(),
    stepGoal: 10000,
    setStepGoal: vi.fn(),
    tdeeProfile: null,
    exportData: vi.fn(),
    importData: vi.fn(),
  } as unknown as ReturnType<typeof appState.useAppState>);
};

describe("Settings", () => {
  it("renders Profile, Diet, Goals, Reminders, Data, and About sections", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Diet")).toBeTruthy();
    expect(screen.getByText("Goals")).toBeTruthy();
    expect(screen.getByText("Reminders")).toBeTruthy();
    expect(screen.getByText("Data")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
  });

  it("renders DietProfileEditor component", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByTestId("diet-profile-editor")).toBeTruthy();
  });

  it("renders GoalSettings component", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByTestId("goal-settings")).toBeTruthy();
  });

  it("renders DataExportPanel component", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByTestId("data-export-panel")).toBeTruthy();
  });

  it("renders version string", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByText(/Version/)).toBeTruthy();
  });

  it("renders GitHub link", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    const link = screen.getByRole("link", { name: /View on GitHub/i });
    expect(link).toBeTruthy();
    expect(link).toHaveProperty("target", "_blank");
  });

  it("renders with motion variants when reduced motion is disabled", async () => {
    mockUseReducedMotion.mockReturnValue(false);
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByText("Settings")).toBeTruthy();
    mockUseReducedMotion.mockReturnValue(true);
  });
});

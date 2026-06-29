import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Settings from "./Settings";
import type { AppState } from "../state/AppState";
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <div {...props}>{children}</div>
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
vi.mock("../components/CloudSyncPanel", () => ({
  CloudSyncPanel: () => <div data-testid="cloud-sync-panel">CloudSyncPanel</div>,
}));
vi.mock("../hooks/useDataExport", () => ({
  useDataExport: () => ({ downloadJSON: vi.fn(), isExporting: false }),
}));
vi.mock("../lib/apiClient", () => ({
  isAuthenticated: vi.fn().mockReturnValue(false),
}));
vi.mock("@/db/dbService", () => ({
  db: { delete: vi.fn().mockResolvedValue(undefined) },
}));

const mockSetHapticsEnabled = vi.fn();
const mockSetAccentTheme = vi.fn();
const mockSetDensity = vi.fn();
const mockSetBroadsheet = vi.fn();

type MockState = {
  userId: ReturnType<typeof UserId>;
  waterGoalMl: number;
  setWaterGoalMl: ReturnType<typeof vi.fn>;
  stepGoal: number;
  setStepGoal: ReturnType<typeof vi.fn>;
  tdeeProfile: null;
  exportData: ReturnType<typeof vi.fn>;
  importData: ReturnType<typeof vi.fn>;
  density: string;
  setDensity: ReturnType<typeof vi.fn>;
  hapticsEnabled: boolean;
  setHapticsEnabled: ReturnType<typeof vi.fn>;
  accentTheme: string;
  setAccentTheme: ReturnType<typeof vi.fn>;
  broadsheet: boolean;
  setBroadsheet: ReturnType<typeof vi.fn>;
};

function makeMockState(overrides: Partial<MockState> = {}): MockState {
  return {
    userId: UserId("test-user"),
    waterGoalMl: 2000,
    setWaterGoalMl: vi.fn(),
    stepGoal: 10000,
    setStepGoal: vi.fn(),
    tdeeProfile: null,
    exportData: vi.fn(),
    importData: vi.fn(),
    density: "comfortable",
    setDensity: mockSetDensity,
    hapticsEnabled: false,
    setHapticsEnabled: mockSetHapticsEnabled,
    accentTheme: "persimmon",
    setAccentTheme: mockSetAccentTheme,
    broadsheet: false,
    setBroadsheet: mockSetBroadsheet,
    ...overrides,
  };
}

const setupMocks = (overrides: Partial<MockState> = {}) => {
  const mockState = makeMockState(overrides);
  vi.mocked(appState).useAppState.mockImplementation((selector: (s: AppState) => unknown) =>
    selector(mockState as unknown as AppState),
  );
};

describe("Settings", () => {
  it("renders Profile, Diet, Goals, Reminders, Data, and About sections", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByRole("heading", { name: "Profile" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Diet" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Goals" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Reminders" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Data" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();
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

  it("renders app version in colophon", async () => {
    setupMocks();
    await act(async () => {
      render(<Settings />);
    });
    expect(screen.getByText(/0\.21\.0/)).toBeTruthy();
    expect(screen.getByText("Field Journal - Colophon")).toBeTruthy();
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

  describe("haptics toggle", () => {
    it("renders a haptics toggle in the Display section", async () => {
      setupMocks();
      await act(async () => {
        render(<Settings />);
      });
      expect(screen.getByRole("switch", { name: /haptic/i })).toBeTruthy();
    });

    it("haptics toggle reflects hapticsEnabled false state", async () => {
      setupMocks({ hapticsEnabled: false });
      await act(async () => {
        render(<Settings />);
      });
      const toggle = screen.getByRole("switch", { name: /haptic/i });
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    it("haptics toggle reflects hapticsEnabled true state", async () => {
      setupMocks({ hapticsEnabled: true });
      await act(async () => {
        render(<Settings />);
      });
      const toggle = screen.getByRole("switch", { name: /haptic/i });
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("clicking haptics toggle calls setHapticsEnabled with toggled value", async () => {
      setupMocks({ hapticsEnabled: false });
      await act(async () => {
        render(<Settings />);
      });
      const toggle = screen.getByRole("switch", { name: /haptic/i });
      fireEvent.click(toggle);
      expect(mockSetHapticsEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe("accent theme picker", () => {
    it("renders accent theme picker with all 5 themes", async () => {
      setupMocks();
      await act(async () => {
        render(<Settings />);
      });
      expect(screen.getByRole("radiogroup", { name: /accent/i })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /persimmon/i })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /sage/i })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /indigo/i })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /amber/i })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /rose/i })).toBeTruthy();
    });

    it("active accent theme radio is checked", async () => {
      setupMocks({ accentTheme: "sage" });
      await act(async () => {
        render(<Settings />);
      });
      const sageBtn = screen.getByRole("radio", { name: /sage/i });
      expect(sageBtn).toHaveAttribute("aria-checked", "true");
    });

    it("clicking an accent theme calls setAccentTheme", async () => {
      setupMocks({ accentTheme: "persimmon" });
      await act(async () => {
        render(<Settings />);
      });
      fireEvent.click(screen.getByRole("radio", { name: /indigo/i }));
      expect(mockSetAccentTheme).toHaveBeenCalledWith("indigo");
    });
  });

  describe("broadsheet layout toggle", () => {
    function getLayoutGroup() {
      return screen.getByRole("radiogroup", { name: /dashboard layout/i });
    }

    it("renders Standard and Broadsheet radio buttons in the layout group", async () => {
      setupMocks({ broadsheet: false });
      await act(async () => {
        render(<Settings />);
      });
      const group = getLayoutGroup();
      expect(within(group).getByRole("radio", { name: /^standard$/i })).toBeTruthy();
      expect(within(group).getByRole("radio", { name: /^broadsheet$/i })).toBeTruthy();
    });

    it("Standard radio is checked when broadsheet is false", async () => {
      setupMocks({ broadsheet: false });
      await act(async () => {
        render(<Settings />);
      });
      const group = getLayoutGroup();
      expect(
        within(group)
          .getByRole("radio", { name: /^standard$/i })
          .getAttribute("aria-checked"),
      ).toBe("true");
      expect(
        within(group)
          .getByRole("radio", { name: /^broadsheet$/i })
          .getAttribute("aria-checked"),
      ).toBe("false");
    });

    it("Broadsheet radio is checked when broadsheet is true", async () => {
      setupMocks({ broadsheet: true });
      await act(async () => {
        render(<Settings />);
      });
      const group = getLayoutGroup();
      expect(
        within(group)
          .getByRole("radio", { name: /^broadsheet$/i })
          .getAttribute("aria-checked"),
      ).toBe("true");
      expect(
        within(group)
          .getByRole("radio", { name: /^standard$/i })
          .getAttribute("aria-checked"),
      ).toBe("false");
    });

    it("clicking Broadsheet calls setBroadsheet(true)", async () => {
      setupMocks({ broadsheet: false });
      await act(async () => {
        render(<Settings />);
      });
      fireEvent.click(within(getLayoutGroup()).getByRole("radio", { name: /^broadsheet$/i }));
      expect(mockSetBroadsheet).toHaveBeenCalledWith(true);
    });

    it("clicking Standard calls setBroadsheet(false)", async () => {
      setupMocks({ broadsheet: true });
      await act(async () => {
        render(<Settings />);
      });
      fireEvent.click(within(getLayoutGroup()).getByRole("radio", { name: /^standard$/i }));
      expect(mockSetBroadsheet).toHaveBeenCalledWith(false);
    });
  });

  describe("in-page search", () => {
    it("renders a search input", async () => {
      setupMocks();
      await act(async () => {
        render(<Settings />);
      });
      expect(screen.getByRole("searchbox")).toBeTruthy();
    });

    it("filters sections by search query", async () => {
      setupMocks();
      await act(async () => {
        render(<Settings />);
      });
      const searchInput = screen.getByRole("searchbox");
      fireEvent.change(searchInput, { target: { value: "profile" } });
      expect(screen.getByRole("heading", { name: "Profile" })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "About" })).toBeNull();
    });

    it("shows all sections when search is cleared", async () => {
      setupMocks();
      await act(async () => {
        render(<Settings />);
      });
      const searchInput = screen.getByRole("searchbox");
      fireEvent.change(searchInput, { target: { value: "data" } });
      fireEvent.change(searchInput, { target: { value: "" } });
      expect(screen.getByRole("heading", { name: "Profile" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();
    });
  });
});

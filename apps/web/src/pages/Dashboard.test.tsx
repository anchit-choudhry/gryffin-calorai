import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FoodItemId, ISODate, UserId } from "@/types";
import type { FoodItem } from "@/db/dbService";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");
vi.mock("sonner");
vi.mock("../db/dbService");

// Mock all heavy child components to isolate Dashboard.tsx behavior
vi.mock("../components/FoodLogger", () => ({ default: () => <div>FoodLogger</div> }));
vi.mock("../components/VoiceFoodLogger", () => ({ default: () => <div>VoiceFoodLogger</div> }));
vi.mock("../components/WaterTracker", () => ({ default: () => <div>WaterTracker</div> }));
vi.mock("../components/StepTracker", () => ({ default: () => <div>StepTracker</div> }));
vi.mock("../components/StreakCard", () => ({ default: () => <div>StreakCard</div> }));
vi.mock("../components/WeeklySummary", () => ({ default: () => <div>WeeklySummary</div> }));
vi.mock("../components/ActivityTracker", () => ({ default: () => <div>ActivityTracker</div> }));
vi.mock("../components/ActivityLogger", () => ({ default: () => <div>ActivityLogger</div> }));
vi.mock("../components/FastingTimer", () => ({ default: () => <div>FastingTimer</div> }));
vi.mock("../components/OnboardingBanner", () => ({
  default: ({ onOpenModal }: { onOpenModal: () => void }) => (
    <div>
      OnboardingBanner
      <button onClick={onOpenModal}>Open Onboarding</button>
    </div>
  ),
}));
vi.mock("../components/OnboardingModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div>
        OnboardingModal
        <button onClick={onClose}>Close Onboarding</button>
      </div>
    ) : null,
}));
vi.mock("../components/RecurringMeals", () => ({ default: () => <div>RecurringMeals</div> }));
vi.mock("../components/MealTemplates", () => ({ default: () => <div>MealTemplates</div> }));
vi.mock("../components/BarcodeScanner", () => ({ default: () => <div>BarcodeScanner</div> }));
vi.mock("../components/PageLoading", () => ({ default: () => <div>PageLoading</div> }));
vi.mock("../components/dashboard/DashboardHero", () => ({
  default: () => <div>DashboardHero</div>,
}));
vi.mock("../components/dashboard/SectionHeader", () => ({
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <h2>
      {title}
      {subtitle ? ` ${subtitle}` : ""}
    </h2>
  ),
}));
vi.mock("../components/dashboard/EditorialFrame", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/dashboard/LogEntry", () => ({
  default: ({
    log,
    onEdit,
    onDelete,
  }: {
    log: FoodItem;
    onEdit?: (log: FoodItem) => void;
    onDelete?: (id: FoodItem["id"]) => void;
  }) => (
    <li data-testid={`log-${log.id ?? 0}`}>
      {log.name}
      {onEdit && <button onClick={() => onEdit(log)}>Edit {log.name}</button>}
      {onDelete && <button onClick={() => onDelete(log.id!)}>Delete {log.name}</button>}
    </li>
  ),
}));

vi.mock("motion/react", () => ({
  motion: {
    main: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    section: ({ children, ...rest }: { children: React.ReactNode; [k: string]: unknown }) => (
      <section {...(rest["data-tour-id"] ? { "data-tour-id": String(rest["data-tour-id"]) } : {})}>
        {children}
      </section>
    ),
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
    onOpenChange,
  }: {
    open: boolean;
    children: React.ReactNode;
    onOpenChange?: (v: boolean) => void;
  }) =>
    open ? (
      <div role="dialog">
        {children}
        {onOpenChange && <button onClick={() => onOpenChange(false)}>Close dialog</button>}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const userId = UserId("u1");

const makeLog = (id: number, name: string, mealType: FoodItem["mealType"]): FoodItem => ({
  id: FoodItemId(id),
  name,
  calories: 300,
  servingSize: 1,
  protein: 10,
  carbs: 40,
  fat: 5,
  dateLogged: ISODate("2026-05-25"),
  userId,
  isFavorite: false,
  mealType,
});

const dailyLogs: FoodItem[] = [
  makeLog(1, "Oatmeal", "Breakfast"),
  makeLog(2, "Sandwich", "Lunch"),
  makeLog(3, "Apple", "Snacks"),
  makeLog(4, "Pasta", "Dinner"),
];

beforeEach(() => {
  vi.mocked(appState.useAppState).mockReturnValue({
    init: {
      status: "ready",
      user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
    },
    dailyLogs,
    deleteFoodLog: vi.fn(),
    favoriteFoods: [],
    toggleFavorite: vi.fn(),
    addFoodLog: vi.fn(),
    userId,
    allFoodItems: [],
    tdeeProfile: null,
  } as unknown as ReturnType<typeof appState.useAppState>);
});

describe("Dashboard log meal-type filter", () => {
  it("renders all meal-type filter buttons", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^breakfast$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^lunch$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^snacks$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^dinner$/i })).toBeInTheDocument();
  });

  it("shows all entries by default", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    expect(screen.getByText("Sandwich")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
  });

  it("filters to only breakfast entries when Breakfast is selected", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /^breakfast$/i }));
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    expect(screen.queryByText("Sandwich")).not.toBeInTheDocument();
    expect(screen.queryByText("Pasta")).not.toBeInTheDocument();
  });

  it("restores all entries when All is clicked after a filter", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /^breakfast$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    expect(screen.getByText("Sandwich")).toBeInTheDocument();
  });
});

describe("Dashboard init states", () => {
  it("shows nothing-logged message when dailyLogs is empty", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText(/nothing logged yet today/i)).toBeInTheDocument();
  });

  it("shows error message when init.status is error", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: { status: "error", message: "Failed to load data" },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });

  it("shows loading skeleton when init.status is loading", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: { status: "loading" },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    const { container } = render(<Dashboard />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows onboarding banner when user has not completed onboarding and no tdeeProfile", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: false, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText("OnboardingBanner")).toBeInTheDocument();
  });
});

describe("Dashboard quick-add sections", () => {
  it("shows Recently Logged section when allFoodItems is populated", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [makeLog(10, "Banana", "Snacks")],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText(/recently logged/i)).toBeInTheDocument();
    expect(screen.getByText(/banana/i)).toBeInTheDocument();
  });

  it("shows From the Pantry section when favoriteFoods is populated", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [makeLog(20, "Greek Yogurt", "Breakfast")],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    expect(screen.getByText(/from the pantry/i)).toBeInTheDocument();
    expect(screen.getByText(/greek yogurt/i)).toBeInTheDocument();
  });

  it("calls addFoodLog when a recently logged food button is clicked", async () => {
    const addFoodLog = vi.fn();
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog,
      userId,
      allFoodItems: [makeLog(10, "Banana", "Snacks")],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByText(/banana · 300 kcal/i));
    await vi.waitFor(() => expect(addFoodLog).toHaveBeenCalled());
  });

  it("calls addFoodLog when a pantry favorite button is clicked", async () => {
    const addFoodLog = vi.fn();
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [makeLog(20, "Greek Yogurt", "Breakfast")],
      toggleFavorite: vi.fn(),
      addFoodLog,
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByText(/greek yogurt · 300 kcal/i));
    await vi.waitFor(() => expect(addFoodLog).toHaveBeenCalled());
  });
});

describe("Dashboard delete with undo", () => {
  it("calls deleteFoodLog when a log entry is deleted", async () => {
    const deleteFoodLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs,
      deleteFoodLog,
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /delete oatmeal/i }));
    await vi.waitFor(() => expect(deleteFoodLog).toHaveBeenCalled());
  });

  it("skips toast when userId is absent after delete", async () => {
    const deleteFoodLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: true, calorieGoal: 2000 },
      },
      dailyLogs,
      deleteFoodLog,
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId: undefined,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /delete oatmeal/i }));
    await vi.waitFor(() => expect(deleteFoodLog).toHaveBeenCalled());
  });
});

describe("Dashboard edit log dialog", () => {
  it("opens the edit dialog when a log entry edit button is clicked", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /edit oatmeal/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/edit meal entry/i)).toBeInTheDocument();
  });

  it("closes the edit dialog when dialog close button is clicked", async () => {
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /edit oatmeal/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Dashboard onboarding flow", () => {
  it("shows onboarding modal when banner button is clicked", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: false, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /open onboarding/i }));
    expect(screen.getByText("OnboardingModal")).toBeInTheDocument();
  });

  it("closes onboarding modal when close button is clicked", async () => {
    vi.mocked(appState.useAppState).mockReturnValue({
      init: {
        status: "ready",
        user: { id: userId, hasCompletedOnboarding: false, calorieGoal: 2000 },
      },
      dailyLogs: [],
      deleteFoodLog: vi.fn(),
      favoriteFoods: [],
      toggleFavorite: vi.fn(),
      addFoodLog: vi.fn(),
      userId,
      allFoodItems: [],
      tdeeProfile: null,
    } as unknown as ReturnType<typeof appState.useAppState>);
    const Dashboard = (await import("./Dashboard")).default;
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /open onboarding/i }));
    expect(screen.getByText("OnboardingModal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close onboarding/i }));
    expect(screen.queryByText("OnboardingModal")).not.toBeInTheDocument();
  });
});

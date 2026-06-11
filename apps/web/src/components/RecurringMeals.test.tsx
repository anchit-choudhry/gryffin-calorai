import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import RecurringMeals from "./RecurringMeals";
import * as appStateModule from "@/state/AppState";
import * as recurringMealFormHook from "@/hooks/useRecurringMealForm";
import type { RecurringMeal } from "@/db/dbService";
import { RecurringMealId } from "@/types";
import type { UserId } from "@/types";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    li: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <li className={className}>{children}</li>
    ),
  },
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/state/AppState");
vi.mock("@/hooks/useRecurringMealForm", () => ({
  DAY_NAMES: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  useRecurringMealForm: vi.fn(),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    onOpenChange: () => void;
    children: React.ReactNode;
  }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  FormField: ({
    render,
  }: {
    render: (p: { field: Record<string, unknown> }) => React.ReactNode;
  }) => <>{render({ field: { value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() } })}</>,
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Clock: () => null,
  Plus: () => null,
  RepeatIcon: () => null,
  Trash2: () => null,
}));

const makeRecurringMeal = (overrides: Partial<RecurringMeal> = {}): RecurringMeal => ({
  id: RecurringMealId(1),
  userId: "u1" as UserId,
  name: "Morning Oats",
  mealType: "Breakfast",
  scheduledTime: "08:00",
  foods: [],
  dayMask: 0b0111111,
  ...overrides,
});

const makeFormMock = () => {
  const { result } = renderHook(() =>
    useForm({
      defaultValues: {
        name: "",
        mealType: "Breakfast",
        foods: [],
        dayMask: 0,
        scheduledTime: "08:00",
      },
    }),
  );
  return result.current;
};

const mockAppState = (overrides: Record<string, unknown> = {}) => {
  vi.mocked(appStateModule).useAppState.mockReturnValue({
    recurringMeals: [],
    deleteRecurringMeal: vi.fn().mockResolvedValue(undefined),
    checkAndPromptRecurringMeals: vi.fn(),
    userId: "u1" as UserId,
    allFoodItems: [],
    ...overrides,
  } as unknown as ReturnType<typeof appStateModule.useAppState>);
};

const mockFormHook = (overrides: Record<string, unknown> = {}) => {
  const form = makeFormMock();
  vi.mocked(recurringMealFormHook).useRecurringMealForm.mockReturnValue({
    form,
    onSubmit: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof recurringMealFormHook.useRecurringMealForm>);
};

describe("RecurringMeals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppState();
    mockFormHook();
  });

  it("renders the section heading", () => {
    render(<RecurringMeals />);
    expect(screen.getByText("Recurring Meals")).toBeTruthy();
  });

  it("renders the Add button", () => {
    render(<RecurringMeals />);
    expect(screen.getByRole("button", { name: /add/i })).toBeTruthy();
  });

  it("calls checkAndPromptRecurringMeals on mount", () => {
    const checkAndPrompt = vi.fn();
    mockAppState({ checkAndPromptRecurringMeals: checkAndPrompt });
    render(<RecurringMeals />);
    expect(checkAndPrompt).toHaveBeenCalledOnce();
  });

  it("shows empty state when no recurring meals exist", () => {
    render(<RecurringMeals />);
    expect(screen.getByText("No recurring meals set up yet.")).toBeTruthy();
  });

  it("renders a meal name when recurring meals exist", () => {
    mockAppState({ recurringMeals: [makeRecurringMeal()] });
    render(<RecurringMeals />);
    expect(screen.getByText("Morning Oats")).toBeTruthy();
  });

  it("calls deleteRecurringMeal when delete button is clicked", async () => {
    const deleteRecurringMeal = vi.fn().mockResolvedValue(undefined);
    mockAppState({
      recurringMeals: [makeRecurringMeal({ id: RecurringMealId(42) })],
      deleteRecurringMeal,
    });
    render(<RecurringMeals />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Morning Oats" }));
    expect(deleteRecurringMeal).toHaveBeenCalledWith(RecurringMealId(42));
  });

  it("opens the dialog when Add button is clicked", () => {
    render(<RecurringMeals />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("does not render meal list when recurring meals array is empty", () => {
    render(<RecurringMeals />);
    expect(screen.queryByRole("list")).toBeNull();
  });
});

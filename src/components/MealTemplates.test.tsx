// src/components/MealTemplates.test.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import MealTemplates from "./MealTemplates";
import * as useMealTemplatesModule from "../hooks/useMealTemplates";
import { ISODate, MealPlanId, MealTemplateId, UserId } from "@/types";

vi.mock("../hooks/useMealTemplates");

vi.mock("motion/react", () => ({
  motion: {
    section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({ render }: { render: (p: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({ field: { value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() } }),
  FormItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));

const sampleTemplate = {
  id: MealTemplateId(1),
  userId: UserId("u1"),
  name: "My Breakfast",
  foods: [
    {
      name: "Oats",
      calories: 150,
      servingSize: 40,
      protein: 5,
      carbs: 27,
      fat: 3,
      mealType: "Breakfast" as const,
    },
  ],
  createdAt: "2026-05-24T08:00:00Z",
  updatedAt: "2026-05-24T08:00:00Z",
};

const samplePlan = {
  id: MealPlanId(1),
  userId: UserId("u1"),
  name: "My Week Plan",
  days: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, templateId: null })),
  createdAt: "2026-05-24T08:00:00Z",
};

const baseHook = {
  form: {
    handleSubmit: (fn: (data: { name: string }) => void) => (e: React.FormEvent) => {
      e.preventDefault?.();
      fn({ name: "Test Template" });
    },
    register: vi.fn(),
    getValues: vi.fn(() => ({ name: "" })),
    setValue: vi.fn(),
    reset: vi.fn(),
    formState: { errors: {} },
    control: {},
  },
  onSubmit: vi.fn(),
  mealTemplates: [],
  mealPlans: [],
  dailyLogs: [],
  deleteMealTemplate: vi.fn(),
  saveTemplateFromTodayLogs: vi.fn(),
  logAllFoodsFromTemplate: vi.fn(),
  copyFoodsFromDate: vi.fn(),
  saveMealPlan: vi.fn(),
  deleteMealPlan: vi.fn(),
  applyWeekPlan: vi.fn(),
};

describe("MealTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue(
      baseHook as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<MealTemplates />);
    expect(screen.getByTestId("meal-templates-section")).toBeInTheDocument();
  });

  it("shows empty-state message when no templates exist", () => {
    render(<MealTemplates />);
    expect(screen.getByText(/no saved templates/i)).toBeInTheDocument();
  });

  it("renders the Create template form with name input and Create button", () => {
    render(<MealTemplates />);
    expect(screen.getByPlaceholderText(/new template name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
  });

  it("renders a list of saved templates", () => {
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    // use selector 'p' to distinguish the template name paragraph from option elements
    expect(screen.getByText("My Breakfast", { selector: "p" })).toBeInTheDocument();
  });

  it("shows food count for each template", () => {
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    expect(screen.getByText(/1 food/i)).toBeInTheDocument();
  });

  it("calls logAllFoodsFromTemplate when Log All button is clicked", async () => {
    const mockLog = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
      logAllFoodsFromTemplate: mockLog,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const logBtn = screen.getByRole("button", { name: /log all/i });
    fireEvent.click(logBtn);
    await waitFor(() => expect(mockLog).toHaveBeenCalledWith(MealTemplateId(1)));
  });

  it("calls deleteMealTemplate when Delete button is clicked for a template", async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
      deleteMealTemplate: mockDelete,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const deleteBtn = screen.getByRole("button", { name: /delete template/i });
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(MealTemplateId(1)));
  });

  it("shows Save Today button when there are daily logs", () => {
    const log = {
      id: 1,
      userId: UserId("u1"),
      name: "Apple",
      calories: 95,
      servingSize: 1,
      protein: 0,
      carbs: 25,
      fat: 0,
      dateLogged: ISODate("2026-05-24"),
      isFavorite: false,
      mealType: "Breakfast" as const,
    };
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      dailyLogs: [log],
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    expect(screen.getByRole("button", { name: /save today/i })).toBeInTheDocument();
  });

  it("calls saveTemplateFromTodayLogs when Save Today button is clicked and name is entered", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const log = {
      id: 1,
      userId: UserId("u1"),
      name: "Apple",
      calories: 95,
      servingSize: 1,
      protein: 0,
      carbs: 25,
      fat: 0,
      dateLogged: ISODate("2026-05-24"),
      isFavorite: false,
      mealType: "Breakfast" as const,
    };
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      dailyLogs: [log],
      saveTemplateFromTodayLogs: mockSave,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const input = screen.getByPlaceholderText("Template name");
    fireEvent.change(input, { target: { value: "My Day" } });
    const saveBtn = screen.getByRole("button", { name: /save today/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith("My Day"));
  });

  it("shows Copy Yesterday button", () => {
    render(<MealTemplates />);
    expect(screen.getByRole("button", { name: /copy yesterday/i })).toBeInTheDocument();
  });

  it("calls copyFoodsFromDate with yesterday's date when Copy Yesterday is clicked", async () => {
    const mockCopy = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      copyFoodsFromDate: mockCopy,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const copyBtn = screen.getByRole("button", { name: /copy yesterday/i });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(mockCopy).toHaveBeenCalledTimes(1);
      const called = mockCopy.mock.calls[0]![0] as string;
      expect(called).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("renders the weekly plan section heading", () => {
    render(<MealTemplates />);
    expect(screen.getByText(/weekly plan/i)).toBeInTheDocument();
  });

  it("shows empty-state for plans when no plans exist", () => {
    render(<MealTemplates />);
    expect(screen.getByText(/no meal plans/i)).toBeInTheDocument();
  });

  it("renders saved meal plan names", () => {
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealPlans: [samplePlan],
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    expect(screen.getByText("My Week Plan")).toBeInTheDocument();
  });

  it("calls deleteMealPlan when Delete plan button is clicked", async () => {
    const mockDeletePlan = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealPlans: [samplePlan],
      deleteMealPlan: mockDeletePlan,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const deleteBtn = screen.getByRole("button", { name: /delete plan/i });
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(mockDeletePlan).toHaveBeenCalledWith(MealPlanId(1)));
  });

  it("calls applyWeekPlan when Apply Plan button is clicked", async () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealPlans: [samplePlan],
      applyWeekPlan: mockApply,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const applyBtn = screen.getByRole("button", { name: /apply plan/i });
    fireEvent.click(applyBtn);
    await waitFor(() => expect(mockApply).toHaveBeenCalledWith(MealPlanId(1)));
  });

  it("renders the Create Week Plan section with plan name input", () => {
    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    expect(screen.getByPlaceholderText(/plan name/i)).toBeInTheDocument();
  });

  it("renders seven day selectors in the plan creation section", () => {
    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const daySelectors = screen.getAllByRole("combobox");
    expect(daySelectors).toHaveLength(7);
  });

  it("Save Plan button is disabled when plan name is empty", () => {
    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const saveBtn = screen.getByRole("button", { name: /save plan/i });
    expect(saveBtn).toBeDisabled();
  });

  it("Save Plan button is enabled when plan name is entered", () => {
    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const nameInput = screen.getByPlaceholderText(/plan name/i);
    fireEvent.change(nameInput, { target: { value: "My Plan" } });
    const saveBtn = screen.getByRole("button", { name: /save plan/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it("calls saveMealPlan with name and 7-day array when Save Plan is clicked", async () => {
    const mockSavePlan = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      saveMealPlan: mockSavePlan,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const nameInput = screen.getByPlaceholderText(/plan name/i);
    fireEvent.change(nameInput, { target: { value: "Week 1" } });
    const saveBtn = screen.getByRole("button", { name: /save plan/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSavePlan).toHaveBeenCalledWith({
        name: "Week 1",
        days: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, templateId: null })),
      });
    });
  });

  it("populates day selectors with available templates as options", () => {
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const options = screen.getAllByRole("option", { name: "My Breakfast" });
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onSubmit when Create form is submitted", async () => {
    const mockOnSubmit = vi.fn((e: React.FormEvent) => e.preventDefault?.());
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      onSubmit: mockOnSubmit,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    const createBtn = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(createBtn);
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
  });

  it("updates day template selection when a select changes to a template", async () => {
    const mockSavePlan = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      mealTemplates: [sampleTemplate],
      saveMealPlan: mockSavePlan,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const monSelect = screen.getByRole("combobox", { name: /template for mon/i });
    fireEvent.change(monSelect, { target: { value: "1" } });

    const nameInput = screen.getByPlaceholderText(/plan name/i);
    fireEvent.change(nameInput, { target: { value: "Week A" } });
    fireEvent.click(screen.getByRole("button", { name: /save plan/i }));

    await waitFor(() => {
      expect(mockSavePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Week A",
          days: expect.arrayContaining([{ dayIndex: 0, templateId: 1 }]),
        }),
      );
    });
  });

  it("clears plan name input after saving a plan", async () => {
    const mockSavePlan = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMealTemplatesModule.useMealTemplates).mockReturnValue({
      ...baseHook,
      saveMealPlan: mockSavePlan,
    } as unknown as ReturnType<typeof useMealTemplatesModule.useMealTemplates>);

    render(<MealTemplates />);
    fireEvent.click(screen.getByRole("button", { name: /create week plan/i }));
    const nameInput = screen.getByPlaceholderText(/plan name/i);
    fireEvent.change(nameInput, { target: { value: "Week 1" } });
    fireEvent.click(screen.getByRole("button", { name: /save plan/i }));

    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe("");
    });
  });
});

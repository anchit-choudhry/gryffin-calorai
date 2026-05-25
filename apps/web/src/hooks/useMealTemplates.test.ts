// src/hooks/useMealTemplates.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMealTemplates } from "./useMealTemplates";
import * as appState from "../state/AppState";
import { ISODate, MealTemplateId, UserId } from "@/types";

vi.mock("../state/AppState");

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

const baseMock = {
  mealTemplates: [],
  mealPlans: [],
  dailyLogs: [],
  addMealTemplate: vi.fn(),
  updateMealTemplate: vi.fn(),
  deleteMealTemplate: vi.fn(),
  saveTemplateFromTodayLogs: vi.fn(),
  logAllFoodsFromTemplate: vi.fn(),
  copyFoodsFromDate: vi.fn(),
  saveMealPlan: vi.fn(),
  deleteMealPlan: vi.fn(),
  applyWeekPlan: vi.fn(),
};

describe("useMealTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns form, onSubmit, and state slices", () => {
    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.form).toBeDefined();
    expect(typeof result.current.onSubmit).toBe("function");
    expect(result.current.mealTemplates).toStrictEqual([]);
    expect(result.current.mealPlans).toStrictEqual([]);
  });

  it("has empty name as default form value", () => {
    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.form.getValues("name")).toBe("");
  });

  it("calls addMealTemplate with name on valid submit", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addMealTemplate: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());

    await act(async () => {
      result.current.form.setValue("name", "Keto Lunch");
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: "Keto Lunch" }));
  });

  it("resets form name to empty after successful submit", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addMealTemplate: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());

    await act(async () => {
      result.current.form.setValue("name", "Keto Lunch");
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.form.getValues("name")).toBe("");
  });

  it("does not call addMealTemplate when name is empty", async () => {
    const mockAdd = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      addMealTemplate: mockAdd,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("exposes mealTemplates from state", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      mealTemplates: [sampleTemplate],
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.mealTemplates).toHaveLength(1);
    expect(result.current.mealTemplates[0]!.name).toBe("My Breakfast");
  });

  it("exposes deleteMealTemplate from state", () => {
    const mockDelete = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      deleteMealTemplate: mockDelete,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.deleteMealTemplate).toBe(mockDelete);
  });

  it("exposes logAllFoodsFromTemplate from state", () => {
    const mockLog = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      logAllFoodsFromTemplate: mockLog,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.logAllFoodsFromTemplate).toBe(mockLog);
  });

  it("exposes saveTemplateFromTodayLogs from state", () => {
    const mockSave = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      saveTemplateFromTodayLogs: mockSave,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.saveTemplateFromTodayLogs).toBe(mockSave);
  });

  it("exposes copyFoodsFromDate from state", () => {
    const mockCopy = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      copyFoodsFromDate: mockCopy,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.copyFoodsFromDate).toBe(mockCopy);
  });

  it("exposes saveMealPlan from state", () => {
    const mockSavePlan = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      saveMealPlan: mockSavePlan,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.saveMealPlan).toBe(mockSavePlan);
  });

  it("exposes deleteMealPlan from state", () => {
    const mockDeletePlan = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      deleteMealPlan: mockDeletePlan,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.deleteMealPlan).toBe(mockDeletePlan);
  });

  it("exposes applyWeekPlan from state", () => {
    const mockApply = vi.fn();
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      applyWeekPlan: mockApply,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.applyWeekPlan).toBe(mockApply);
  });

  it("exposes dailyLogs from state for template-from-today flow", () => {
    const logs = [
      {
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
      },
    ];
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      dailyLogs: logs,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useMealTemplates());
    expect(result.current.dailyLogs).toHaveLength(1);
  });
});

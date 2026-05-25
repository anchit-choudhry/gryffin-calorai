import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import FoodLogger from "./FoodLogger";
import type { FoodItem } from "../db/dbService";

const mockForm = vi.hoisted(() => ({
  control: {},
  setValue: vi.fn(),
  formState: {},
}));
const mockSubmitFoodLog = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockResetForm = vi.hoisted(() => vi.fn());
const mockIsLoading = vi.hoisted(() => ({ value: false }));
const mockIsEditMode = vi.hoisted(() => ({ value: false }));
const mockFieldValue = vi.hoisted(() => ({ current: "" as string | number | undefined }));

vi.mock("../hooks/useFoodForm", () => ({
  useFoodForm: () => ({
    form: mockForm,
    isLoading: mockIsLoading.value,
    isEditMode: mockIsEditMode.value,
    submitFoodLog: mockSubmitFoodLog,
    resetForm: mockResetForm,
  }),
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({
    render,
    name,
  }: {
    name: string;
    render: (p: { field: Record<string, unknown> }) => React.ReactNode;
  }) =>
    render({
      field: {
        value: mockFieldValue.current,
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("lucide-react", () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "reset" | "submit" | "button";
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe("FoodLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading.value = false;
    mockIsEditMode.value = false;
    mockFieldValue.current = "";
    mockSubmitFoodLog.mockResolvedValue(true);
  });

  it("renders Food Name label", () => {
    render(<FoodLogger />);
    expect(screen.getByText("Food Name")).toBeTruthy();
  });

  it("renders all four meal type buttons", () => {
    render(<FoodLogger />);
    expect(screen.getByText("Breakfast")).toBeTruthy();
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("Dinner")).toBeTruthy();
    expect(screen.getByText("Snacks")).toBeTruthy();
  });

  it("submit button reads 'Log Food' in add mode", () => {
    render(<FoodLogger />);
    expect(screen.getByText("Log Food")).toBeTruthy();
  });

  it("submit button reads 'Update Food' in edit mode", () => {
    mockIsEditMode.value = true;
    render(<FoodLogger />);
    expect(screen.getByText("Update Food")).toBeTruthy();
  });

  it("Cancel button is not shown in add mode", () => {
    render(<FoodLogger />);
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("Cancel button is shown in edit mode", () => {
    mockIsEditMode.value = true;
    render(<FoodLogger initialFood={{ id: 1 } as unknown as FoodItem} />);
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("submit button is disabled and shows Saving... while loading", () => {
    mockIsLoading.value = true;
    render(<FoodLogger />);
    expect(screen.getByText("Saving...")).toBeTruthy();
    expect((screen.getByText("Saving...").closest("button") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("calls onSuccess after successful submit", async () => {
    const onSuccess = vi.fn();
    render(<FoodLogger onSuccess={onSuccess} />);
    const form = document.querySelector("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onSuccess when submitFoodLog returns false", async () => {
    mockSubmitFoodLog.mockResolvedValue(false);
    const onSuccess = vi.fn();
    render(<FoodLogger onSuccess={onSuccess} />);
    const form = document.querySelector("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("clicking Cancel calls resetForm and onCancel", () => {
    mockIsEditMode.value = true;
    const onCancel = vi.fn();
    render(<FoodLogger initialFood={{ id: 1 } as unknown as FoodItem} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockResetForm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  describe("prefillName sanitization", () => {
    it("applies prefillName to the name field when no initialFood", async () => {
      await act(async () => {
        render(<FoodLogger prefillName="Chicken Breast" />);
      });
      expect(mockForm.setValue).toHaveBeenCalledWith("name", "Chicken Breast");
    });

    it("strips angle brackets from prefillName (XSS prevention)", async () => {
      await act(async () => {
        render(<FoodLogger prefillName="<script>alert(1)</script>" />);
      });
      const calls = mockForm.setValue.mock.calls;
      const nameCalls = calls.filter(([field]) => field === "name");
      nameCalls.forEach(([, value]) => {
        expect(value).not.toContain("<");
        expect(value).not.toContain(">");
      });
    });

    it("does not apply prefillName when initialFood is provided", async () => {
      await act(async () => {
        render(
          <FoodLogger
            prefillName="Banana"
            initialFood={{ id: 1, name: "Apple" } as unknown as FoodItem}
          />,
        );
      });
      const nameCalls = mockForm.setValue.mock.calls.filter(([f]) => f === "name");
      expect(nameCalls).toHaveLength(0);
    });

    it("ignores prefillName that is empty after sanitization", async () => {
      await act(async () => {
        render(<FoodLogger prefillName="<><><>" />);
      });
      const nameCalls = mockForm.setValue.mock.calls.filter(([f]) => f === "name");
      expect(nameCalls).toHaveLength(0);
    });

    it("truncates prefillName to 100 characters", async () => {
      const longName = "a".repeat(150);
      await act(async () => {
        render(<FoodLogger prefillName={longName} />);
      });
      const nameCalls = mockForm.setValue.mock.calls.filter(([f]) => f === "name");
      expect(nameCalls[0]?.[1]).toHaveLength(100);
    });
  });

  describe("Advanced Nutrition section", () => {
    it("renders the Advanced Nutrition toggle button", () => {
      render(<FoodLogger />);
      expect(screen.getByRole("button", { name: /advanced nutrition/i })).toBeTruthy();
    });

    it("micronutrient fields are hidden by default", () => {
      render(<FoodLogger />);
      expect(screen.queryByText("Vitamins")).toBeNull();
      expect(screen.queryByText("Vitamin C")).toBeNull();
      expect(screen.queryByText("Calcium")).toBeNull();
    });

    it("clicking the toggle shows all three group headers", async () => {
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      expect(screen.getByText("Vitamins")).toBeTruthy();
      expect(screen.getByText("Minerals")).toBeTruthy();
      expect(screen.getByText("Other Nutrients")).toBeTruthy();
    });

    it("clicking the toggle shows vitamin field labels", async () => {
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      expect(screen.getByText("Vitamin A")).toBeTruthy();
      expect(screen.getByText("Vitamin C")).toBeTruthy();
      expect(screen.getByText("Vitamin D")).toBeTruthy();
    });

    it("clicking the toggle shows mineral field labels", async () => {
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      expect(screen.getByText("Calcium")).toBeTruthy();
      expect(screen.getByText("Iron")).toBeTruthy();
      expect(screen.getByText("Sodium")).toBeTruthy();
    });

    it("clicking the toggle shows other nutrient field labels", async () => {
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      expect(screen.getByText("Fiber")).toBeTruthy();
      expect(screen.getByText("Cholesterol")).toBeTruthy();
      expect(screen.getByText("Saturated Fat")).toBeTruthy();
    });

    it("clicking the toggle twice collapses the section", async () => {
      render(<FoodLogger />);
      const toggleBtn = screen.getByRole("button", { name: /advanced nutrition/i });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.getByText("Vitamin C")).toBeTruthy();
      await act(async () => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.queryByText("Vitamin C")).toBeNull();
    });

    it("shows % DV indicator when field has a positive numeric value", async () => {
      mockFieldValue.current = 45;
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      const dvLabels = screen.getAllByText(/% DV/);
      expect(dvLabels.length).toBeGreaterThan(0);
    });

    it("does not show % DV indicator when field value is zero", async () => {
      mockFieldValue.current = 0;
      render(<FoodLogger />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /advanced nutrition/i }));
      });
      expect(screen.queryByText(/% DV/)).toBeNull();
    });
  });
});
